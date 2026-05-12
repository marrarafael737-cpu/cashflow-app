/* js/ui.js - UI Elements, Modals & Visual Effects */

function formatar(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        alert: '⚠️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '🔔'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Animate In
    setTimeout(() => toast.classList.add('active'), 10);

    // Remove after 4s
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function setupModalLogic() {
    const modals = document.querySelectorAll('.modal-overlay, .modal, .modal-premium');
    const closeBtns = document.querySelectorAll('.btn-close, .close-modal, .btn-close-premium, .btn-close-modal');

    const dashModalBtn = document.getElementById('btn-open-modal-orcamento');
    const budgetModal = document.getElementById('modal-budget');
    if (dashModalBtn && budgetModal) {
        dashModalBtn.addEventListener('click', () => {
            budgetModal.style.display = 'flex';
            setTimeout(() => budgetModal.classList.add('active'), 10);
        });
    }

    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = budgetForm.querySelector('button');
            const originalText = btn.textContent;
            
            try {
                btn.disabled = true;
                btn.textContent = 'Salvando...';
                
                const categoryId = document.getElementById('budget-category').value;
                const limitValue = parseFloat(document.getElementById('budget-value').value);
                
                if (typeof saveBudget === 'function') {
                    await saveBudget(categoryId, limitValue);
                    budgetModal.classList.remove('active');
                    setTimeout(() => { budgetModal.style.display = 'none'; }, 300);
                    budgetForm.reset();
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay, .modal, .modal-premium');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                modal.classList.remove('active');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            });
        }
    });
}

function setupDynamicDropdowns() {
    const catSelect = document.getElementById('categoria');
    const subSelect = document.getElementById('subcategoria');
    const typeSelect = document.getElementById('tipo');

    if (catSelect && subSelect) {
        catSelect.addEventListener('change', () => {
            const catId = catSelect.value;
            const subs = _subcategories.filter(s => s.categoria_id === catId);
            
            subSelect.innerHTML = '<option value="">Opcional...</option>' + 
                subs.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            updateCategoryDropdown(typeSelect.value);
        });
    }

    const dashTypeSelect = document.getElementById('dash-tipo');
    if (dashTypeSelect) {
        dashTypeSelect.addEventListener('change', () => {
            updateCategoryDropdown(dashTypeSelect.value);
        });
    }
}

function updateCategoryDropdown(type = 'saida') {
    const catSelects = [
        document.getElementById('categoria'),
        document.getElementById('dash-categoria'),
        document.getElementById('budget-category')
    ];
    
    const filtered = _categories.filter(c => c.tipo === type);
    const optionsHtml = '<option value="">Selecione...</option>' + 
        filtered.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    catSelects.forEach(sel => {
        if (sel) sel.innerHTML = optionsHtml;
    });
}

function updateAccountDropdown() {
    const accountSelects = [
        document.getElementById('conta'),
        document.getElementById('dash-conta')
    ];
    
    if (typeof _contas === 'undefined' || !_contas) return;

    const optionsHtml = '<option value="">Selecione...</option>' + 
        _contas.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    accountSelects.forEach(sel => {
        if (sel) sel.innerHTML = optionsHtml;
    });
}

function setupMobileInteractions() {
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar-mobile');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar-mobile');
    const sidebar = document.querySelector('.sidebar-desktop');
    const overlay = document.getElementById('sidebar-backdrop');

    if (!sidebar || !overlay) return;
    
    // Forçar estado inicial fechado no carregamento
    sidebar.classList.remove('mobile-active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Fechar ao clicar fora
    overlay.addEventListener('click', () => {
        window.closeSidebar();
    });

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            window.openSidebar();
        });
    }

    if (btnCloseSidebar) {
        btnCloseSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeSidebar();
        });
    }

    window.openSidebar = () => {
        sidebar.classList.add('mobile-active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeSidebar = () => {
        sidebar.classList.remove('mobile-active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const actionsColumn = document.querySelector('.actions-column');
    const btnCloseActions = document.getElementById('btn-close-actions-mobile');

    if (btnCloseActions && actionsColumn) {
        btnCloseActions.addEventListener('click', () => {
            actionsColumn.classList.remove('mobile-active');
        });
    }

    // Fechar sidebar ao clicar em qualquer item de navegação (no mobile)
    const navItemsList = sidebar ? sidebar.querySelectorAll('.nav-item') : [];
    navItemsList.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                window.closeSidebar();
            }
        });
    });
}

function setupCategoryViewEvents(userId) {
    const form = document.getElementById('category-form-view');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('cat-nome-view').value;
        const tipo = document.getElementById('cat-tipo-view').value;

        if (typeof supabase !== 'undefined') {
            const { error } = await supabase.from('categorias').insert([{
                nome, tipo, user_id: userId
            }]);

            if (!error) {
                showToast('Categoria criada!', 'success');
                form.reset();
                if (typeof initializeCategories === 'function') await initializeCategories(userId);
                renderCategoriesView();
            }
        }
    });
}

function renderCategoriesView() {
    const list = document.getElementById('categorias-list-view');
    if (!list) return;

    if (!_categories || _categories.length === 0) {
        list.innerHTML = '<p style="color:var(--color-text-muted)">Nenhuma categoria.</p>';
        return;
    }

    list.innerHTML = _categories.map(c => {
        const config = getCategoryConfig(c.nome);
        const escapedNome = escapeHTML(c.nome);
        return `
            <div class="mini-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid var(--color-border);">
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    ${escapedNome}
                </span>
                <button class="btn-icon-plain" onclick="handleDeleteCategory('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

function switchView(target) {
    const mainContent = document.querySelector('.dashboard-main-content');
    if (!target || !mainContent) return;

    console.log('C.A.S.H. Unit: Navegando para', target);

    // Feedback Háptico
    if (typeof triggerHaptic === 'function') triggerHaptic(30);

    const performSwitch = () => {
        // Atualizar atributo data-view no mainContent
        mainContent.setAttribute('data-view', target);
        
        // Ativar a seção correspondente e ocultar as outras
        document.querySelectorAll('.view-section').forEach(view => {
            if (view.id === `view-${target}` || view.classList.contains(`view-${target}`)) {
                view.classList.add('active');
                view.style.display = 'block';
            } else {
                view.classList.remove('active');
                view.style.display = 'none';
            }
        });

        // Atualizar estados dos botões de navegação
        document.querySelectorAll('.nav-item, .nav-item-mobile, .mobile-nav-item').forEach(nav => {
            const navTarget = nav.getAttribute('data-target') || nav.getAttribute('data-view');
            if (navTarget === target) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Se for mobile, fechar sidebar ao navegar
        if (window.innerWidth <= 1024 && typeof window.closeSidebar === 'function') {
            window.closeSidebar();
        }

        // Trigger Renders específicos
        if (target === 'wallets' && typeof renderWallets === 'function') renderWallets();
        if (target === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
        if (target === 'goals' && typeof renderMetas === 'function') renderMetas();
        if (target === 'dashboard' && typeof updateSummary === 'function') updateSummary();
    };

    // Transição Premium com GSAP
    if (typeof gsap !== 'undefined') {
        gsap.to(mainContent, {
            opacity: 0,
            y: 10,
            duration: 0.15,
            ease: "power2.in",
            onComplete: () => {
                performSwitch();
                gsap.to(mainContent, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    } else {
        performSwitch();
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .nav-item-mobile, .mobile-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = item.getAttribute('data-target') || item.getAttribute('data-view');
            if (target) {
                e.preventDefault();
                switchView(target);
            }
        });
    });
}

function clearMascotInitMessage() {
    const msgEl = document.getElementById('mascot-message');
    if (msgEl && msgEl.textContent.includes('Inicializando')) {
        if (typeof showMascotMessage === 'function') {
            showMascotMessage('Sistemas online! Como posso ajudar hoje?', 'info', '', 'happy');
        } else {
            msgEl.textContent = 'Sistemas prontos!';
        }
    }
}

// Tornar global
window.switchView = switchView;

/**
 * Renderiza a visualização de Contas e Carteiras
 */
async function renderWallets() {
    const grid = document.getElementById("wallets-grid");
    if (!grid) return;

    if (!_contas || _contas.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon-wrapper">
                    <i class="fas fa-wallet"></i>
                </div>
                <h4>Nenhuma conta cadastrada</h4>
                <p>Você precisa de pelo menos uma conta ou carteira para começar a organizar seus fluxos.</p>
                <button class="btn-primary-action" style="width: auto; padding: 0.75rem 2rem;" onclick="document.getElementById('btn-open-modal-conta').click()">Cadastrar Carteira</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = _contas.map(c => {
        // Calcular saldo real
        const saldoTransacoes = _allTransactions
            .filter(t => t.conta_id === c.id)
            .reduce((acc, t) => acc + (t.tipo === "entrada" ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
        
        const saldoFinal = (parseFloat(c.saldo_inicial) || 0) + saldoTransacoes;
        const color = c.cor || "var(--color-primary)";

        return `
            <div class="wallet-card card-glass" style="border-left: 4px solid ${color};">
                <div>
                    <div class="wallet-type-icon">
                        <i class="${getAccountIcon(c.tipo)}"></i>
                    </div>
                    <div class="wallet-balance privacy-blur">${formatar(saldoFinal)}</div>
                    <div class="wallet-name">${escapeHTML(c.nome)}</div>
                </div>
                <div class="wallet-actions">
                    <button class="btn-icon-premium-mini" onclick="handleDeleteAccount('${c.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon-premium-mini" onclick="handleEditAccount('${c.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function getAccountIcon(tipo) {
    const icons = {
        corrente: "fas fa-university",
        poupanca: "fas fa-piggy-bank",
        investimento: "fas fa-chart-line",
        dinheiro: "fas fa-wallet",
        credito: "fas fa-credit-card"
    };
    return icons[tipo] || "fas fa-wallet";
}

/**
 * Renderiza a visualização de Calendário
 */
let _currentCalendarDate = new Date();

function renderCalendar() {
    const grid = document.getElementById("calendar-days-grid");
    const header = document.getElementById("calendar-month-year");
    if (!grid || !header) return;

    const year = _currentCalendarDate.getFullYear();
    const month = _currentCalendarDate.getMonth();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    header.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    grid.innerHTML = "";

    // Dias vazios
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        grid.appendChild(empty);
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add("today");
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        
        // Transações do dia
        const dayTrans = _allTransactions.filter(t => t.data === dateStr);
        const hasEntrada = dayTrans.some(t => t.tipo === "entrada");
        const hasSaida = dayTrans.some(t => t.tipo === "saida");

        dayEl.innerHTML = `
            <span class="day-number">${d}</span>
            <div class="day-indicators">
                ${hasEntrada ? '<span class="indicator entrada"></span>' : ""}
                ${hasSaida ? '<span class="indicator saida"></span>' : ""}
            </div>
        `;
        
        grid.appendChild(dayEl);
    }

    renderRecurring();
}

function renderRecurring() {
    const list = document.getElementById("recurring-list");
    if (!list) return;

    // Verificar se as variáveis globais existem e são arrays
    const recorrencias = (typeof _recorrencias !== 'undefined') ? _recorrencias : [];
    const categorias = (typeof _categories !== 'undefined') ? _categories : [];

    if (!recorrencias || recorrencias.length === 0) {
        list.innerHTML = "<p style=\"text-align: center; color: var(--color-text-muted); font-size: 0.8rem; padding: 1rem;\">Nenhuma recorrência ou assinatura ativa.</p>";
        return;
    }

    try {
        list.innerHTML = recorrencias.map(r => {
            const cat = categorias.find(c => c.id === r.categoria_id);
            const catName = cat ? cat.nome : 'Geral';
            const vencimento = r.dia_vencimento || '--';
            const statusLabel = r.dia_vencimento ? 'Ativo' : 'Pendente (Ação SQL)';
            
            const config = getCategoryConfig(catName);
            const escapedDesc = escapeHTML(r.descricao);
            const escapedCatName = escapeHTML(catName);
            
            return `
            <div class="recurring-item card-glass" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${config.color};">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    <div class="recurring-info">
                        <h4 style="margin: 0; font-size: 0.95rem; color: var(--color-text-primary); font-weight: 700;">${escapedDesc} <span style="font-size: 0.65rem; color: ${config.color}; font-weight: 800; background: ${config.color}15; padding: 2px 8px; border-radius: 4px; margin-left: 5px; text-transform: uppercase;">${escapedCatName}</span></h4>
                        <p style="margin: 0.35rem 0 0; font-size: 0.8rem; color: var(--color-text-muted);">Vencimento dia ${vencimento} • <span class="privacy-blur" style="color: var(--color-primary); font-weight: 700;">${formatar(r.valor)}</span></p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span class="status-badge" style="background: rgba(255, 122, 0, 0.1); color: var(--color-primary); border: 1px solid rgba(255, 122, 0, 0.2); font-size: 0.65rem; padding: 2px 8px; border-radius: 20px; font-weight: 800;">${statusLabel}</span>
                    <button class="btn-icon-plain" onclick="handleDeleteRecurrence('${r.id}')" style="color: rgba(255,255,255,0.2); transition: all 0.2s;" onmouseover="this.style.color='var(--color-danger)'" onmouseout="this.style.color='rgba(255,255,255,0.2)'">
                        <i class="fas fa-trash-alt" style="font-size: 0.9rem;"></i>
                    </button>
                </div>
            </div>`;

        }).join("");
    } catch (err) {
        console.error('Erro ao renderizar recorrências:', err);
    }
}


function calculateGoalInsights(m) {
    const faltante = m.valor_objetivo - m.valor_atual;
    if (faltante <= 0) return { status: 'completed', text: 'Meta Atingida!', suggestion: 'Parabéns! Objetivo conquistado.' };

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Oráculo: Usa o saldo projetado se disponível
    const projectedSurplus = window._projectedBalance || 0;
    
    // Calcular meses até o prazo, se existir
    let monthsToDeadline = 6;
    if (m.prazo) {
        const deadline = new Date(m.prazo + 'T00:00:00');
        const diffTime = deadline - now;
        monthsToDeadline = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)));
    }

    const valorMensalNecessario = faltante / monthsToDeadline;
    
    let status = 'on-track';
    let suggestion = `Poupe ${formatar(valorMensalNecessario)}/mês para bater ${m.prazo ? 'no prazo' : 'em 6 meses'}.`;

    // Insight Inteligente do Oráculo
    if (projectedSurplus > valorMensalNecessario) {
        const extra = projectedSurplus - valorMensalNecessario;
        suggestion = `💡 Oráculo: Você terá ${formatar(projectedSurplus)} de sobra este mês! Se aportar ${formatar(valorMensalNecessario + (extra*0.5))}, baterá a meta mais cedo.`;
    } else if (projectedSurplus > 0 && projectedSurplus < valorMensalNecessario) {
        suggestion = `⚠️ Oráculo: Sua sobra projetada (${formatar(projectedSurplus)}) é menor que o necessário. Tente reduzir gastos variáveis!`;
        status = 'behind';
    }

    return {
        status,
        text: `Faltam ${formatar(faltante)}`,
        suggestion
    };
}

function renderTransactions(transactions) {
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

        const config = getCategoryConfig(t.categoria_nome);
        const escapedDesc = escapeHTML(t.descricao);
        const escapedCat = escapeHTML(t.categoria_nome);

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
                    <strong>${symbol} ${formatar(t.valor)}</strong>
                </td>
                <td class="text-right">
                    <button class="btn-icon-plain" onclick="handleDeleteTransaction('${t.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            </tr>
        `;

    }).join('');
}

function renderMetas() {
    const list = document.getElementById('metas-list');
    if (!list || typeof _metas === 'undefined') return;

    if (_metas.length === 0) {
        list.innerHTML = `
            <div class="empty-state-premium card-glass" style="grid-column: 1/-1; padding: 3rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; border: 1px dashed var(--color-primary);">
                <div class="empty-mascot-ref" style="width: 80px; height: 80px; background: rgba(255, 122, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
                     <i class="fas fa-bullseye" style="font-size: 2rem; color: var(--color-primary);"></i>
                     <div style="position: absolute; right: -10px; bottom: -10px; background: var(--color-primary); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--color-surface);">
                        <i class="fas fa-star" style="font-size: 0.8rem; color: white;"></i>
                     </div>
                </div>
                <div style="max-width: 400px;">
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.75rem;">Você ainda não tem um sonho cadastrado...</h3>
                    <p style="color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6;">Que tal começar sua <strong>Reserva de Emergência</strong> hoje? Eu estarei aqui para monitorar cada centavo até você atingir o objetivo!</p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <div class="cashy-pointer" style="animation: bounceY 1.5s infinite; color: var(--color-primary);">
                        <i class="fas fa-arrow-down"></i>
                        <span style="font-size: 0.7rem; font-weight: 800; display: block; margin-top: 4px;">CLIQUE AQUI</span>
                    </div>
                    <button class="btn-primary-action" style="width: auto; padding: 0.8rem 2.5rem; box-shadow: 0 10px 20px rgba(255, 122, 0, 0.2);" onclick="document.getElementById('btn-open-modal-meta').click()">
                        Definir Meu Primeiro Sonho
                    </button>
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = _metas.map(m => {
        const percent = Math.min((m.valor_atual / m.valor_objetivo) * 100, 100);
        const insights = calculateGoalInsights(m);
        const statusClass = `status-${insights.status}`;
        const escapedNome = escapeHTML(m.nome);

        return `
            <div class="goal-card">
                <div class="goal-header">
                    <div style="display:flex; align-items:center;">
                        <h4>${escapedNome}</h4>
                        <span class="goal-status-pill ${statusClass}">${insights.status === 'on-track' ? 'No Ritmo' : (insights.status === 'behind' ? 'Lento' : 'Check')}</span>
                    </div>
                    <button class="btn-icon-premium-mini" onclick="handleDeleteMeta('${m.id}')" title="Excluir Meta">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="goal-stats">
                    <span class="amount privacy-blur">${formatar(m.valor_atual)}</span>
                    <span style="opacity:0.5;" class="amount privacy-blur">de ${formatar(m.valor_objetivo)}</span>
                </div>
                <div class="goal-bar-bg">
                    <div class="goal-bar-fill" style="width: ${percent}%; background: ${percent === 100 ? 'var(--color-success)' : 'var(--color-primary)'}"></div>
                </div>
                <div class="goal-eta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${insights.text}
                </div>
                <div class="goal-suggestion">
                    💡 ${insights.suggestion}
                </div>
                ${percent === 100 ? '<div style="margin-top:10px; font-weight:800; color:var(--color-success); font-size:0.7rem;">⭐ META CONQUISTADA!</div>' : ''}
            </div>
        `;
    }).join('');

    // Se alguma meta foi concluída agora e ainda não celebramos
    _metas.forEach(m => {
        if (m.valor_atual >= m.valor_objetivo && !m.celebrated) {
            triggerConfetti();
            m.celebrated = true; // Local memory only
        }
    });
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff7a00', '#00ff88', '#ffffff']
        });
    }
}

/**
 * Função Mestra de Renderização
 * Coordena a atualização de todos os componentes visuais e lógicas financeiras
 */
function filterAndRenderData(transactions = _allTransactions) {
    try {
        // 1. Renderizar Tabela de Transações
        renderTransactions(transactions);

        // 2. Calcular Resumos (Saldo, Receitas, Despesas)
        if (typeof calculateSummary === 'function') {
            calculateSummary(transactions);
        }

        // 3. Processar Insights da IA (Cashy)
        if (typeof calculateInsights === 'function') {
            calculateInsights(transactions);
        }

        // 4. Calcular Projeções de Futuro
        if (typeof calculateProjection === 'function') {
            calculateProjection(transactions);
        }

        // 4.5. Analises Avançadas (Oráculo & Simulador)
        if (typeof calculateFinancialHealthScore === 'function') {
            calculateFinancialHealthScore(transactions);
        }
        if (typeof calculateFinancialFreedom === 'function') {
            calculateFinancialFreedom();
        }

        // 5. Atualizar Orçamentos e Metas
        if (typeof renderOrcamentos === 'function') {
            renderOrcamentos();
        }
        
        if (typeof renderMetas === 'function') {
            renderMetas();
        }

        // 6. Atualizar Gráficos (se existirem)
        if (typeof updateCharts === 'function') {
            updateCharts(transactions);
        }

        // 7. Avaliar Desempenho Gamificado
        if (typeof evaluateFinancialPerformance === 'function') {
            const initialSum = (typeof _contas !== 'undefined') ? _contas.reduce((acc, c) => acc + parseFloat(c.saldo_inicial || 0), 0) : 0;
            const receitas = transactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            const despesas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            
            evaluateFinancialPerformance({
                totalReceita: receitas,
                totalDespesa: despesas,
                saldoMes: initialSum + receitas - despesas
            });
        }

    } catch (error) {
        console.error('C.A.S.H. Unit: Falha durante a renderização:', error);
    }
}
