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

/**
 * Premium Confirmation Dialog Replacement
 * Returns a Promise that resolves to true (Confirm) or false (Cancel)
 */
function confirmPremium(message, options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        if (!modal) {
            // Fallback to native confirm if modal doesn't exist
            resolve(confirm(message));
            return;
        }

        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconContainer = document.getElementById('confirm-icon');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');

        // Set content
        if (titleEl) titleEl.textContent = options.title || 'Confirmar Ação';
        if (messageEl) messageEl.textContent = message;
        
        // Icon and Style handling
        if (iconContainer) {
            iconContainer.className = `confirm-icon ${options.type || 'warning'}`;
            const iconMap = {
                warning: 'fa-exclamation-triangle',
                danger: 'fa-trash-alt',
                info: 'fa-info-circle'
            };
            const iconClass = iconMap[options.type] || iconMap.warning;
            iconContainer.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }

        if (btnYes) {
            btnYes.textContent = options.confirmText || 'Confirmar';
            // Adjust button style for danger
            if (options.type === 'danger') {
                btnYes.style.background = 'var(--color-danger)';
            } else {
                btnYes.style.background = ''; // Revert to CSS default
            }
        }
        if (btnNo) btnNo.textContent = options.cancelText || 'Cancelar';

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(15);

        // Cleanup and resolve
        const cleanup = (value) => {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            btnYes.removeEventListener('click', onYes);
            btnNo.removeEventListener('click', onNo);
            resolve(value);
        };

        const onYes = () => cleanup(true);
        const onNo = () => cleanup(false);

        btnYes.addEventListener('click', onYes);
        btnNo.addEventListener('click', onNo);
        
        // Close on clicking outside
        const onOutsideClick = (e) => {
            if (e.target === modal) {
                modal.removeEventListener('click', onOutsideClick);
                onNo();
            }
        };
        modal.addEventListener('click', onOutsideClick);
    });
}
window.confirmPremium = confirmPremium;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Haptic feedback for critical notifications
    if (type === 'error' || type === 'alert') {
        if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(50);
    }

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
        <span class="toast-message">${escapeHTML(message)}</span>
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
                <button class="btn-icon-danger" onclick="handleDeleteCategory('${c.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');
}

function switchView(target) {
    const mainContent = document.querySelector('.dashboard-main-content');
    if (!target || !mainContent) return;

    console.log('C.A.S.H. Unit: Navegando para', target);

    // Feedback Háptico (Phase 2)
    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) {
        App.Utils.triggerHaptic(30);
    }

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
        if (target === 'wallets' && typeof renderContas === 'function') renderContas();
        if (target === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
        if (target === 'goals' && typeof renderMetas === 'function') renderMetas();
        if (target === 'subscriptions' && typeof renderRecurring === 'function') renderRecurring();
        if (target === 'investments' && typeof renderInvestments === 'function') renderInvestments();
        if (target === 'dashboard' && typeof filterAndRenderData === 'function') {
            filterAndRenderData();
        }
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
 * Renderiza a visualização de Contas e Carteiras (Carousel)
 */
function renderContas() {
    const grid = document.getElementById("wallets-grid");
    const dashList = document.getElementById("accounts-list");
    
    if (!grid && !dashList) return;

    if (!_contas || _contas.length === 0) {
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
                            <h4 style="color: white; margin: 0; font-size: 1rem;">${escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${typeLabel}</span>
                        </div>
                        <i class="fas ${c.icone || 'fa-credit-card'}" style="color: ${color}; font-size: 1.2rem;"></i>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Fatura Atual</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: white; margin-top: 2px;" class="privacy-blur">${formatar(totalSpent)}</div>
                    </div>

                    <div class="limit-bar-container">
                        <div class="limit-info">
                            <span>Limite Disponível</span>
                            <span class="privacy-blur">${formatar(availableLimit)}</span>
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
                </div>
            `;
        } else {
            // Conta Normal
            return `
                <div class="account-card" style="--card-color: ${color}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: ${color}20; color: ${color}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${c.icone || 'fa-wallet'}"></i>
                        </div>
                        <div style="text-align: right;">
                            <h4 style="margin: 0; font-size: 0.9rem;">${escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${typeLabel}</span>
                        </div>
                    </div>

                    <div style="margin: 1.5rem 0;">
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">Saldo Disponível</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${saldoFinal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};" class="privacy-blur">${formatar(saldoFinal)}</div>
                    </div>

                    <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
                        <button class="btn-icon-premium" onclick="handleEditAccount('${c.id}')">
                            <i class="fas fa-cog"></i>
                        </button>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted);">Patrimônio: 100%</span>
                    </div>
                </div>
            `;
        }
    }).join("");

    if (grid) grid.innerHTML = cardsHTML;
    if (dashList) dashList.innerHTML = cardsHTML;
    if (typeof checkInvoiceDueDates === 'function') checkInvoiceDueDates();
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
    const list = document.getElementById("subscriptions-list") || document.getElementById("recurring-list");
    if (!list) return;

    const recorrencias = (typeof _recorrencias !== 'undefined') ? _recorrencias : [];
    const categorias = (typeof _categories !== 'undefined') ? _categories : [];

    // Calcular Resumo
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
    if (totalEl) totalEl.textContent = formatar(totalMensal);
    
    const proxEl = document.getElementById('sub-proximo-vencimento');
    if (proxEl) proxEl.textContent = proximoVencimento ? `Dia ${proximoVencimento}` : '--';

    if (!recorrencias || recorrencias.length === 0) {
        list.innerHTML = "<p style=\"text-align: center; grid-column: 1/-1; color: var(--color-text-muted); font-size: 0.8rem; padding: 2rem;\">Nenhuma recorrência ou assinatura ativa.</p>";
        return;
    }

    try {
        list.innerHTML = recorrencias.map(r => {
            const cat = categorias.find(c => c.id === r.categoria_id);
            const catName = cat ? cat.nome : 'Geral';
            const vencimento = r.dia_vencimento || '--';
            const config = getCategoryConfig(catName);
            
            // Verificar se já foi pago este mês
            const now = new Date();
            const lastPaid = r.ultimo_pagamento ? new Date(r.ultimo_pagamento + 'T00:00:00') : null;
            const isPaidThisMonth = lastPaid && (lastPaid.getMonth()) === now.getMonth() && lastPaid.getFullYear() === now.getFullYear();

            return `
            <div class="subscription-card card-glass ${isPaidThisMonth ? 'paid' : ''}" style="position: relative; overflow: hidden; border-top: 4px solid ${config.color};">
                ${isPaidThisMonth ? '<div class="paid-badge" style="position: absolute; top: 10px; right: -30px; background: #10B981; color: white; padding: 5px 35px; transform: rotate(45deg); font-size: 0.6rem; font-weight: 800; text-transform: uppercase;">Pago</div>' : ''}
                <div class="card-body" style="padding: 1.5rem;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${config.color}15; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Valor Mensal</span>
                            <span class="privacy-blur" style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${formatar(r.valor)}</span>
                        </div>
                    </div>
                    
                    <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">${escapeHTML(r.descricao)}</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                        <span style="font-size: 0.7rem; background: ${config.color}15; color: ${config.color}; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${escapeHTML(catName)}</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted);">Vence todo dia ${vencimento}</span>
                    </div>

                    <div class="card-actions" style="display: flex; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                        <button class="btn-secondary" onclick="handleDeleteRecurrence('${r.id}')" style="flex: 1; padding: 0.6rem; font-size: 0.8rem; color: var(--color-danger); border-color: rgba(255, 59, 48, 0.2);">
                            <i class="fas fa-trash-alt"></i> Remover
                        </button>
                        ${!isPaidThisMonth ? `
                        <button class="btn-primary-action" onclick="handlePayRecurrenceEarly('${r.id}')" style="flex: 2; padding: 0.6rem; font-size: 0.8rem;">
                            <i class="fas fa-check"></i> Pagar Agora
                        </button>` : `
                        <button class="btn-secondary" disabled style="flex: 2; padding: 0.6rem; font-size: 0.8rem; opacity: 0.5;">
                            <i class="fas fa-check-circle"></i> Liquidado
                        </button>
                        `}
                    </div>
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
                    <button class="btn-icon-danger" onclick="handleDeleteTransaction('${t.id}')">
                        <i class="fas fa-trash-alt"></i>
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
                        <span class="goal-status-pill status-${insights.status}">
                            ${insights.status === 'on-track' ? 'No Ritmo' : (insights.status === 'behind' ? 'Lento' : 'Meta Batida')}
                        </span>
                    </div>
                    <button class="btn-icon-premium-mini" onclick="handleDeleteMeta('${m.id}')" title="Excluir Meta">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>

                <div class="goal-stats-premium">
                    <div class="goal-current-amount amount privacy-blur">${formatar(m.valor_atual)}</div>
                    <div class="goal-target-amount amount privacy-blur">objetivo: ${formatar(m.valor_objetivo)}</div>
                </div>

                <div class="goal-progress-wrapper">
                    <div class="goal-percent-badge">${percent.toFixed(0)}%</div>
                    <div class="goal-progress-bar-bg">
                        <div class="goal-progress-bar-fill" style="width: ${percent}%; background: ${percent === 100 ? '#10B981' : ''}"></div>
                    </div>
                </div>

                <div class="goal-footer-info">
                    <div class="goal-eta-premium">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${insights.text}</span>
                    </div>
                    
                    <div class="goal-oracle-suggestion">
                        <i class="fas fa-robot"></i>
                        <div>${insights.suggestion.replace('💡 Oráculo:', '').replace('⚠️ Oráculo:', '').trim()}</div>
                    </div>
                </div>

                ${percent === 100 ? `
                <div class="goal-conquistada-badge">
                    <i class="fas fa-trophy"></i>
                    <span>Meta Conquistada!</span>
                </div>` : ''}
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
        // 1. Renderizar Tabela de Transações e Contas
        renderTransactions(transactions);
        if (typeof renderContas === 'function') renderContas();

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

        // 8. Alertas Proativos (Phase 3)
        if (typeof renderProactiveAlerts === 'function') {
            renderProactiveAlerts();
        }

    } catch (error) {
        console.error('C.A.S.H. Unit: Falha durante a renderização:', error);
    }
}

/**
 * Handlers para Cartão de Crédito (Carousel)
 */
let _currentInvoiceAccountId = null;
let _currentInvoiceMonth = new Date().getMonth();
let _currentInvoiceYear = new Date().getFullYear();

async function handleOpenFaturas(contaId) {
    const account = _contas.find(c => c.id === contaId);
    if (!account || account.tipo !== 'credito') return;

    _currentInvoiceAccountId = contaId;
    const now = new Date();
    _currentInvoiceMonth = now.getMonth();
    _currentInvoiceYear = now.getFullYear();

    // Atualizar UI básica do modal
    const modalTitle = document.getElementById('invoice-modal-title');
    const iconBg = document.getElementById('invoice-card-icon-bg');
    const icon = document.getElementById('invoice-card-icon');
    
    if (modalTitle) modalTitle.textContent = `Fatura: ${account.nome}`;
    if (iconBg) iconBg.style.background = `${account.cor || 'var(--color-primary)'}20`;
    if (icon) icon.style.color = account.cor || 'var(--color-primary)';
    
    renderInvoiceTabs(account);
    renderInvoiceTransactions(contaId, _currentInvoiceMonth, _currentInvoiceYear);
    
    if (typeof openModal === 'function') openModal('modal-faturas');
    else if (document.getElementById('modal-faturas')) document.getElementById('modal-faturas').classList.add('active');
}

function renderInvoiceTabs(account) {
    const tabsContainer = document.getElementById('invoice-months-tabs');
    if (!tabsContainer) return;

    const months = [];
    const now = new Date();
    
    // Gerar últimos 3 meses e próximos 3 meses
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
        return `
            <div class="invoice-tab ${isActive ? 'active' : ''}" 
                 onclick="changeInvoiceTab('${account.id}', ${m.month}, ${m.year})">
                ${m.label}
            </div>
        `;
    }).join('');
}

window.changeInvoiceTab = function(contaId, month, year) {
    _currentInvoiceMonth = month;
    _currentInvoiceYear = year;
    
    const account = _contas.find(c => c.id === contaId);
    if (account) {
        renderInvoiceTabs(account);
        renderInvoiceTransactions(contaId, month, year);
    }
};

function renderInvoiceTransactions(contaId, month, year) {
    const listContainer = document.getElementById('invoice-transactions-list');
    const totalDisplay = document.getElementById('invoice-total-amount');
    const statusBadge = document.getElementById('invoice-status-badge');
    const dueDateDisplay = document.getElementById('invoice-due-date');
    
    if (!listContainer) return;

    const account = _contas.find(c => c.id === contaId);
    if (!account) return;

    const transactions = (typeof _allTransactions !== 'undefined') ? _allTransactions : [];
    
    // Filtrar transações que CAEM nesta fatura (mês/ano)
    const invoiceTransactions = transactions.filter(t => {
        if (t.conta_id !== contaId) return false;
        
        const purchaseDate = new Date(t.data + 'T00:00:00');
        // getInvoiceMonth retorna a data da fatura em que a compra cairá
        const invoiceDate = (typeof getInvoiceMonth === 'function') ? getInvoiceMonth(purchaseDate, account) : purchaseDate;
        
        return invoiceDate.getMonth() === month && invoiceDate.getFullYear() === year;
    });

    const total = invoiceTransactions.reduce((acc, t) => acc + (t.tipo === 'entrada' ? -parseFloat(t.valor) : parseFloat(t.valor)), 0);
    
    if (totalDisplay) totalDisplay.textContent = formatar(total);
    
    // Status simplificado
    const now = new Date();
    const currentViewDate = new Date(year, month);
    const todayDate = new Date(now.getFullYear(), now.getMonth());
    
    if (statusBadge) {
        if (currentViewDate < todayDate) {
            statusBadge.textContent = 'Fechada';
            statusBadge.className = 'badge-status closed';
        } else if (currentViewDate > todayDate) {
            statusBadge.textContent = 'Prevista';
            statusBadge.className = 'badge-status closed';
        } else {
            statusBadge.textContent = 'Aberta';
            statusBadge.className = 'badge-status open';
        }
    }

    if (dueDateDisplay) dueDateDisplay.textContent = `Vence dia ${account.dia_vencimento || '--'}`;

    // Atualizar barra de limite no modal
    const limit = parseFloat(account.limite) || 0;
    const usagePercent = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
    
    const usageLabel = document.getElementById('invoice-limit-usage-percent');
    const barFill = document.getElementById('invoice-limit-bar-fill');
    
    if (usageLabel) usageLabel.textContent = `${usagePercent.toFixed(0)}%`;
    if (barFill) {
        barFill.style.width = `${usagePercent}%`;
        barFill.style.background = usagePercent > 90 ? 'var(--color-danger)' : (usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-primary)');
    }

    if (invoiceTransactions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state" style="padding: 3rem 1rem; text-align: center;">
                <i class="fas fa-receipt" style="font-size: 2rem; color: var(--color-text-muted); opacity: 0.2; margin-bottom: 1rem; display: block;"></i>
                <p style="color: var(--color-text-muted); font-size: 0.85rem;">Nenhum lançamento encontrado para este período.</p>
            </div>
        `;
        return;
    }

    // Renderizar gráfico de evolução
    if (typeof renderInvoiceEvolutionChart === 'function') {
        renderInvoiceEvolutionChart(invoiceTransactions);
    }


    listContainer.innerHTML = invoiceTransactions.map(t => `
        <div class="invoice-transaction-item">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05);">
                    <i class="fas ${t.tipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}" style="font-size: 0.8rem; color: ${t.tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)'};"></i>
                </div>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main); line-height: 1.2;">${escapeHTML(t.descricao)}</div>
                    <div style="font-size: 0.65rem; color: var(--color-text-muted); margin-top: 0.1rem;">${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.95rem; font-weight: 800; color: ${t.tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-text-main)'};">
                    ${t.tipo === 'entrada' ? '+' : ''}${formatar(t.valor)}
                </div>
                ${t.parcelas_total > 1 ? `<span style="font-size: 0.6rem; color: var(--color-primary); font-weight: 800; text-transform: uppercase;">Parc. ${t.parcela_atual}/${t.parcelas_total}</span>` : ''}
            </div>
        </div>
    `).join('');
}

async function handlePagarFatura(contaId) {
    const account = _contas.find(c => c.id === contaId);
    if (!account) return;
    
    const transactions = (typeof _allTransactions !== 'undefined') ? _allTransactions : [];
    const totalSpent = transactions
        .filter(t => t.conta_id === contaId)
        .reduce((acc, t) => acc + (t.tipo === "entrada" ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
    
    const valorFatura = Math.abs(Math.min(0, totalSpent - parseFloat(account.saldo_inicial || 0)));
    
    if (valorFatura <= 0) {
        showToast('Não há saldo devedor nesta fatura.', 'info');
        return;
    }

    const confirmed = await confirmPremium(`Deseja realizar o pagamento total da fatura no valor de ${formatar(valorFatura)}?`, {
        title: 'Pagamento de Fatura',
        type: 'info',
        confirmText: 'Pagar Agora'
    });
    if (confirmed) {
        showToast('Funcionalidade de pagamento em desenvolvimento.', 'alert');
    }
}

window.handlePagarFaturaNoModal = function() {
    if (_currentInvoiceAccountId) {
        handlePagarFatura(_currentInvoiceAccountId);
    }
};

window.handleOpenFaturas = handleOpenFaturas;
window.handlePagarFatura = handlePagarFatura;
/**
 * Fluxo de Pagamento de Fatura (Double-Entry)
 */
window.initiatePaymentFlow = function() {
    const selector = document.getElementById('payment-source-selector');
    const payBtn = document.getElementById('btn-pay-invoice');
    const actionsConfirm = document.getElementById('payment-actions-confirm');
    const selectOrigem = document.getElementById('select-pagamento-origem');

    if (!selector || !payBtn || !actionsConfirm || !selectOrigem) return;

    // Filtrar contas que não sejam de crédito para pagamento
    const contasOrigem = _contas.filter(c => c.tipo !== 'credito');
    
    if (contasOrigem.length === 0) {
        showToast('Você não possui contas de saldo (Corrente/Dinheiro) para realizar o pagamento.', 'alert');
        return;
    }

    selectOrigem.innerHTML = contasOrigem.map(c => `
        <option value="${c.id}">${escapeHTML(c.nome)} (${formatar(c.saldo_inicial || 0)})</option>
    `).join('');

    selector.style.display = 'block';
    payBtn.style.display = 'none';
    actionsConfirm.style.display = 'flex';
};

window.cancelPaymentFlow = function() {
    const selector = document.getElementById('payment-source-selector');
    const payBtn = document.getElementById('btn-pay-invoice');
    const actionsConfirm = document.getElementById('payment-actions-confirm');
    
    if (selector) selector.style.display = 'none';
    if (payBtn) payBtn.style.display = 'block';
    if (actionsConfirm) actionsConfirm.style.display = 'none';
};

window.handleConfirmarPagamento = async function() {
    if (!_currentInvoiceAccountId) return;

    const contaOrigemId = document.getElementById('select-pagamento-origem').value;
    const accountCredito = _contas.find(c => c.id === _currentInvoiceAccountId);
    const accountOrigem = _contas.find(c => c.id === contaOrigemId);
    
    if (!accountCredito || !accountOrigem) return;

    // Calcular valor total da fatura filtrada (mês selecionado no modal)
    const transactions = (typeof _allTransactions !== 'undefined') ? _allTransactions : [];
    const invoiceTransactions = transactions.filter(t => {
        if (t.conta_id !== _currentInvoiceAccountId) return false;
        const purchaseDate = new Date(t.data + 'T00:00:00');
        const invoiceDate = (typeof getInvoiceMonth === 'function') ? getInvoiceMonth(purchaseDate, accountCredito) : purchaseDate;
        return invoiceDate.getMonth() === _currentInvoiceMonth && invoiceDate.getFullYear() === _currentInvoiceYear;
    });

    const valorFatura = invoiceTransactions.reduce((acc, t) => acc + (t.tipo === 'entrada' ? -parseFloat(t.valor) : parseFloat(t.valor)), 0);

    if (valorFatura <= 0) {
        showToast('Não há saldo devedor para pagar neste período.', 'info');
        cancelPaymentFlow();
        return;
    }

    const confirmMsg = `Confirmar pagamento de ${formatar(valorFatura)}?\n\nOrigem: ${accountOrigem.nome}\nDestino: ${accountCredito.nome}`;
    const confirmed = await confirmPremium(confirmMsg, {
        title: 'Confirmar Transferência',
        type: 'warning'
    });
    if (!confirmed) return;

    try {
        const user = await getCurrentUser();
        const today = new Date().toLocaleDateString('en-CA');

        // 1. Criar Saída na Conta de Origem
        const { error: errorSaida } = await supabase.from('transacoes').insert([{
            user_id: user.id,
            descricao: `Pagamento Fatura: ${accountCredito.nome}`,
            valor: valorFatura,
            tipo: 'saida',
            conta_id: contaOrigemId,
            data: today,
            categoria_id: (await getCategoriaPagamentoId(user.id))
        }]);

        if (errorSaida) throw errorSaida;

        // 2. Criar Entrada (Ajuste) no Cartão de Crédito
        const { error: errorEntrada } = await supabase.from('transacoes').insert([{
            user_id: user.id,
            descricao: `Pagamento Recebido: ${accountOrigem.nome}`,
            valor: valorFatura,
            tipo: 'entrada',
            conta_id: _currentInvoiceAccountId,
            data: today,
            categoria_id: (await getCategoriaPagamentoId(user.id))
        }]);

        if (errorEntrada) throw errorEntrada;

        showToast('Pagamento realizado com sucesso! 🚀', 'success');
        cancelPaymentFlow();
        
        if (typeof closeModal === 'function') closeModal('modal-faturas');
        else if (document.getElementById('modal-faturas')) document.getElementById('modal-faturas').classList.remove('active');
        
        // Recarregar dados para atualizar a dashboard e os saldos
        if (typeof loadContas === 'function') await loadContas(user.id);
        if (typeof loadTransactions === 'function') await loadTransactions(user.id);
        
    } catch (err) {
        console.error('C.A.S.H. Unit Error:', err);
        showToast('Erro ao processar pagamento.', 'error');
    }
};

async function getCategoriaPagamentoId(userId) {
    // Tentar achar uma categoria "Pagamento" ou "Ajuste"
    try {
        const { data } = await supabase.from('categorias').select('id').eq('user_id', userId).ilike('nome', '%Pagamento%').limit(1);
        if (data && data.length > 0) return data[0].id;
        
        // Se não achar, tenta a primeira disponível
        const { data: fallback } = await supabase.from('categorias').select('id').eq('user_id', userId).limit(1);
        return fallback && fallback.length > 0 ? fallback[0].id : null;
    } catch (e) {
        return null;
    }
}

/**
 * Notificações de Vencimento de Fatura
 */
function checkInvoiceDueDates() {
    const container = document.getElementById('invoice-alerts-container');
    if (!container) return;

    const creditCards = _contas.filter(c => c.tipo === 'credito' && c.dia_vencimento);
    const now = new Date();
    const today = now.getDate();
    
    let alertsHtml = '';

    creditCards.forEach(card => {
        const diff = card.dia_vencimento - today;
        
        if (diff >= 0 && diff <= 5) {
            const isToday = diff === 0;
            alertsHtml += `
                <div class="alert-premium" style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; background: ${isToday ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'}; border: 1px solid ${isToday ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; animation: slideIn 0.3s ease-out;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: ${isToday ? '#EF4444' : '#F59E0B'}; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--color-text-main);">${isToday ? 'Vence Hoje!' : 'Fatura Próxima'}</div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.2;">Cartão <b>${escapeHTML(card.nome)}</b> vence dia ${card.dia_vencimento}.</div>
                    </div>
                    <button class="btn-primary-action" onclick="handleOpenFaturas('${card.id}')" style="margin: 0; padding: 0.5rem 1rem; font-size: 0.7rem; background: ${isToday ? '#EF4444' : '#F59E0B'}; border: none;">PAGAR</button>
                </div>
            `;
        }
    });

    container.innerHTML = alertsHtml;
}

/**
 * Controla a exibição de esqueletos de carregamento (Phase 2)
 */
function showSkeletons(active) {
    const targets = [
        'total-balance', 'liquid-balance', 'credit-debt', 
        'projected-balance-hero', 'chart-mini-forecast',
        'accounts-list', 'insights-list', 'budgets-list'
    ];

    targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (active) {
                el.classList.add('skeleton');
            } else {
                el.classList.remove('skeleton');
            }
        }
    });

    // Especial para grids de transações
    const transList = document.getElementById('recent-transactions-list');
    if (transList && active) {
        transList.innerHTML = Array(5).fill(0).map(() => `
            <div class="skeleton" style="height: 60px; margin-bottom: 0.5rem; border-radius: 12px;"></div>
        `).join('');
    }
}

window.showSkeletons = showSkeletons;
function renderProactiveAlerts() {
    const container = document.getElementById('proactive-alerts-container');
    if (!container) return;

    if (typeof getProactiveAlerts !== 'function') return;
    const alerts = getProactiveAlerts();

    if (alerts.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'grid';
    container.innerHTML = alerts.map(alert => `
        <div class="alert-premium-card card-glass alert-${alert.type}" style="display: flex; gap: 1rem; align-items: center; padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--color-${alert.type}); animation: slideInRight 0.5s ease;">
            <div class="alert-icon" style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-${alert.type})20; color: var(--color-${alert.type}); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="alert-content">
                <h4 style="margin: 0; font-size: 0.9rem; font-weight: 800;">${alert.title}</h4>
                <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--color-text-muted);">${alert.message}</p>
            </div>
            <button class="btn-icon-premium" style="margin-left: auto; opacity: 0.5;" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Tornar global
window.renderProactiveAlerts = renderProactiveAlerts;

/**
 * Global Modal Helpers
 */
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    if (typeof triggerHaptic === 'function') triggerHaptic(20);
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};
