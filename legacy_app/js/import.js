/* js/import.js - CSV/OFX Data Import Logic */

async function handleImport(file, userId) {
    if (!file) return;

    const reader = new FileReader();
    const isOFX = file.name.toLowerCase().endsWith('.ofx');

    reader.onload = async (e) => {
        const text = e.target.result;
        let transactionsToInsert = [];

        if (isOFX) {
            transactionsToInsert = parseOFX(text, userId);
        } else {
            transactionsToInsert = parseCSV(text, userId);
        }

        if (transactionsToInsert.length > 0) {
            try {
                const { error } = await supabase.from('transacoes').insert(transactionsToInsert);
                if (error) throw error;
                
                showToast(`${transactionsToInsert.length} transações importadas com sucesso!`, 'success');
                
                // Ganhar XP por importar e atualizar conquistas
                if (typeof addXP === 'function') addXP(transactionsToInsert.length * 5);
                
                const count = parseInt(localStorage.getItem(`import_count_${userId}`) || '0') + 1;
                localStorage.setItem(`import_count_${userId}`, count);
                if (typeof checkBadges === 'function') checkBadges(userId);

                // Atualizar dados globais e UI
                if (typeof loadTransactions === 'function') await loadTransactions(userId);
                if (typeof filterAndRenderData === 'function') filterAndRenderData();
            } catch (err) {
                showToast('Erro ao salvar no banco: ' + err.message, 'error');
            }
        } else {
            showToast('Nenhuma transação válida encontrada no arquivo.', 'alert');
        }
    };
    reader.readAsText(file);
}

function parseCSV(text, userId) {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const header = rows[0];
    const separator = header.includes(';') ? ';' : ',';
    const headers = header.split(separator).map(h => h.trim().toLowerCase());

    const colMap = {
        data: headers.findIndex(h => h.includes('data') || h.includes('date')),
        descricao: headers.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('memo')),
        valor: headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quant')),
        categoria: headers.findIndex(h => h.includes('cat'))
    };

    if (colMap.data === -1 || colMap.valor === -1) {
        showToast('Colunas de Data/Valor não identificadas no CSV.', 'alert');
        return [];
    }

    const results = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(separator).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2) continue;

        try {
            let dataStr = formatImportedDate(cols[colMap.data]);
            let valorRaw = cols[colMap.valor].replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
            let valor = parseFloat(valorRaw);
            if (isNaN(valor)) continue;

            const tipo = valor >= 0 ? 'entrada' : 'saida';
            const valorAbs = Math.abs(valor);
            let descricao = colMap.descricao !== -1 ? cols[colMap.descricao] : 'Importado CSV';

            results.push({
                user_id: userId,
                data: dataStr,
                descricao: descricao,
                valor: valorAbs,
                tipo: tipo,
                categoria_id: inferCategory(descricao, tipo),
                conta_id: _contas[0]?.id
            });
        } catch (e) {}
    }
    return results;
}

function parseOFX(text, userId) {
    const results = [];
    // Regex simples para capturar blocos STMTTRN
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = transactionRegex.exec(text)) !== null) {
        const block = match[1];
        
        const type = getOFXTag(block, 'TRNTYPE');
        const dateRaw = getOFXTag(block, 'DTPOSTED');
        const amountRaw = getOFXTag(block, 'TRNAMT');
        const memo = getOFXTag(block, 'MEMO') || getOFXTag(block, 'NAME') || 'Importado OFX';

        if (dateRaw && amountRaw) {
            const valor = parseFloat(amountRaw);
            const tipo = valor >= 0 ? 'entrada' : 'saida';
            const valorAbs = Math.abs(valor);
            
            // Format OFX Date: YYYYMMDD...
            const y = dateRaw.substring(0, 4);
            const m = dateRaw.substring(4, 6);
            const d = dateRaw.substring(6, 8);
            const dataStr = `${y}-${m}-${d}`;

            results.push({
                user_id: userId,
                data: dataStr,
                descricao: memo,
                valor: valorAbs,
                tipo: tipo,
                categoria_id: inferCategory(memo, tipo),
                conta_id: _contas[0]?.id
            });
        }
    }
    return results;
}

function getOFXTag(text, tag) {
    const regex = new RegExp(`<${tag}>([^<\\n\\r]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

function inferCategory(desc, tipo) {
    const d = desc.toLowerCase();
    const mappings = {
        'alimentação': ['ifood', 'restaurante', 'lanche', 'cafe', 'padaria', 'mcdonalds', 'burger'],
        'transporte': ['uber', '99app', 'posto', 'gasolina', 'combustivel', 'estacionamento'],
        'mercado': ['carrefour', 'pao de acucar', 'supermercado', 'extra', 'atacadista'],
        'assinaturas': ['netflix', 'spotify', 'disney', 'amazon prime', 'icloud', 'google storage']
    };

    for (const [catName, keywords] of Object.entries(mappings)) {
        if (keywords.some(k => d.includes(k))) {
            const found = _categories.find(c => c.nome.toLowerCase().includes(catName));
            if (found) return found.id;
        }
    }

    const defaultCat = _categories.find(c => c.tipo === tipo);
    return defaultCat ? defaultCat.id : null;
}

function formatImportedDate(raw) {
    if (raw.includes('/')) {
        const parts = raw.split('/');
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return raw;
}

function initImportEvents(userId) {
    const importInput = document.getElementById('csv-import-input');
    const importTrigger = document.getElementById('btn-trigger-import');
    
    if (importTrigger && importInput) {
        importTrigger.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImport(file, userId);
            }
        });
    }
}
