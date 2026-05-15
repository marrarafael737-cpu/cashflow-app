/* js/ui/goals.js - Financial Goals & Insights */

window.calculateGoalInsights = function(m) {
    const faltante = m.valor_objetivo - m.valor_atual;
    if (faltante <= 0) return { status: 'completed', text: 'Meta Atingida!', suggestion: 'Parabéns! Objetivo conquistado.' };

    const now = new Date();
    const projectedSurplus = window._projectedBalance || 0;
    let monthsToDeadline = 6;
    if (m.prazo) {
        const deadline = new Date(m.prazo + 'T00:00:00');
        const diffTime = deadline - now;
        monthsToDeadline = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)));
    }

    const valorMensalNecessario = faltante / monthsToDeadline;
    let status = 'on-track';
    let suggestion = `Poupe ${window.formatar(valorMensalNecessario)}/mês para bater ${m.prazo ? 'no prazo' : 'em 6 meses'}.`;

    if (projectedSurplus > valorMensalNecessario) {
        suggestion = `💡 Você terá ${window.formatar(projectedSurplus)} de sobra! Se aportar mais, baterá a meta mais cedo.`;
    } else if (projectedSurplus > 0 && projectedSurplus < valorMensalNecessario) {
        suggestion = `⚠️ Sua sobra projetada (${window.formatar(projectedSurplus)}) é menor que o necessário.`;
        status = 'behind';
    }

    return { status, text: `Faltam ${window.formatar(faltante)}`, suggestion };
};

window.renderMetas = function() {
    const list = document.getElementById('metas-list');
    if (!list || typeof _metas === 'undefined') return;

    if (_metas.length === 0) {
        list.innerHTML = `<div class="empty-state"><h3>Sem sonhos cadastrados...</h3></div>`;
        return;
    }

    list.innerHTML = _metas.map(m => {
        const percent = Math.min((m.valor_atual / m.valor_objetivo) * 100, 100);
        const insights = window.calculateGoalInsights(m);
        const escapedNome = window.escapeHTML(m.nome);
        return `
            <div class="goal-card">
                <div class="goal-header">
                    <h4>${escapedNome}</h4>
                    <span class="goal-status-pill status-${insights.status}">${insights.status === 'on-track' ? 'No Ritmo' : 'Atenção'}</span>
                    <button class="btn-icon-premium-mini" onclick="handleDeleteMeta('${m.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="goal-progress-bar-bg"><div class="goal-progress-bar-fill" style="width: ${percent}%;"></div></div>
                <div class="goal-oracle-suggestion"><i class="fas fa-robot"></i> ${insights.suggestion}</div>
            </div>`;
    }).join('');
};
