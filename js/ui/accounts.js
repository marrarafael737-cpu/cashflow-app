/* js/ui/accounts.js - Wallet & Account Cards Rendering */

window.getAccountIcon = function(tipo) {
    const icons = {
        corrente: "fas fa-university",
        poupanca: "fas fa-piggy-bank",
        investimento: "fas fa-chart-line",
        dinheiro: "fas fa-wallet",
        credito: "fas fa-credit-card"
    };
    return icons[tipo] || "fas fa-wallet";
};

window.renderContas = function() {
    const grid = document.getElementById("wallets-grid");
    const dashList = document.getElementById("accounts-list");
    
    if (!grid && !dashList) return;

    if (typeof _contas === 'undefined' || !_contas || _contas.length === 0) {
        const emptyHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon-wrapper">
                    <i class="fas fa-wallet"></i>
                </div>
                <h4>Nenhuma conta cadastrada</h4>
                <p>Você precisa de pelo menos uma conta ou carteira para começar a organizar seus fluxos.</p>
                <button class="btn-primary-action" style="width: auto; padding: 0.75rem 2rem;" onclick="document.getElementById('btn-open-modal-conta').click()">Cadastrar Carteira</button>
            </div>
        `;
        if (grid) grid.innerHTML = emptyHTML;
        if (dashList) dashList.innerHTML = emptyHTML;
        return;
    }

    const cardsHTML = _contas.map(c => {
        const transactions = (typeof _allTransactions !== 'undefined' && _allTransactions) ? _allTransactions : [];
        const saldoTransacoes = transactions
            .filter(t => t.conta_id === c.id)
            .reduce((acc, t) => acc + (t.tipo === "entrada" ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
        
        const saldoInicial = parseFloat(c.saldo_inicial) || 0;
        const saldoFinal = (c.tipo === 'credito') ? (-saldoInicial + saldoTransacoes) : (saldoInicial + saldoTransacoes);
        const color = c.cor || "var(--color-primary)";
        const typeLabels = { corrente: 'Conta Corrente', poupanca: 'Poupança', investimento: 'Investimento', dinheiro: 'Dinheiro', credito: 'Cartão de Crédito' };
        const typeLabel = typeLabels[c.tipo] || 'Conta';

        if (c.tipo === 'credito') {
            const limit = parseFloat(c.limite) || 0;
            const totalSpent = Math.abs(Math.min(0, saldoFinal));
            const availableLimit = Math.max(0, limit - totalSpent);
            const usagePercent = limit > 0 ? Math.min((totalSpent / limit) * 100, 100) : 0;
            
            return `
                <div class="account-card type-credito" style="--card-color: ${color}">
                    <div class="card-chip"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="color: white; margin: 0; font-size: 1rem;">${window.escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${typeLabel}</span>
                        </div>
                        <i class="fas ${c.icone || 'fa-credit-card'}" style="color: ${color}; font-size: 1.2rem;"></i>
                    </div>
                    <div style="margin: 1rem 0;">
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Fatura Atual</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: white; margin-top: 2px;" class="privacy-blur">${window.formatar(totalSpent)}</div>
                    </div>
                    <div class="limit-bar-container">
                        <div class="limit-info">
                            <span>Limite Disponível</span>
                            <span class="privacy-blur">${window.formatar(availableLimit)}</span>
                        </div>
                        <div class="limit-bar-bg">
                            <div class="limit-bar-fill" style="width: ${usagePercent}%;"></div>
                        </div>
                    </div>
                    <div class="card-footer-info">
                        <div>
                            <span style="display: block; font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase;">Fechamento</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: white;">Dia ${c.dia_fechamento || '—'}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase;">Vencimento</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-warning);">Dia ${c.dia_vencimento || '—'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn-ghost-small" style="flex: 1; border-color: rgba(255,255,255,0.1); color: white;" onclick="handleEditAccount('${c.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-ghost-small" style="flex: 1; border-color: ${color}; background: ${color}20; color: white;" onclick="handleOpenFaturas('${c.id}')">
                            <i class="fas fa-file-invoice-dollar"></i> Detalhes
                        </button>
                    </div>
                </div>`;
        } else {
            return `
                <div class="account-card" style="--card-color: ${color}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: ${color}20; color: ${color}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${c.icone || 'fa-wallet'}"></i>
                        </div>
                        <div style="text-align: right;">
                            <h4 style="margin: 0; font-size: 0.9rem;">${window.escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${typeLabel}</span>
                        </div>
                    </div>
                    <div style="margin: 1.5rem 0;">
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">Saldo Disponível</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${saldoFinal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};" class="privacy-blur">${window.formatar(saldoFinal)}</div>
                    </div>
                    <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
                        <button class="btn-icon-premium" onclick="handleEditAccount('${c.id}')">
                            <i class="fas fa-cog"></i>
                        </button>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted);">Patrimônio: 100%</span>
                    </div>
                </div>`;
        }
    }).join("");

    if (grid) grid.innerHTML = cardsHTML;
    if (dashList) dashList.innerHTML = cardsHTML;
    if (typeof checkInvoiceDueDates === 'function') window.checkInvoiceDueDates();
};
