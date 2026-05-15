/* js/ui/transactions.js - Transaction Table Rendering */

window.renderTransactions = function(transactions) {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon-wrapper">
                            <i class="fas fa-folder-open"></i>
                        </div>
                        <h4>Nenhuma transação encontrada</h4>
                        <p>Seu cofre está esperando o primeiro lançamento para começar a analisar suas finanças.</p>
                        <button class="btn-primary-action" style="width: auto; padding: 0.75rem 2rem;" onclick="document.getElementById('btn-new-transaction').click()">Lançar Agora</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const date = new Date(t.data + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('pt-BR');
        const amountClass = t.tipo === 'entrada' ? 'success' : (t.tipo === 'saida' ? 'error' : '');
        const symbol = t.tipo === 'entrada' ? '+' : (t.tipo === 'saida' ? '-' : '');

        const config = (typeof getCategoryConfig === 'function') ? getCategoryConfig(t.categoria_nome) : { color: '#ccc', icon: 'fa-tag' };
        const escapedDesc = window.escapeHTML(t.descricao);
        const escapedCat = window.escapeHTML(t.categoria_nome);

        return `
            <tr>
                <td>
                    <div class="td-desc">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; margin-right: 0.75rem;">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <span>${escapedDesc}</span>
                    </div>
                </td>
                <td><span class="tag-category" style="background: ${config.color}15; color: ${config.color}; border: 1px solid ${config.color}30;">${escapedCat}</span></td>
                <td>${formattedDate}</td>
                <td class="text-right ${amountClass} amount privacy-blur">
                    <strong>${symbol} ${window.formatar(t.valor)}</strong>
                </td>
                <td class="text-right">
                    <button class="btn-icon-danger" onclick="handleDeleteTransaction('${t.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};
