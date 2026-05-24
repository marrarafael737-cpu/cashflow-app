/* js/ui/orchestrator.js - UI Main Orchestrator */

window.filterAndRenderData = function(transactions = window._allTransactions) {
    const modules = [
        { name: 'Transactions', fn: () => window.renderTransactions && window.renderTransactions(transactions) },
        { name: 'Accounts', fn: () => window.renderContas && window.renderContas() },
        { name: 'Summary', fn: () => typeof calculateSummary === 'function' && calculateSummary(transactions) },
        { name: 'Insights', fn: () => typeof calculateInsights === 'function' && calculateInsights(transactions) },
        { name: 'Projection', fn: () => typeof calculateProjection === 'function' && calculateProjection(transactions) },
        { name: 'HealthScore', fn: () => typeof calculateFinancialHealthScore === 'function' && calculateFinancialHealthScore(transactions) },
        { name: 'Budgets', fn: () => window.renderOrcamentos && window.renderOrcamentos() },
        { name: 'Goals', fn: () => window.renderMetas && window.renderMetas() },
        { name: 'Charts', fn: () => typeof updateCharts === 'function' && updateCharts(transactions) },
        { name: 'Oracle', fn: () => window.renderOracle && window.renderOracle(transactions) },
        { name: 'Alerts', fn: () => window.renderProactiveAlerts && window.renderProactiveAlerts() }
    ];

    modules.forEach(module => {
        try {
            module.fn();
        } catch (error) {
            console.error(`C.A.S.H. Unit: Falha no módulo [${module.name}]:`, error);
        }
    });
};

window.renderProactiveAlerts = function() {
    const container = document.getElementById('proactive-alerts-container');
    if (!container || typeof getProactiveAlerts !== 'function') return;
    const alerts = getProactiveAlerts();
    if (alerts.length === 0) { container.innerHTML = ''; container.style.display = 'none'; return; }
    container.style.display = 'grid';
    container.innerHTML = alerts.map(alert => `
        <div class="alert-premium-card alert-${alert.type}">
            <h4 style="margin: 0; font-size: 0.9rem;">${alert.title}</h4>
            <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--color-text-muted);">${alert.message}</p>
        </div>`).join('');
};

window.clearMascotInitMessage = function() {
    const msgEl = document.getElementById('mascot-message');
    if (msgEl && msgEl.textContent.includes('Inicializando')) {
        if (typeof showMascotMessage === 'function') {
            showMascotMessage('Sistemas online! Como posso ajudar hoje?', 'info', '', 'happy');
        } else {
            msgEl.textContent = 'Sistemas prontos!';
        }
    }
};
