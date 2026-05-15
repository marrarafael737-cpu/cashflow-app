/* js/transactions.js - Data Management & CRUD */

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


async function initializeCategories(userId) {
    try {
        let { data: cats, error: e1 } = await supabase.from('categorias').select('*').eq('user_id', userId);
        const { data: subs, error: e2 } = await supabase.from('subcategorias').select('*').eq('user_id', userId);

        if (e1 || e2) throw (e1 || e2);

        // Se o usuário não tem categorias, vamos criar o "Kit Básico"
        if (!cats || cats.length === 0) {
            console.log('C.A.S.H. Unit: Criando categorias padrão para novo usuário...');
            const defaultCats = [
                { nome: 'Alimentação', tipo: 'saida', user_id: userId },
                { nome: 'Moradia', tipo: 'saida', user_id: userId },
                { nome: 'Lazer', tipo: 'saida', user_id: userId },
                { nome: 'Saúde', tipo: 'saida', user_id: userId },
                { nome: 'Transporte', tipo: 'saida', user_id: userId },
                { nome: 'Salário', tipo: 'entrada', user_id: userId }
            ];
            
            const { data: newCats, error: insertError } = await supabase.from('categorias').insert(defaultCats).select();
            if (insertError) throw insertError;
            cats = newCats;
        }

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
        
        // Recalcular saldos para refletir nas UIs de investimento e reserva
        if (typeof calculateSummary === 'function') {
            calculateSummary(window._allTransactions || []);
        } else if (typeof Investments !== 'undefined' && typeof Investments.updateSummaryCards === 'function') {
            Investments.updateSummaryCards();
        }
    } catch (err) { console.error('Erro em loadContas:', err); }
}

async function loadMetas(userId) {
    try {
        const { data, error } = await supabase.from('metas').select('*').eq('user_id', userId);
        if (error) throw error;
        _metas = data || [];
        if (typeof renderMetas === 'function') renderMetas();
        if (typeof Investments !== 'undefined' && typeof Investments.updateSummaryCards === 'function') {
            Investments.updateSummaryCards();
        }
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
    
    // Phase 4 Bugfix: Force Local Timezone instead of UTC to avoid midnight shift
    const todayStr = now.toLocaleDateString('en-CA'); 

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
        const { data, error } = await supabase.from('transacoes')
            .select('*')
            .eq('user_id', userId)
            .order('data', { ascending: false });
        
        if (error) throw error;

        // Phase 4: Integrar transações offline pendentes
        const offlineQueue = (typeof OfflineSync !== 'undefined') ? OfflineSync.getQueue() : [];
        const offlineTxs = offlineQueue.map(item => {
            const tx = Array.isArray(item.data) ? item.data[0] : item.data;
            return {
                ...tx,
                id: item.id,
                is_pending: true,
                created_at: item.timestamp
            };
        });

        const combined = [...offlineTxs, ...data];

        _allTransactions = combined.map(t => {
            const cat = _categories.find(c => c.id === t.categoria_id);
            return { ...t, categoria_nome: cat ? cat.nome : 'Geral' };
        });

        filterAndRenderData();
        if (typeof updateSummary === 'function') updateSummary();
    } catch (err) { 
        console.error('Erro ao carregar transações:', err); 
    }
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
    
    // Phase 4 Bugfix: Prevent duplicate clicks immediately
    if (btn && (btn.disabled || btn.classList.contains('loading'))) return;
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    const transactionsToInsert = [];

    // --- Lógica de Transferência ---
    if (tipo === 'transferencia') {
        const contaDestinoId = prompt("Selecione a conta de destino (ID ou Nome):"); // Simplificado para o exemplo, ideal seria um select dinâmico
        if (!contaDestinoId) {
            showToast('Transferência cancelada: Conta de destino necessária.', 'alert');
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
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
                data: dataParcela.toLocaleDateString('en-CA'),
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

    // --- PHASE 4: OFFLINE SYNC ENGINE ---
    if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
        OfflineSync.addToQueue(transactionsToInsert.length > 1 ? transactionsToInsert : transactionsToInsert[0]);
        
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        document.getElementById('transaction-form').reset();
        const fp = document.getElementById('field-parcelas');
        if (fp) fp.style.display = 'none';
        
        if (typeof addXP === 'function') addXP(5); // XP reduzido para offline (ganha o resto no sync)
        return;
    }

    // --- ONLINE FLOW ---
    const { error } = await supabase.from('transacoes').insert(transactionsToInsert);

    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

    if (!error) {
        showToast(transactionsToInsert.length > 1 ? 'Lançamentos sincronizados!' : 'Transação salva com sucesso!', 'success');
        document.getElementById('transaction-form').reset();
        const fp = document.getElementById('field-parcelas');
        if (fp) fp.style.display = 'none';
        
        await loadTransactions(userId);
        if (typeof addXP === 'function') addXP(10 * transactionsToInsert.length);
    } else {
        console.error('Erro ao inserir:', error);
        showToast('Falha ao sincronizar com a nuvem.', 'error');
    }
}
