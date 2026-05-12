/**
 * js/search.js - Powerful Global Search (Spotlight Style)
 */

document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
});

function initGlobalSearch() {
    const overlay = document.getElementById('global-search-overlay');
    const input = document.getElementById('global-search-input');
    const resultsArea = document.getElementById('global-search-results');

    if (!overlay || !input) return;

    // 1. Atalhos de Teclado (Ctrl + K ou /)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeSearch();
        }
    });

    // 2. Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    // 3. Lógica de Busca
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            renderSearchEmpty();
            return;
        }
        performSearch(query);
    });

    function openSearch() {
        overlay.classList.add('active');
        setTimeout(() => input.focus(), 100);
    }

    function closeSearch() {
        overlay.classList.remove('active');
        input.value = '';
        renderSearchEmpty();
    }

    function renderSearchEmpty() {
        resultsArea.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-magic"></i>
                <p>Busque por descrições, categorias, meses ou valores...</p>
                <div class="search-tips">
                    <span>Dica: Digite o nome de um mês para ver o resumo.</span>
                </div>
            </div>
        `;
    }

    function performSearch(query) {
        if (typeof _allTransactions === 'undefined') return;

        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        // Filtro Principal
        const results = _allTransactions.filter(t => {
            const desc = (t.descricao || '').toLowerCase();
            const cat = (t.categoria_nome || '').toLowerCase();
            const val = (t.valor || '').toString();
            const date = new Date(t.data + 'T00:00:00');
            const monthName = months[date.getMonth()];
            
            return desc.includes(query) || 
                   cat.includes(query) || 
                   val.includes(query) ||
                   monthName.includes(query);
        });

        if (results.length === 0) {
            resultsArea.innerHTML = `
                <div class="search-empty-state">
                    <i class="fas fa-search-minus"></i>
                    <p>Nenhum resultado para "${query}"</p>
                </div>
            `;
            return;
        }

        // Renderizar Resultados
        resultsArea.innerHTML = results.slice(0, 10).map(t => {
            const date = new Date(t.data + 'T00:00:00');
            const dateStr = date.toLocaleDateString('pt-BR');
            const iconClass = t.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';
            const iconBg = t.tipo === 'entrada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const iconColor = t.tipo === 'entrada' ? '#10B981' : '#EF4444';

            return `
                <div class="search-result-item" onclick="goToTransaction('${t.id}')">
                    <div class="result-icon" style="background: ${iconBg}; color: ${iconColor};">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="result-info">
                        <span class="result-title">${escapeHTML(t.descricao)}</span>
                        <span class="result-meta">${escapeHTML(t.categoria_nome)} • ${dateStr}</span>
                    </div>
                    <div class="result-value ${t.tipo}">
                        ${t.tipo === 'entrada' ? '+' : '-'} R$ ${parseFloat(t.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                </div>
            `;
        }).join('');

        if (results.length > 10) {
            resultsArea.innerHTML += `
                <div style="padding: 1rem; text-align: center; font-size: 0.8rem; color: var(--color-text-muted); border-top: 1px solid rgba(255,255,255,0.05);">
                    Mostrando 10 de ${results.length} resultados. Refine sua busca para ver mais.
                </div>
            `;
        }
    }
}

// Função para "ir" até a transação
function goToTransaction(id) {
    const overlay = document.getElementById('global-search-overlay');
    if (overlay) overlay.classList.remove('active');

    // Mudar para a view de histórico
    const mainContent = document.querySelector('.dashboard-main-content');
    if (mainContent) mainContent.setAttribute('data-view', 'transactions');

    // Atualizar menu ativo
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.getAttribute('data-target') === 'transactions');
    });

    // Scroll até a transação (se estiver no DOM)
    setTimeout(() => {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.background = 'rgba(255, 122, 0, 0.2)';
            setTimeout(() => row.style.background = '', 2000);
        } else {
            showToast('Transação localizada! Use os filtros se necessário.', 'info');
        }
    }, 300);
}

// Helper para evitar XSS (se não existir globalmente)
if (typeof escapeHTML !== 'function') {
    window.escapeHTML = function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
}
