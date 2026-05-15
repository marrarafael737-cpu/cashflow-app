/* js/ui/credit-cards.js - Invoice Management & Payment Flows */

let _currentInvoiceAccountId = null;
let _currentInvoiceMonth = new Date().getMonth();
let _currentInvoiceYear = new Date().getFullYear();

window.handleOpenFaturas = async function(contaId) {
    const account = _contas.find(c => c.id === contaId);
    if (!account || account.tipo !== 'credito') return;

    _currentInvoiceAccountId = contaId;
    const now = new Date();
    _currentInvoiceMonth = now.getMonth();
    _currentInvoiceYear = now.getFullYear();

    const modalTitle = document.getElementById('invoice-modal-title');
    const iconBg = document.getElementById('invoice-card-icon-bg');
    const icon = document.getElementById('invoice-card-icon');
    
    if (modalTitle) modalTitle.textContent = `Fatura: ${account.nome}`;
    if (iconBg) iconBg.style.background = `${account.cor || 'var(--color-primary)'}20`;
    if (icon) icon.style.color = account.cor || 'var(--color-primary)';
    
    window.renderInvoiceTabs(account);
    window.renderInvoiceTransactions(contaId, _currentInvoiceMonth, _currentInvoiceYear);
    
    if (window.openModal) window.openModal('modal-faturas');
};

window.renderInvoiceTabs = function(account) {
    const tabsContainer = document.getElementById('invoice-months-tabs');
    if (!tabsContainer) return;

    const months = [];
    const now = new Date();
    for (let i = -3; i <= 2; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({
            month: d.getMonth(),
            year: d.getFullYear(),
            label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
        });
    }

    tabsContainer.innerHTML = months.map(m => {
        const isActive = m.month === _currentInvoiceMonth && m.year === _currentInvoiceYear;
        return `<div class="invoice-tab ${isActive ? 'active' : ''}" onclick="window.changeInvoiceTab('${account.id}', ${m.month}, ${m.year})">${m.label}</div>`;
    }).join('');
};

window.changeInvoiceTab = function(contaId, month, year) {
    _currentInvoiceMonth = month;
    _currentInvoiceYear = year;
    const account = _contas.find(c => c.id === contaId);
    if (account) {
        window.renderInvoiceTabs(account);
        window.renderInvoiceTransactions(contaId, month, year);
    }
};

window.renderInvoiceTransactions = function(contaId, month, year) {
    const listContainer = document.getElementById('invoice-transactions-list');
    const totalDisplay = document.getElementById('invoice-total-amount');
    const statusBadge = document.getElementById('invoice-status-badge');
    const dueDateDisplay = document.getElementById('invoice-due-date');
    if (!listContainer) return;

    const account = _contas.find(c => c.id === contaId);
    if (!account) return;

    const transactions = (typeof _allTransactions !== 'undefined') ? _allTransactions : [];
    const invoiceTransactions = transactions.filter(t => {
        if (t.conta_id !== contaId) return false;
        const purchaseDate = new Date(t.data + 'T00:00:00');
        const invoiceDate = (typeof getInvoiceMonth === 'function') ? getInvoiceMonth(purchaseDate, account) : purchaseDate;
        return invoiceDate.getMonth() === month && invoiceDate.getFullYear() === year;
    });

    const total = invoiceTransactions.reduce((acc, t) => acc + (t.tipo === 'entrada' ? -parseFloat(t.valor) : parseFloat(t.valor)), 0);
    if (totalDisplay) totalDisplay.textContent = window.formatar(total);
    
    const now = new Date();
    const currentViewDate = new Date(year, month);
    const todayDate = new Date(now.getFullYear(), now.getMonth());
    if (statusBadge) {
        if (currentViewDate < todayDate) { statusBadge.textContent = 'Fechada'; statusBadge.className = 'badge-status closed'; }
        else if (currentViewDate > todayDate) { statusBadge.textContent = 'Prevista'; statusBadge.className = 'badge-status closed'; }
        else { statusBadge.textContent = 'Aberta'; statusBadge.className = 'badge-status open'; }
    }

    if (dueDateDisplay) dueDateDisplay.textContent = `Vence dia ${account.dia_vencimento || '--'}`;
    const limit = parseFloat(account.limite) || 0;
    const usagePercent = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
    const barFill = document.getElementById('invoice-limit-bar-fill');
    if (barFill) {
        barFill.style.width = `${usagePercent}%`;
        barFill.style.background = usagePercent > 90 ? 'var(--color-danger)' : (usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-primary)');
    }

    if (invoiceTransactions.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><p>Nenhum lançamento.</p></div>';
        return;
    }

    listContainer.innerHTML = invoiceTransactions.map(t => `
        <div class="invoice-transaction-item">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05);">
                    <i class="fas ${t.tipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}" style="font-size: 0.8rem; color: ${t.tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)'};"></i>
                </div>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main);">${window.escapeHTML(t.descricao)}</div>
                    <div style="font-size: 0.65rem; color: var(--color-text-muted);">${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.95rem; font-weight: 800; color: ${t.tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-text-main)'};">
                    ${t.tipo === 'entrada' ? '+' : ''}${window.formatar(t.valor)}
                </div>
                ${t.parcelas_total > 1 ? `<span style="font-size: 0.6rem; color: var(--color-primary); font-weight: 800;">Parc. ${t.parcela_atual}/${t.parcelas_total}</span>` : ''}
            </div>
        </div>`).join('');
};

window.checkInvoiceDueDates = function() {
    const container = document.getElementById('invoice-alerts-container');
    if (!container || typeof _contas === 'undefined') return;
    const creditCards = _contas.filter(c => c.tipo === 'credito' && c.dia_vencimento);
    const today = new Date().getDate();
    let alertsHtml = '';
    creditCards.forEach(card => {
        const diff = card.dia_vencimento - today;
        if (diff >= 0 && diff <= 5) {
            const isToday = diff === 0;
            alertsHtml += `
                <div class="alert-premium" style="background: ${isToday ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'};">
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 800;">${isToday ? 'Vence Hoje!' : 'Fatura Próxima'}</div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">Cartão ${window.escapeHTML(card.nome)} vence dia ${card.dia_vencimento}.</div>
                    </div>
                    <button class="btn-primary-action" onclick="window.handleOpenFaturas('${card.id}')">PAGAR</button>
                </div>`;
        }
    });
    container.innerHTML = alertsHtml;
};

window.initiatePaymentFlow = function() {
    const selectOrigem = document.getElementById('select-pagamento-origem');
    if (!selectOrigem || typeof _contas === 'undefined') return;
    const contasOrigem = _contas.filter(c => c.tipo !== 'credito');
    if (contasOrigem.length === 0) { window.showToast('Sem contas de saldo disponíveis.', 'alert'); return; }
    selectOrigem.innerHTML = contasOrigem.map(c => `<option value="${c.id}">${window.escapeHTML(c.nome)} (${window.formatar(c.saldo_inicial || 0)})</option>`).join('');
    document.getElementById('payment-source-selector').style.display = 'block';
    document.getElementById('btn-pay-invoice').style.display = 'none';
    document.getElementById('payment-actions-confirm').style.display = 'flex';
};

window.cancelPaymentFlow = function() {
    document.getElementById('payment-source-selector').style.display = 'none';
    document.getElementById('btn-pay-invoice').style.display = 'block';
    document.getElementById('payment-actions-confirm').style.display = 'none';
};

window.handleConfirmarPagamento = async function() {
    if (!_currentInvoiceAccountId) return;
    const contaOrigemId = document.getElementById('select-pagamento-origem').value;
    const accountCredito = _contas.find(c => c.id === _currentInvoiceAccountId);
    const accountOrigem = _contas.find(c => c.id === contaOrigemId);
    if (!accountCredito || !accountOrigem) return;
    const transactions = (typeof _allTransactions !== 'undefined') ? _allTransactions : [];
    const invoiceTransactions = transactions.filter(t => {
        if (t.conta_id !== _currentInvoiceAccountId) return false;
        const purchaseDate = new Date(t.data + 'T00:00:00');
        const invoiceDate = (typeof getInvoiceMonth === 'function') ? getInvoiceMonth(purchaseDate, accountCredito) : purchaseDate;
        return invoiceDate.getMonth() === _currentInvoiceMonth && invoiceDate.getFullYear() === _currentInvoiceYear;
    });
    const valorFatura = invoiceTransactions.reduce((acc, t) => acc + (t.tipo === 'entrada' ? -parseFloat(t.valor) : parseFloat(t.valor)), 0);
    if (valorFatura <= 0) { window.showToast('Sem saldo devedor.', 'info'); window.cancelPaymentFlow(); return; }
    const confirmed = await window.confirmPremium(`Confirmar pagamento de ${window.formatar(valorFatura)}?`, { title: 'Confirmar Pagamento' });
    if (!confirmed) return;
    try {
        const user = await window.getCurrentUser();
        const today = new Date().toLocaleDateString('en-CA');
        const catId = await getCategoriaPagamentoId(user.id);
        await supabase.from('transacoes').insert([{ user_id: user.id, descricao: `Pagamento Fatura: ${accountCredito.nome}`, valor: valorFatura, tipo: 'saida', conta_id: contaOrigemId, data: today, categoria_id: catId }]);
        await supabase.from('transacoes').insert([{ user_id: user.id, descricao: `Pagamento Recebido: ${accountOrigem.nome}`, valor: valorFatura, tipo: 'entrada', conta_id: _currentInvoiceAccountId, data: today, categoria_id: catId }]);
        window.showToast('Pagamento realizado!', 'success');
        window.cancelPaymentFlow();
        window.closeModal('modal-faturas');
        if (typeof loadContas === 'function') await loadContas(user.id);
        if (typeof loadTransactions === 'function') await loadTransactions(user.id);
    } catch (err) { window.showToast('Erro ao processar pagamento.', 'error'); }
};

async function getCategoriaPagamentoId(userId) {
    const { data } = await supabase.from('categorias').select('id').eq('user_id', userId).ilike('nome', '%Pagamento%').limit(1);
    if (data && data.length > 0) return data[0].id;
    const { data: fallback } = await supabase.from('categorias').select('id').eq('user_id', userId).limit(1);
    return fallback && fallback.length > 0 ? fallback[0].id : null;
}
