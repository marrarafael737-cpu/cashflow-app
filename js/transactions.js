/* js/transactions.js - Data Management & CRUD */

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


async function initializeCategories(userId) {
    try {
        const { data: cats, error: e1 } = await supabase.from('categorias').select('*').eq('user_id', userId);
        const { data: subs, error: e2 } = await supabase.from('subcategorias').select('*').eq('user_id', userId);

        if (e1 || e2) throw (e1 || e2);

        _categories = cats;
        _subcategories = subs;
        updateCategoryDropdown();
        updateRecurringCategoryDropdown(); // Adicionado para o novo modal
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
    }
}

async function loadContas(userId) {
    try {
        const { data, error } = await supabase.from('contas').select('*').eq('user_id', userId);
        if (error) throw error;
        _contas = data;
        renderContas();
        updateAccountDropdown();
    } catch (err) { console.error(err); }
}

async function loadMetas(userId) {
    try {
        const { data, error } = await supabase.from('metas').select('*').eq('user_id', userId);
        if (error) throw error;
        _metas = data || [];
        if (typeof renderMetas === 'function') renderMetas();
    } catch (err) {
        console.warn('Erro ao carregar metas:', err.message);
        _metas = [];
    }
}

async function loadOrcamentos(userId) {
    try {
        const { data, error } = await supabase.from('orcamentos').select('*, categorias(nome)').eq('user_id', userId);
        if (error) throw error;
        _budgets = data || [];
        if (typeof renderOrcamentos === 'function') renderOrcamentos();
    } catch (err) {
        console.warn('Erro ao carregar orçamentos:', err.message);
        _budgets = [];
    }
}

function updateRecurringCategoryDropdown() {
    const catSelect = document.getElementById('rec-categoria');
    const accSelect = document.getElementById('rec-conta');

    if (catSelect && _categories) {
        catSelect.innerHTML = '<option value="">Selecione...</option>' +
            _categories.map(c => `<option value="${c.id}">${escapeHTML(c.nome)}</option>`).join('');
    }

    if (accSelect && _contas) {
        accSelect.innerHTML = '<option value="">Selecione...</option>' +
            _contas.map(c => `<option value="${c.id}">${escapeHTML(c.nome)}</option>`).join('');
    }
}

async function loadRecorrencias(userId) {
    try {
        const { data, error } = await supabase.from('recorrencias').select('*').eq('user_id', userId);
        if (error) throw error;
        _recorrencias = data || [];
        if (typeof renderRecurring === 'function') renderRecurring();
    } catch (err) {
        console.warn('Erro ao carregar recorrências:', err.message);
        _recorrencias = [];
    }
}

async function handleAddRecurrence(userId) {

    const desc = document.getElementById('rec-desc').value;
    const valorRaw = document.getElementById('rec-valor').value.replace(',', '.');
    const valor = parseFloat(valorRaw);
    const tipo = document.getElementById('rec-tipo').value;
    const dia = parseInt(document.getElementById('rec-dia').value);
    const categoriaId = document.getElementById('rec-categoria').value;
    const contaId = document.getElementById('rec-conta').value;

    if (!desc || isNaN(valor) || valor <= 0 || isNaN(dia) || dia < 1 || dia > 31 || !categoriaId || !contaId) {
        showToast('Preencha todos os campos corretamente. O valor deve ser maior que zero.', 'alert');
        return;
    }

    const btn = document.querySelector('#recurring-form button[type="submit"]');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }


    try {
        const { data, error } = await supabase.from('recorrencias').insert([{
            descricao: desc,
            valor,
            tipo,
            dia_vencimento: dia,
            categoria_id: categoriaId,
            conta_id: contaId,
            user_id: userId,
            status: 'ativo'
        }]);

        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

        if (!error) {

            showToast('Recorrência ativada com sucesso!', 'success');

            // Resetar formulário
            const form = document.getElementById('recurring-form');
            if (form) form.reset();

            // Fechar modal (tentar ambos os métodos para garantir)
            const modal = document.getElementById('modal-recorrencia');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }

            // Recarregar dados
            await loadRecorrencias(userId);
            if (typeof filterAndRenderData === 'function') filterAndRenderData();
        } else {
            throw error;
        }
    } catch (err) {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        console.error('Erro ao salvar recorrência:', err);
        showToast('Erro ao salvar recorrência: ' + (err.message || 'Erro desconhecido'), 'error');
    }

}

/**
 * Verifica e processa recorrências pendentes para o mês atual
 */
async function processRecurringTransactions(userId) {


    if (!_recorrencias || _recorrencias.length === 0) return;

    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    let processedCount = 0;

    for (const r of _recorrencias) {
        if (r.status !== 'ativo') continue;

        // Verificar se já foi pago este mês
        const lastPaid = r.ultimo_pagamento ? new Date(r.ultimo_pagamento + 'T00:00:00') : null;
        const isPaidThisMonth = lastPaid && (lastPaid.getMonth() + 1) === currentMonth && lastPaid.getFullYear() === currentYear;

        // Se o dia de vencimento já passou (ou é hoje) e ainda não foi pago este mês
        if (today >= r.dia_vencimento && !isPaidThisMonth) {


            try {
                // 1. Criar a transação
                const { error: transError } = await supabase.from('transacoes').insert([{
                    user_id: userId,
                    descricao: `[AUTO] ${r.descricao}`,
                    valor: r.valor,
                    tipo: r.tipo,
                    categoria_id: r.categoria_id,
                    conta_id: r.conta_id,
                    data: todayStr, // Lança com a data de hoje (dia do processamento)
                    is_recurring_origin: true
                }]);

                if (transError) throw transError;

                // 2. Atualizar a data do último pagamento na recorrência
                const { error: updateError } = await supabase.from('recorrencias')
                    .update({ ultimo_pagamento: todayStr })
                    .eq('id', r.id);

                if (updateError) throw updateError;

                processedCount++;
            } catch (err) {
                console.error(`Erro ao processar recorrência ${r.descricao}:`, err);
            }
        }
    }

    if (processedCount > 0) {
        showToast(`${processedCount} recorrências foram lançadas automaticamente! 🤖`, 'success');
        // Recarregar transações para refletir as novas
        await loadTransactions(userId);
    }
}

async function loadTransactions(userId) {
    try {
        const { data, error } = await supabase.from('transacoes').select('*').eq('user_id', userId).order('data', { ascending: false });
        if (error) throw error;
        _allTransactions = data.map(t => {
            const cat = _categories.find(c => c.id === t.categoria_id);
            return { ...t, categoria_nome: cat ? cat.nome : 'Geral' };
        });
        filterAndRenderData();
    } catch (err) { console.error(err); }
}

async function handleAddTransaction(userId) {
    const desc = document.getElementById('descricao').value;
    const valorRaw = document.getElementById('valor').value;
    const tipo = document.getElementById('tipo').value;
    const catId = document.getElementById('categoria').value;
    const contaId = document.getElementById('conta').value;
    const data = document.getElementById('data').value;

    // Novos Campos
    const formaPagamento = document.getElementById('forma-pagamento').value;
    const parcelasTotal = parseInt(document.getElementById('parcelas').value) || 1;

    const valor = parseFloat(valorRaw.replace(',', '.'));

    if (!desc || isNaN(valor) || valor <= 0 || !catId || !contaId || !data) {
        showToast('Preencha todos os campos corretamente. O valor deve ser maior que zero.', 'alert');
        return;
    }

    const btn = document.querySelector('#transaction-form button[type="submit"]');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    const transactionsToInsert = [];

    // --- Lógica de Transferência ---
    if (tipo === 'transferencia') {
        const contaDestinoId = prompt("Selecione a conta de destino (ID ou Nome):"); // Simplificado para o exemplo, ideal seria um select dinâmico
        if (!contaDestinoId) {
            showToast('Transferência cancelada: Conta de destino necessária.', 'alert');
            return;
        }

        // Saída da conta A
        transactionsToInsert.push({
            descricao: `Transferência: ${desc}`,
            valor: valor,
            tipo: 'saida',
            categoria_id: catId,
            conta_id: contaId,
            data,
            forma_pagamento,
            user_id: userId
        });

        // Entrada na conta B (Tentar achar conta por nome se for string)
        let finalDestId = contaDestinoId;
        const targetAccount = _contas.find(c => c.nome.toLowerCase() === contaDestinoId.toLowerCase() || c.id === contaDestinoId);
        if (targetAccount) finalDestId = targetAccount.id;

        transactionsToInsert.push({
            descricao: `Transferência (Recebida): ${desc}`,
            valor: valor,
            tipo: 'entrada',
            categoria_id: catId,
            conta_id: finalDestId,
            data,
            forma_pagamento,
            user_id: userId
        });
    }
    // --- Lógica de Crédito Parcelado ---
    else if (formaPagamento === 'credito' && parcelasTotal > 1) {
        const valorParcela = valor / parcelasTotal;
        let dataBase = new Date(data + 'T00:00:00');

        for (let i = 1; i <= parcelasTotal; i++) {
            const dataParcela = new Date(dataBase);
            dataParcela.setMonth(dataBase.getMonth() + (i - 1));

            transactionsToInsert.push({
                descricao: `${desc} (${i}/${parcelasTotal})`,
                valor: valorParcela,
                tipo,
                categoria_id: catId,
                conta_id: contaId,
                data: dataParcela.toISOString().split('T')[0],
                forma_pagamento: formaPagamento,
                parcelas_total: parcelasTotal,
                parcela_atual: i,
                user_id: userId
            });
        }
    }
    // --- Lógica Simples com Piggy Bank ---
    else {
        transactionsToInsert.push({
            descricao: desc,
            valor: valor,
            tipo,
            categoria_id: catId,
            conta_id: contaId,
            data,
            forma_pagamento: formaPagamento,
            parcelas_total: 1,
            parcela_atual: 1,
            user_id: userId
        });

        // Automação Piggy Bank (Arredondamento)
        if (tipo === 'saida' && typeof processPiggyBank === 'function') {
            const troco = processPiggyBank(valor);
            if (troco > 0) {
                // Criar transação de arredondamento para conta "Cofre" ou "Metas"
                const metaCofre = _metas.find(m => m.nome.toLowerCase().includes('cofre') || m.nome.toLowerCase().includes('reserva'));
                if (metaCofre) {
                    transactionsToInsert.push({
                        descricao: `Piggy Bank: ${desc}`,
                        valor: troco,
                        tipo: 'saida', // Sai da conta principal
                        categoria_id: catId,
                        conta_id: contaId,
                        data,
                        user_id: userId,
                        is_piggy: true
                    });
                    // Idealmente aqui também atualizaríamos a meta_id se houvesse campo, 
                    // mas vamos manter simples: duas transações (saída conta, entrada meta/saldo simbólico)
                }
            }
        }
    }

    // --- OFFLINE CHECK (IndexedDB) ---
    if (!navigator.onLine) {
        try {
            await saveOfflineTransaction(transactionsToInsert);
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
            document.getElementById('transaction-form').reset();
            if (document.getElementById('field-parcelas')) document.getElementById('field-parcelas').style.display = 'none';
            
            // Atualizar UI localmente
            _allTransactions = [...(Array.isArray(transactionsToInsert) ? transactionsToInsert : [transactionsToInsert]), ..._allTransactions];
            if (typeof filterAndRenderData === 'function') filterAndRenderData();
            
            showToast('Você está offline. O lançamento foi salvo localmente e será sincronizado depois! 📥', 'info');
            if (typeof addXP === 'function') addXP(10);
            return;
        } catch (err) {
            console.error('Erro ao salvar offline:', err);
        }
    }

    const { error } = await supabase.from('transacoes').insert(transactionsToInsert);

    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

    if (!error) {
        showToast(transactionsToInsert.length > 1 ? 'Transações geradas com sucesso!' : 'Transação salva!', 'success');
        document.getElementById('transaction-form').reset();
        const fp = document.getElementById('field-parcelas');
        if (fp) fp.style.display = 'none';
        await loadTransactions(userId);
        if (typeof addXP === 'function') addXP(10 * transactionsToInsert.length);

    } else {
        console.error('Erro ao inserir:', error);
        showToast('Erro ao salvar transação.', 'error');
    }
}

function renderContas() {
    const list = document.getElementById('accounts-list');
    if (!list || !_contas) return;

    if (_contas.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h4>Nenhuma conta</h4>
                <p>Adicione um banco ou carteira para começar.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = _contas.map(c => {
        const balance = calculateAccountBalance(c.id, c.saldo_inicial);
        const isCredit = c.tipo === 'credito';
        const escapedNome = escapeHTML(c.nome);

        return `
            <div class="account-card ${isCredit ? 'credit-card' : ''}" style="--account-color: ${c.cor}">
                <div class="account-header">
                    <div class="account-name">${escapedNome}</div>
                    ${isCredit ? '<span class="badge-credit">Cartão</span>' : ''}
                </div>
                <div class="account-balance">${formatar(balance)}</div>
                ${isCredit ? `
                    <div class="credit-info">
                        <span>Fatura vence dia ${c.dia_vencimento || 10}</span>
                        <div class="limit-bar">
                            <div class="limit-fill" style="width: ${Math.min(100, (Math.abs(balance) / 5000) * 100)}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function calculateAccountBalance(accountId, initial) {
    let current = parseFloat(initial);
    _allTransactions.filter(t => t.conta_id === accountId).forEach(t => {
        if (t.tipo === 'entrada') current += parseFloat(t.valor);
        else current -= parseFloat(t.valor);
    });
    return current;
}
