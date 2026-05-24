/* js/ui/recurring.js - Subscriptions & Recurring Payments */

window.renderRecurring = function() {
    const list = document.getElementById("subscriptions-list") || document.getElementById("recurring-list");
    if (!list) return;

    const recorrencias = (typeof _recorrencias !== 'undefined') ? _recorrencias : [];
    const categorias = (typeof _categories !== 'undefined') ? _categories : [];

    let totalMensal = 0;
    let proximoVencimento = null;
    const today = new Date().getDate();

    recorrencias.forEach(r => {
        if (r.tipo === 'saida') totalMensal += r.valor;
        const venc = parseInt(r.dia_vencimento);
        if (!proximoVencimento || (venc >= today && (venc < proximoVencimento || proximoVencimento < today))) {
            if (venc >= today) proximoVencimento = venc;
        }
    });

    const totalEl = document.getElementById('sub-total-mensal');
    if (totalEl) totalEl.textContent = window.formatar(totalMensal);
    const proxEl = document.getElementById('sub-proximo-vencimento');
    if (proxEl) proxEl.textContent = proximoVencimento ? `Dia ${proximoVencimento}` : '--';

    if (recorrencias.length === 0) {
        list.innerHTML = "<p>Nenhuma recorrência ativa.</p>";
        return;
    }

    list.innerHTML = recorrencias.map(r => {
        const cat = categorias.find(c => c.id === r.categoria_id);
        const catName = cat ? cat.nome : 'Geral';
        const config = (typeof getCategoryConfig === 'function') ? getCategoryConfig(catName) : { color: '#ccc', icon: 'fa-tag' };
        return `
            <div class="subscription-card" style="border-top: 4px solid ${config.color};">
                <h4>${window.escapeHTML(r.descricao)}</h4>
                <div class="amount">${window.formatar(r.valor)}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">Vence dia ${r.dia_vencimento}</div>
                <button class="btn-secondary" onclick="handleDeleteRecurrence('${r.id}')">Remover</button>
            </div>`;
    }).join("");
};
