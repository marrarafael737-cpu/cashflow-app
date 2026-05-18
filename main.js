/* main.js - Orchestrator & Global State */

// Centralized Application State & Utilities
const App = {
    init: () => {
        window.addEventListener('error', (e) => {
            console.error('🔴 C.A.S.H. Unit Error:', e.message);
            if (typeof showToast === 'function') showToast('Erro no sistema: ' + e.message, 'error');
        });
    },
    State: {
        allTransactions: [],
        cacheFiles: [
            './js/offline-db.js',
            './js/sync-engine.js',
            './js/offline-sync.js',
            './js/smart-parser.js',
            './assets/mascot.svg'
        ],
        categories: [],
        subcategories: [],
        contas: [],
        budgets: [],
        metas: [],
        recorrencias: [],
        isLoading: true,
        user: null
    },
    Utils: {
        /**
         * Sanitizes strings to prevent XSS.
         */
        sanitize: (str) => {
            if (!str) return '';
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        },
        /**
         * Triggers haptic feedback if available.
         */
        triggerHaptic: (intensity = 10) => {
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(intensity);
            }
        },
        /**
         * Normalizes date to UTC to avoid timezone shifts.
         */
        formatToDateInput: (date) => {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        }
    }
};

App.init();

// Legacy global pointer for compatibility with older modules
window._allTransactions = App.State.allTransactions;
window._categories = App.State.categories;
window._contas = App.State.contas;
window._budgets = App.State.budgets;
window._recorrencias = App.State.recorrencias;
const CATEGORY_MAP = {
    // Despesas (Saídas)
    'Alimentação': { icon: 'fa-utensils', color: '#FF4D4D' },
    'Mercado': { icon: 'fa-shopping-cart', color: '#FF9F43' },
    'Transporte': { icon: 'fa-car', color: '#54A0FF' },
    'Uber': { icon: 'fa-taxi', color: '#2C3E50' },
    'Moradia': { icon: 'fa-home', color: '#1DD1A1' },
    'Aluguel': { icon: 'fa-key', color: '#1DD1A1' },
    'Lazer': { icon: 'fa-cocktail', color: '#EE5253' },
    'Educação': { icon: 'fa-graduation-cap', color: '#5F27CD' },
    'Saúde': { icon: 'fa-heartbeat', color: '#FF9FF3' },
    'Assinaturas': { icon: 'fa-calendar-check', color: '#00D2D3' },
    'Internet': { icon: 'fa-wifi', color: '#00D2D3' },
    'Luz': { icon: 'fa-bolt', color: '#FECA57' },
    'Água': { icon: 'fa-tint', color: '#48DBFB' },
    'Pets': { icon: 'fa-paw', color: '#8395A7' },
    'Presentes': { icon: 'fa-gift', color: '#F368E0' },
    'Investimento': { icon: 'fa-chart-pie', color: '#0BE881' },
    'Cartão de Crédito': { icon: 'fa-credit-card', color: '#FF9F43' },
    
    // Receitas (Entradas)
    'Salário': { icon: 'fa-money-bill-wave', color: '#00D2D3' },
    'Freelance': { icon: 'fa-laptop-code', color: '#341F97' },
    'Investimentos': { icon: 'fa-chart-line', color: '#01A3A4' },
    'Vendas': { icon: 'fa-tags', color: '#FF9F43' },
    'Prêmio': { icon: 'fa-trophy', color: '#FECA57' },
    'Outros': { icon: 'fa-ellipsis-h', color: '#8395A7' },
    'Geral': { icon: 'fa-tags', color: '#8395A7' }
};

function getCategoryConfig(name) {
    if (!name) return CATEGORY_MAP['Geral'];
    const cleanName = name.trim();
    return CATEGORY_MAP[cleanName] || { icon: 'fa-tags', color: '#8395A7' };
}


/**
 * Atualiza o avatar na sidebar (avatar-header) e no modal de perfil (profile-avatar-preview).
 * Se houver URL de imagem, usa <img>. Senão, mostra as iniciais do nome.
 */
function updateAvatarUI(fullName, avatarUrl) {
    const initials = (fullName || 'U').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    
    // Aplicar cache buster se for uma URL remota
    const finalUrl = avatarUrl ? (avatarUrl.includes('?') ? `${avatarUrl}&t=${Date.now()}` : `${avatarUrl}?t=${Date.now()}`) : null;

    console.log('C.A.S.H. Unit: Atualizando Avatar UI...', { fullName, hasUrl: !!avatarUrl });

    // Sidebar avatar
    const sidebarAvatar = document.getElementById('avatar-header');
    if (sidebarAvatar) {
        if (finalUrl) {
            sidebarAvatar.innerHTML = `<img src="${finalUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            sidebarAvatar.innerHTML = `<span id="avatar-initials" style="font-size:0.875rem;">${initials}</span>`;
        }
    }

    // Modal preview
    const previewEl = document.getElementById('profile-avatar-preview');
    const previewInitials = document.getElementById('profile-avatar-initials');
    if (previewEl) {
        if (finalUrl) {
            previewEl.innerHTML = `<img src="${finalUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else if (previewInitials) {
            previewInitials.textContent = initials;
            previewEl.innerHTML = ''; // Limpar se houver imagem anterior
            previewEl.appendChild(previewInitials);
        }
    }

    // View Profile (Tela de Perfil)
    const viewAvatarEl = document.getElementById('view-profile-avatar');
    const viewAvatarInitials = document.getElementById('view-profile-avatar-initials');
    if (viewAvatarEl) {
        if (finalUrl) {
            viewAvatarEl.innerHTML = `<img src="${finalUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else if (viewAvatarInitials) {
            viewAvatarInitials.textContent = initials;
            viewAvatarEl.innerHTML = ''; // Limpar se houver imagem anterior
            viewAvatarEl.appendChild(viewAvatarInitials);
        }
    }
}

/**
 * Exibe uma prévia imediata da imagem escolhida no modal de perfil (antes do upload).
 */
function setAvatarPreview(dataUrl) {
    const previewEl = document.getElementById('profile-avatar-preview');
    if (previewEl) {
        previewEl.innerHTML = `<img src="${dataUrl}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page.toLowerCase() === 'dashboard.html' || page === '') {
        await initDashboard();
    }
});

async function initDashboard() {
    try {
        let user = null;
        if (typeof getCurrentUser === 'function') {
            user = await getCurrentUser();
        } else {
            console.error('Função getCurrentUser não encontrada. Verifique se o auth.js carregou corretamente.');
        }

        if (!user) {
            console.warn('Usuário não autenticado. Redirecionando para login...');
            window.location.href = 'login.html';
            return;
        }

        App.State.user = user;

        // --- ATUALIZAÇÃO IMEDIATA DE UI (Nomes e Emails) ---
        // Fazemos isso o mais rápido possível para evitar a sensação de "hang"
        try {
            const emailElements = document.querySelectorAll('.user-email, #user-email-header, #profile-email');
            emailElements.forEach(el => el.textContent = user.email);
            
            const nameElements = document.querySelectorAll('#user-name-header, #profile-name');
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário CashFlow';
            nameElements.forEach(el => el.textContent = fullName);

            // Atualizar avatar na sidebar e na view de perfil
            const avatarUrl = user.user_metadata?.avatar_url || null;
            updateAvatarUI(fullName, avatarUrl);
            
            console.log('C.A.S.H. Unit: Perfil do usuário atualizado na UI.');
        } catch (e) {
            console.warn('Erro ao atualizar info de usuário:', e);
        }

        // 3. Inicialização de UI e Interações (Essenciais)
        try { setupModalLogic(); } catch (e) { console.error('Erro ModalLogic:', e); }
        try { setupMobileInteractions(); } catch (e) { console.error('Erro MobileInteractions:', e); }
        try { setupDynamicDropdowns(); } catch (e) { console.error('Erro Dropdowns:', e); }
        try { setupSecurity(user.id); } catch (e) { console.error('Erro Security:', e); }
        try { setupNavigation(); } catch (e) { console.error('Erro Navigation:', e); }
        try { setupEventListeners(user.id); } catch (e) { console.error('Erro EventListeners:', e); }
        try { if (window.Investments) window.Investments.init(); } catch (e) { console.error('Erro InvestmentsInit:', e); }

        // 2. Inicializar Mascote (Visual)
        await loadMascotSVG();
        initMascotInteractions();
        initMascotGSAP();
        
        // 3. Carregar Dados (Em segundo plano, sem travar a UI)
        if (typeof showSkeletons === 'function') showSkeletons(true);
        
        // Haptic feedback initialization for nav items
        document.querySelectorAll('.nav-item, .nav-item-mobile, .mobile-nav-item').forEach(el => {
            el.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(15);
            });
        });
        
        try {
            await Promise.all([
                initializeCategories(user.id).catch(e => console.error('Erro Cat:', e)),
                loadContas(user.id).catch(e => console.error('Erro Contas:', e))
            ]);

            // Transações e Render Imediato
            await loadTransactions(user.id).catch(e => console.error('Erro Trans:', e));
            
            // Phase 3: Learn from history
            if (typeof SmartParser !== 'undefined') {
                if (typeof SmartParser.init === 'function') SmartParser.init();
                if (typeof SmartParser.learnFromHistory === 'function') {
                    SmartParser.learnFromHistory(_allTransactions);
                }
            }

            if (typeof filterAndRenderData === 'function') filterAndRenderData();

            initTheme();
            initPrivacyMode();
            
            // Forçar View Inicial (Dashboard)
            if (typeof switchView === 'function') switchView('dashboard');
            
            // Setup listeners de modals e formulários
            if (typeof setupCategoryFormEvents === 'function') setupCategoryFormEvents(user.id);
            if (typeof setupAccountFormEvents === 'function') setupAccountFormEvents(user.id);
            if (typeof setupGoalsLogic === 'function') setupGoalsLogic(user.id);
            if (typeof initBudgetEvents === 'function') initBudgetEvents(user.id);
            if (typeof setupEnhancementListeners === 'function') setupEnhancementListeners(user.id);
            if (typeof setupRecurringEvents === 'function') setupRecurringEvents(user.id);
            if (typeof setupParserEvents === 'function') setupParserEvents(user.id);



            // Background load
            loadMetas(user.id).catch(e => console.error('Erro Metas:', e));
            loadOrcamentos(user.id).catch(e => console.error('Erro Orç:', e));
            loadRecorrencias(user.id).catch(e => console.error('Erro Rec:', e));

            // 3.5. Processar Recorrências Automáticas
            if (typeof processRecurringTransactions === 'function') {
                await processRecurringTransactions(user.id);
            }
        } catch (dataError) {
            console.warn('C.A.S.H. Unit: Alguns dados não puderam ser carregados, mas o app continua funcional.', dataError);
        } finally {
            // --- REMOVER LOADER SEMPRE ---
            const removeLoader = () => {
                const loader = document.getElementById('loading-overlay');
                if (loader) {
                    loader.style.opacity = '0';
                    loader.style.pointerEvents = 'none';
                    setTimeout(() => {
                        if (loader.parentNode) loader.remove();
                        if (typeof showSkeletons === 'function') showSkeletons(false);
                        console.log('C.A.S.H. Unit: Interface Liberada.');
                    }, 500);
                }
            };

            // Force loader removal after safety timeout (5s)
            setTimeout(removeLoader, 5000); 
            removeLoader();
        }
        
        showSkeletons(false);
        
        // Renderização inicial das novas Views
        if (typeof renderWallets === 'function') renderWallets();
        if (typeof renderCalendar === 'function') renderCalendar();

        // 4. Lógicas Adicionais
        initGamification(user.id);
        if (typeof initEnhancements === 'function') initEnhancements(user.id);
        if (typeof initSimulatorEvents === 'function') initSimulatorEvents();
        if (typeof setupCategoryViewEvents === 'function') setupCategoryViewEvents(user.id);
        if (typeof renderCategoriesView === 'function') renderCategoriesView();
        if (typeof initImportEvents === 'function') initImportEvents(user.id);

        // 4.1 Histórico de Segurança - Registrar acesso e renderizar log
        logSecurityAccess(user.id);
        loadSecuritySessions(user.id);

        // Disparo inicial da projeção avançada
        if (typeof calculateProjection === 'function') calculateProjection();

        if (window.innerWidth <= 1024) {
            const sb = document.querySelector('.sidebar-desktop');
            const ov = document.getElementById('sidebar-backdrop');
            if (sb) sb.classList.remove('mobile-active');
            if (ov) ov.classList.remove('active');
            document.body.style.overflow = '';
        }

        setTimeout(() => {
            if (typeof window.closeSidebar === 'function') {
                window.closeSidebar();
            }
        }, 200);

        if (typeof clearMascotInitMessage === 'function') clearMascotInitMessage();
        console.log('C.A.S.H. Unit: Sistema totalmente operacional.');
        
    } catch (error) {
        console.error('Critical Init Error:', error);
        showSkeletons(false); // Liberar UI mesmo com erro
        if (typeof showMascotMessage === 'function') {
            showMascotMessage('Eita! Tive um curto-circuito nos dados. Recarregue a página, por favor?', 'alert', '', 'angry');
        }
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar o sistema. Verifique sua conexão.', 'error');
        }
    }
}

/**
 * Agrupa ouvintes de eventos globais
 */
function setupEventListeners(userId) {
    // 1. Tour Listeners
    const tourBtns = [
        document.getElementById('btn-start-tour-sidebar'),
        document.getElementById('btn-start-tour-top'),
        document.getElementById('btn-start-tour-mobile')
    ];
    
    tourBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof startMascotTour === 'function') startMascotTour();
            });
        }
    });

    // 2. Modais de Abertura
    const modalMappings = [
        { btn: 'btn-open-modal-conta', modal: 'modal-account' },
        { btn: 'btn-open-modal-account', modal: 'modal-account' },
        { btn: 'btn-open-modal-meta', modal: 'modal-goal' },
        { btn: 'btn-new-transaction', modal: 'modal-transaction', onOpen: () => {
            if (typeof window.closeSidebar === 'function') window.closeSidebar();
            if (typeof updateCategoryDropdown === 'function') updateCategoryDropdown();
            if (typeof updateAccountDropdown === 'function') updateAccountDropdown();
        }},
        { btn: 'btn-open-modal-orcamento', modal: 'modal-budget', onOpen: () => typeof updateBudgetCategoryDropdown === 'function' && updateBudgetCategoryDropdown() },
        { btn: 'btn-open-categorias-side', modal: 'modal-category', onOpen: () => typeof renderCategories === 'function' && renderCategories() },
        { btn: 'btn-edit-profile', modal: 'modal-profile', onOpen: async () => {
            const u = await getCurrentUser();
            if (u) {
                document.getElementById('edit-full-name').value = u.user_metadata?.full_name || '';
                document.getElementById('edit-email').value = u.email || '';
                const fullName = u.user_metadata?.full_name || u.user_metadata?.name || 'Usuário';
                const avatarUrl = u.user_metadata?.avatar_url || null;
                updateAvatarUI(fullName, avatarUrl);
            }
        }},
        { btn: 'btn-open-modal-recorrencia', modal: 'modal-recorrencia', onOpen: () => {
            if (typeof updateRecurringCategoryDropdown === 'function') updateRecurringCategoryDropdown();
        } }
    ];

    modalMappings.forEach(map => {
        const btn = document.getElementById(map.btn);
        const modal = document.getElementById(map.modal);
        if (btn && modal) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 10);
                
                // Resetar modal de conta para novo cadastro se for o caso
                if (map.modal === 'modal-account' && map.btn.includes('open')) {
                    const form = document.getElementById('account-form');
                    if (form) form.reset();
                    document.getElementById('edit-account-id').value = '';
                    const deleteBtn = document.getElementById('btn-delete-account');
                    if (deleteBtn) deleteBtn.style.display = 'none';
                    const submitBtn = document.getElementById('btn-account-submit');
                    if (submitBtn) submitBtn.textContent = 'Criar Conta';
                    const modalTitle = modal.querySelector('h2');
                    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-wallet"></i> Nova Conta';
                }

                if (map.onOpen) map.onOpen();
            });
        }
    });

    // 3. Profile Form Submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        // Live preview when user picks a file
        const avatarFileInput = document.getElementById('avatar-file-input');
        if (avatarFileInput) {
            avatarFileInput.addEventListener('change', () => {
                const file = avatarFileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setAvatarPreview(ev.target.result);
                    const status = document.getElementById('avatar-upload-status');
                    if (status) status.textContent = `📎 ${file.name} selecionada. Clique em Salvar para confirmar.`;
                };
                reader.readAsDataURL(file);
            });
        }

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-full-name').value.trim();
            const btn = profileForm.querySelector('button[type="submit"]');
            if (!btn) return;
            if (btn.disabled || btn.classList.contains('loading')) return;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            try {
                let avatarUrl = null;

                // 1. Upload avatar se um arquivo foi selecionado
                const fileInput = document.getElementById('avatar-file-input');
                const file = fileInput?.files[0];
                if (file) {
                    const status = document.getElementById('avatar-upload-status');
                    if (status) status.textContent = '⬆️ Enviando foto...';

                    const u = await getCurrentUser();
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${u.id}/avatar.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file, { upsert: true, contentType: file.type });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    avatarUrl = urlData.publicUrl + `?t=${Date.now()}`; // cache bust
                    if (status) status.textContent = '✅ Foto enviada!';
                }

                // 2. Montar metadata a salvar
                const metaUpdate = { full_name: newName };
                if (avatarUrl) metaUpdate.avatar_url = avatarUrl;

                const { error } = await supabase.auth.updateUser({ data: metaUpdate });
                if (error) throw error;

                showToast('Perfil atualizado com sucesso! 🚀', 'success');
                
                // 3. Atualizar UI
                const nameElements = document.querySelectorAll('#user-name-header, #profile-name');
                nameElements.forEach(el => el.textContent = newName);

                if (avatarUrl) updateAvatarUI(newName, avatarUrl);
                
                document.getElementById('modal-profile').classList.remove('active');
            } catch (err) {
                console.error('Erro ao atualizar perfil:', err);
                showToast('Erro ao atualizar perfil: ' + (err.message || 'Tente novamente.'), 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 4. Fechamento de Modais
    // 2. Logout Handlers (Desktop & Mobile)
    const btnLogout = document.getElementById('btn-logout');
    const btnLogoutMobile = document.getElementById('btn-logout-mobile');
    
    if (btnLogout) btnLogout.addEventListener('click', () => handleLogout());
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', () => handleLogout());

    // 3. Configurar Lógicas de Formulários
    setupCategoryFormEvents(userId);
    setupAccountFormEvents(userId);
    setupGoalsLogic(userId);
    if (typeof setupRecurringEvents === 'function') setupRecurringEvents(userId);
    
    // Abrir modal de meta (Novo)
    const btnOpenMeta = document.getElementById('btn-open-modal-meta');
    if (btnOpenMeta) {
        btnOpenMeta.addEventListener('click', () => {
            const editField = document.getElementById('edit-goal-id');
            if (editField) editField.value = '';
            
            const form = document.getElementById('goal-form');
            if (form) form.reset();
            
            const modal = document.getElementById('modal-goal');
            if (modal) {
                modal.querySelector('h2').innerHTML = '<i class="fas fa-bullseye"></i> Definir Meta';
                window.openModal('modal-goal');
            }
        });
    }

    initBudgetEvents(userId);
    setupEnhancementListeners(userId);
    setupSmartSearch(userId);

    // Calendário Navigation
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    if (btnPrevMonth && btnNextMonth) {
        btnPrevMonth.addEventListener('click', () => {
            _currentCalendarDate.setMonth(_currentCalendarDate.getMonth() - 1);
            if (typeof renderCalendar === 'function') renderCalendar();
        });
        btnNextMonth.addEventListener('click', () => {
            _currentCalendarDate.setMonth(_currentCalendarDate.getMonth() + 1);
            if (typeof renderCalendar === 'function') renderCalendar();
        });
    }

    const forms = [
        { id: 'transaction-form', handler: () => handleAddTransaction(userId) },
        { id: 'dashboard-transaction-form', handler: () => handleDashboardAddTransaction(userId) }
    ];

    forms.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.addEventListener('submit', (e) => {
            e.preventDefault();
            f.handler();
        });
    });
}



/**
 * Handler específico para o formulário do dashboard (sidebar)
 */
async function handleDashboardAddTransaction(userId) {
    // Mapear campos do dashboard para os IDs esperados por handleAddTransaction
    // ou simplesmente extrair os valores e chamar o insert.
    // Para manter a consistência com as melhorias de handleAddTransaction,
    // vamos replicar a lógica essencial aqui, mas com os IDs corretos.
    
    const desc = document.getElementById('dash-descricao').value;
    const valorRaw = document.getElementById('dash-valor').value.replace(',', '.');
    const valor = parseFloat(valorRaw);
    const tipo = document.getElementById('dash-tipo').value;
    const catId = document.getElementById('dash-categoria').value;
    const contaId = document.getElementById('dash-conta').value;
    const data = document.getElementById('dash-data').value;

    if (!desc || isNaN(valor) || valor <= 0 || !catId || !contaId || !data) {
        showToast('Preencha todos os campos corretamente. O valor deve ser maior que zero.', 'alert');
        return;
    }

    const btn = document.querySelector('#dashboard-transaction-form button[type="submit"]');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    const transactionData = {
        user_id: userId,
        descricao: desc,
        valor: parseFloat(valorRaw),
        tipo: tipo,
        categoria_id: catId,
        conta_id: contaId,
        data: data
    };

    // --- OFFLINE CHECK (IndexedDB) ---
    if (!navigator.onLine) {
        try {
            await saveOfflineTransaction(transactionData);
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
            document.getElementById('dashboard-transaction-form').reset();
            
            // Atualizar UI localmente
            if (typeof _allTransactions !== 'undefined') _allTransactions = [transactionData, ..._allTransactions];
            if (typeof filterAndRenderData === 'function') filterAndRenderData();
            if (typeof updateSummary === 'function') updateSummary();
            
            showToast('Offline: Lançamento rápido salvo localmente! 🤖', 'info');
            return;
        } catch (err) {
            console.error('Erro ao salvar offline:', err);
        }
    }

    const { error } = await supabase.from('transacoes').insert([transactionData]);

    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

    if (!error) {
        showToast('Lançamento rápido realizado!', 'success');
        document.getElementById('dashboard-transaction-form').reset();
        if (typeof loadTransactions === 'function') await loadTransactions(userId);
        if (typeof updateSummary === 'function') updateSummary();
    } else {
        console.error('Erro Lançamento Rápido:', error);
        showToast('Erro ao salvar: ' + error.message, 'error');
    }
}

function setupSmartSearch(userId) {
    const searchInput = document.getElementById('smart-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = _allTransactions.filter(t => 
            t.descricao.toLowerCase().includes(term) || 
            t.categoria_nome.toLowerCase().includes(term)
        );
        
        if (typeof renderTransactions === 'function') {
            renderTransactions(filtered);
        }
    });
}

function setupSecurity(userId) {
    const lockOverlay = document.getElementById('biometrics-overlay');
    const btnUnlock = document.getElementById('btn-unlock-biometrics');
    const biometricsToggle = document.getElementById('toggle-biometrics');
    const piggyToggle = document.getElementById('toggle-piggy-bank');

    // Toggle Biometria
    if (biometricsToggle) {
        biometricsToggle.checked = localStorage.getItem(`biometrics_enabled_${userId}`) === 'true';
        biometricsToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                try {
                    const success = await SecurityVault.registerBiometrics(userId);
                    if (success) {
                        localStorage.setItem(`biometrics_enabled_${userId}`, 'true');
                        showToast('Biometria ativada com sucesso!', 'success');
                    } else {
                        e.target.checked = false;
                    }
                } catch (err) {
                    e.target.checked = false;
                    showToast(err.message, 'error');
                }
            } else {
                localStorage.removeItem(`biometrics_enabled_${userId}`);
                showToast('Biometria desativada.', 'info');
            }
        });
    }
    
    // Central de Segurança agora é uma View
    const mainContent = document.querySelector('.dashboard-main-content');
    if (mainContent) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-view') {
                    const view = mainContent.getAttribute('data-view');
                    if (view === 'security') loadSecuritySessions(userId);
                }
            });
        });
        observer.observe(mainContent, { attributes: true });
    }

    // Bloqueio Inicial
    if (lockOverlay && btnUnlock && localStorage.getItem(`biometrics_enabled_${userId}`) === 'true') {
        lockOverlay.classList.remove('hidden');
        btnUnlock.addEventListener('click', async () => {
            const success = await SecurityVault.authenticateBiometrics(userId);
            if (success) {
                lockOverlay.classList.add('hidden');
                showToast('Bem-vindo de volta!', 'success');
            } else {
                showToast('Falha na autenticação.', 'error');
            }
        });
    }

    // Toggle Piggy Bank
    if (piggyToggle) {
        piggyToggle.checked = localStorage.getItem('piggy_bank_active') === 'true';
        piggyToggle.addEventListener('change', (e) => {
            localStorage.setItem('piggy_bank_active', e.target.checked);
            showToast(e.target.checked ? 'Piggy Bank Ativado!' : 'Piggy Bank Desativado.', 'info');
        });
    }

    // Gestão de Sessões

    const btnLogoutOthers = document.getElementById('btn-logout-others');

    if (btnLogoutOthers) {
        btnLogoutOthers.addEventListener('click', async () => {
            const confirmed = await confirmPremium('Deseja realmente encerrar todas as outras sessões?', {
                title: 'Segurança da Conta',
                type: 'warning'
            });
            if (confirmed) {
                try {
                    await SecurityVault.logoutAllOtherSessions(supabase);
                    showToast('Outras sessões encerradas.', 'success');
                    loadSecuritySessions(userId);
                } catch (e) {
                    showToast('Erro ao encerrar sessões.', 'error');
                }
            }
        });
    }

    // Atalho para Modo Privacidade (Tecla P)
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p' && e.altKey) {
            document.body.classList.toggle('privacy-active');
            const isActive = document.body.classList.contains('privacy-active');
            showToast(isActive ? 'Modo Privacidade Ativado' : 'Modo Privacidade Desativado', 'info');
        }
    });

    // Magic Input (NLP)
    const btnMagic = document.getElementById('btn-magic-submit');
    const magicInput = document.getElementById('magic-input');
    if (btnMagic && magicInput) {
        btnMagic.addEventListener('click', () => handleMagicInput(userId));
        magicInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleMagicInput(userId);
        });

        // Click nos chips de sugestão
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.getAttribute('data-text');
                if (text) {
                    magicInput.value = text;
                    handleMagicInput(userId);
                }
            });
        });
    }

    loadSecuritySessions(userId);
    setupPrivacyAndSecurity(userId);
    // initOnboarding(userId);

    // --- REGISTRO SERVICE WORKER (PWA) ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('C.A.S.H. Unit: Service Worker Ativo (Offline Mode Ready)', reg))
                .catch(err => console.log('C.A.S.H. Unit: Erro ao carregar Service Worker', err));
        });

        // Força o reload da página quando o novo Service Worker assume o controle
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }

    // --- PWA INSTALL LOGIC ---
    let deferredPrompt;
    const installBtn = document.getElementById('pwa-install-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'block';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    // --- SHARE LOGIC ---
    const shareBtn = document.getElementById('btn-share-snapshot');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    const balance = document.getElementById('total-balance').textContent;
                    await navigator.share({
                        title: 'Meu Progresso no CashFlow 🚀',
                        text: `Olha só como minhas finanças estão evoluindo! Saldo atual: ${balance}. Vem pro CashFlow você também!`,
                        url: window.location.origin
                    });
                    showToast('Progresso compartilhado!', 'success');
                } catch (err) {
                    console.error('Erro ao compartilhar:', err);
                }
            } else {
                showToast('Compartilhamento não suportado neste navegador.', 'info');
            }
        });
    }
}

/**
 * Onboarding Engine (Tutorial do Cashy)
 */
function initOnboarding(userId) {
    const tourCompleted = localStorage.getItem(`tour_completed_${userId}`);
    if (!tourCompleted) {
        // Delay para garantir que tudo carregou
        setTimeout(() => {
            if (typeof startMascotTour === 'function') {
                startMascotTour(userId);
            }
        }, 2000);
    }
}

/**
 * Configura Modo Privacidade e Bloqueio por Inatividade
 */
function setupPrivacyAndSecurity(userId) {
    const btnPrivacy = document.getElementById('btn-toggle-privacy');
    
    // 1. Lógica do Toggle de Privacidade
    if (btnPrivacy) {
        // Estado inicial
        const isPrivacyActive = localStorage.getItem(`privacy_active_${userId}`) === 'true';
        if (isPrivacyActive) {
            document.body.classList.add('privacy-active');
            const icon = btnPrivacy.querySelector('i');
            if (icon) icon.className = 'fas fa-eye-slash';
        }

        btnPrivacy.addEventListener('click', () => {
            const isActive = document.body.classList.toggle('privacy-active');
            localStorage.setItem(`privacy_active_${userId}`, isActive);
            const icon = btnPrivacy.querySelector('i');
            if (icon) icon.className = isActive ? 'fas fa-eye-slash' : 'fas fa-eye';
            showToast(isActive ? 'Modo Privacidade Ativado' : 'Modo Privacidade Desativado', 'info');
        });
    }

    // 2. Lógica de Inatividade (Bloqueio PIN)
    setupInactivityManager(userId);

    // 3. Inicializar UI de Reset de Fábrica
    if (typeof initResetUI === 'function') {
        initResetUI(userId);
    }
}

let _inactivityTimer;
const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutos

function setupInactivityManager(userId) {
    // Se não estiver logado ou se for página de login, não ativa
    if (!userId) return;

    function resetTimer() {
        if (document.getElementById('modal-pin').classList.contains('hidden')) {
            clearTimeout(_inactivityTimer);
            _inactivityTimer = setTimeout(() => showPinModal(userId), INACTIVITY_LIMIT);
        }
    }

    // Eventos que resetam o timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
        document.addEventListener(name, resetTimer, true);
    });

    resetTimer();
}

function showPinModal(userId) {
    const modal = document.getElementById('modal-pin');
    const title = document.getElementById('pin-title');
    const msg = document.getElementById('pin-msg');
    const btnBio = document.getElementById('btn-biometry');
    
    if (!modal) return;

    modal.classList.remove('hidden');
    _currentPinInput = '';
    updatePinDots();

    const pinSet = localStorage.getItem(`user_pin_${userId}`);
    
    if (!pinSet) {
        title.textContent = 'Proteger Conta';
        msg.textContent = 'Defina um PIN de 4 dígitos para bloqueio automático';
        if (btnBio) btnBio.style.display = 'none';
    } else {
        title.textContent = 'Bem-vindo de volta';
        msg.textContent = 'Insira seu código de acesso para continuar';
        if (btnBio) btnBio.style.display = 'flex';
    }
}

let _currentPinInput = '';
let _failedPinAttempts = 0;
let _lockoutUntil = 0;

window.handlePinInput = function(value) {
    if (Date.now() < _lockoutUntil) {
        const remaining = Math.ceil((_lockoutUntil - Date.now()) / 1000);
        showToast(`Muitas tentativas. Aguarde ${remaining}s.`, 'error');
        return;
    }
    
    // Feedback tátil visual
    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(10);

    if (value === 'DEL') {
        _currentPinInput = _currentPinInput.slice(0, -1);
    } else if (_currentPinInput.length < 4) {
        _currentPinInput += value;
    }

    updatePinDots();

    if (_currentPinInput.length === 4) {
        // Pequeno delay para o usuário ver o último ponto preenchido
        setTimeout(validatePin, 150);
    }
};

window.handleBiometry = async function() {
    if (typeof SecurityVault !== 'undefined' && SecurityVault.isBiometryAvailable) {
        showToast('Aguardando biometria...', 'info');
        const success = await SecurityVault.authenticate();
        if (success) {
            document.getElementById('modal-pin').classList.add('hidden');
            showToast('Acesso liberado via biometria.', 'success');
            _failedPinAttempts = 0;
            _currentPinInput = '';
        } else {
            showToast('Falha na biometria.', 'error');
        }
    } else {
        showToast('Biometria não disponível neste dispositivo.', 'warning');
    }
};

window.handleLogout = async function() {
    const confirmed = await confirmPremium('Deseja realmente sair da sua conta?', {
        title: 'Encerrar Sessão',
        type: 'warning',
        confirmText: 'Sair agora',
        cancelText: 'Ficar conectado'
    });
    
    if (confirmed) {
        const { error } = await supabase.auth.signOut();
        if (!error) window.location.href = 'login.html';
    }
};

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        if (i < _currentPinInput.length) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

async function validatePin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const storedPin = localStorage.getItem(`user_pin_${user.id}`);
    const container = document.querySelector('.pin-container');
    
    if (!storedPin) {
        // Primeiro uso: definir PIN
        localStorage.setItem(`user_pin_${user.id}`, _currentPinInput);
        showToast('PIN de segurança configurado!', 'success');
        document.getElementById('modal-pin').classList.add('hidden');
        _failedPinAttempts = 0;
    } else if (_currentPinInput === storedPin) {
        // PIN Correto
        document.getElementById('modal-pin').classList.add('hidden');
        showToast('Acesso liberado.', 'success');
        _failedPinAttempts = 0;
        _currentPinInput = '';
    } else {
        // PIN Errado
        _failedPinAttempts++;
        _currentPinInput = '';
        
        // Efeito de erro visual
        if (container) {
            container.classList.add('pin-error-shake');
            setTimeout(() => container.classList.remove('pin-error-shake'), 500);
        }
        
        updatePinDots();
        
        if (_failedPinAttempts >= 3) {
            _lockoutUntil = Date.now() + (30 * 1000); 
            showToast('Muitas tentativas. Bloqueado por 30s.', 'error');
        } else {
            showToast(`PIN incorreto. Tentativas: ${_failedPinAttempts}/3`, 'error');
        }
    }
}

/**
 * Inicializa o tema do sistema (Dark/Light)
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeBtns = document.querySelectorAll('#btn-toggle-theme-sidebar, #btn-toggle-theme-mobile');
    themeBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', target);
            localStorage.setItem('theme', target);
            
            if (icon) {
                icon.className = target === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            showToast(`Tema ${target === 'dark' ? 'Escuro' : 'Claro'} ativado!`, 'info');
        });
    });
}

/**
 * Inicializa o Modo Privacidade (Modo Invisível)
 */
function initPrivacyMode() {
    const isPrivacyActive = localStorage.getItem('privacy_mode') === 'active';
    
    if (isPrivacyActive) {
        document.body.classList.add('privacy-active');
    }

    const privacyBtns = document.querySelectorAll('#btn-toggle-privacy, #btn-toggle-privacy-mobile');
    privacyBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isPrivacyActive ? 'fas fa-eye-slash' : 'fas fa-eye';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const isActive = document.body.classList.toggle('privacy-active');
            localStorage.setItem('privacy_mode', isActive ? 'active' : 'inactive');

            if (icon) {
                icon.className = isActive ? 'fas fa-eye-slash' : 'fas fa-eye';
            }

            showToast(`Modo Privacidade ${isActive ? 'Ativado' : 'Desativado'}`, 'info');
        });
    });
}

/**
 * Atualiza o painel de visão futura com previsões inteligentes (Item 1)
 */
function updateVisionHighlight() {
    const heroProjected = document.getElementById('projected-balance-hero');
    const heroInsight = document.getElementById('projection-insight-hero');
    const heroPace = document.getElementById('daily-pace-hero');

    if (!heroProjected || !heroInsight) return;

    // A função calculateProjection no finance.js já faz todo o trabalho pesado
    // e atualiza os IDs projected-balance-hero, etc.
    // Aqui apenas garantimos que ela seja chamada se houver transações.
    if (typeof calculateProjection === 'function') {
        const projection = calculateProjection(window._allTransactions || []);
        
        // Adicionar um brilho premium se a projeção for positiva
        if (window._projectedBalance > 0) {
            heroProjected.parentElement.classList.add('premium-glow');
        } else {
            heroProjected.parentElement.classList.remove('premium-glow');
        }
    }
}

async function loadSecuritySessions(userId) {
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;

    try {
        const sessions = await SecurityVault.getActiveSessions(supabase);
        
        if (!sessions || sessions.length === 0) {
            sessionList.innerHTML = '<p style="font-size:0.8rem; color:var(--color-text-muted); text-align:center;">Nenhum log de acesso registrado.</p>';
            return;
        }

        sessionList.innerHTML = sessions.map(s => {
            const ua = s.user_agent.toLowerCase();
            let icon = 'fas fa-laptop';
            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) icon = 'fas fa-mobile-alt';
            
            const date = new Date(s.data_hora);
            const timeAgo = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            return `
                <div class="session-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                    <div class="session-icon" style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                        <i class="${icon}"></i>
                    </div>
                    <div class="session-info" style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                        <span class="device" style="font-size: 0.85rem; font-weight: 600;">${s.user_agent.split('(')[0].trim()}</span>
                        <span class="meta" style="font-size: 0.7rem; color: var(--color-text-muted);">
                            <i class="fas fa-clock"></i> ${timeAgo} • <i class="fas fa-network-wired"></i> ${s.ip_origem}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('C.A.S.H. Unit: Falha ao carregar logs de segurança.', e);
        sessionList.innerHTML = '<p style="font-size:0.8rem; color:var(--color-text-muted); padding:1rem; text-align:center;">Informações de segurança indisponíveis.</p>';
    }
}

function showSkeletons(show) {
    const containers = [
        document.getElementById('transactions-body'),
        document.getElementById('accounts-list'),
        document.getElementById('metas-list')
    ];

    containers.forEach(container => {
        if (!container) return;
        if (show) {
            container.innerHTML = `
                <div class="skeleton" style="height: 60px; margin-bottom: 10px; background: var(--color-surface-secondary); border-radius: 8px;"></div>
                <div class="skeleton" style="height: 60px; margin-bottom: 10px; background: var(--color-surface-secondary); border-radius: 8px;"></div>
                <div class="skeleton" style="height: 60px; margin-bottom: 10px; background: var(--color-surface-secondary); border-radius: 8px;"></div>
            `;
        }
    });
}
/**
 * Centralized state management for Magic Input button
 */
function setMagicButtonState(loading) {
    const btn = document.getElementById('btn-magic-submit');
    if (!btn) return;

    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> <span>Processar</span>';
    }
}

console.log('🚀 C.A.S.H. Unit: Motor Magic Input Inicializado v1.2');

window.handleMagicInput = async function(userId) {
    // 1. Tentar obter userId de várias fontes
    if (!userId) {
        if (window.App && App.State && App.State.user) {
            userId = App.State.user.id;
        } else if (window.supabase) {
            // Tenta obter da sessão atual do Supabase de forma síncrona/rápida
            // Correção: Usando o ID do projeto atual (wecvchpyutwjqxoeilgq)
            const sessionStr = localStorage.getItem('sb-wecvchpyutwjqxoeilgq-auth-token');
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    if (session && session.user) userId = session.user.id;
                } catch (e) { console.warn('Falha ao parsear sessão Supabase:', e); }
            }

            // Fallback final: Tentar via API se as outras falharem
            if (!userId && typeof supabase !== 'undefined' && supabase.auth) {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.user) userId = data.session.user.id;
            }
        }
    }

    const input = document.getElementById('magic-input');
    const text = input ? input.value.trim() : '';
    
    console.log('🚀 C.A.S.H. Unit: Iniciando Magic Input...', { text, userId });

    if (!text) {
        console.warn('⚠️ C.A.S.H. Unit: Texto vazio no Magic Input.');
        return;
    }

    // Feedback visual/háptico imediato
    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(15);
    setMagicButtonState(true);

    // Mascot Processing Feedback
    if (typeof showMascotMessage === 'function') {
        showMascotMessage('Deixa eu ver aqui...', 'thinking', '', 'neutral');
    }

    try {
        // --- MULTI-COMMAND SPLITTING (Phase 5) ---
        // Separadores comuns: " e ", ". ", "; ", " também "
        const rawParts = text.split(/\s+e\s+|\s*;\s*|\s*\.\s+|\s+também\s+/i);
        const parts = rawParts.map(p => p.trim()).filter(p => p.length > 3);

        console.log(`🚀 C.A.S.H. Unit: Processando ${parts.length} comandos com SmartNLP...`);

        for (const partText of parts) {
            await processSingleMagicCommand(partText, userId, input);
        }

        // Resumo final do Mascote se houver múltiplos
        if (parts.length > 1 && typeof showMascotMessage === 'function') {
            const msg = `Mágica múltipla! Processei ${parts.length} comandos para você. ✨`;
            showMascotMessage(msg, 'happy', '', 'happy');
        }

    } catch (error) {
        console.error('C.A.S.H. Unit: Erro crítico no Magic Input:', error);
        showToast('Eita! Minha varinha quebrou. Tente novamente.', 'error');
    } finally {
        setMagicButtonState(false);
    }
}

/**
 * Função auxiliar para processar um único comando (extraída da lógica original)
 */
/**
 * Função auxiliar para processar um único comando (extraída da lógica original)
 */
async function processSingleMagicCommand(text, userId, inputElement) {
    try {
        const result = await SmartNLP.process(text);
        console.log('🧠 C.A.S.H. Unit: Processamento SmartNLP:', result);

        // --- 1. WORKFLOW DE SIMULAÇÃO ---
        if (result.type === 'simulation') {
            const amountRegex = /(?:R\$|r\$|\$|reais|conto|pila)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?!\/)(?:\s?(?:reais|conto|pila))?/i;
            const amountMatch = text.match(amountRegex);
            
            if (amountMatch) {
                let valStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
                const valorSimulado = parseFloat(valStr);
                
                if (window.OracleEngine?.simulatePurchase) {
                    window.OracleEngine.simulatePurchase(valorSimulado);
                    if (inputElement) inputElement.value = '';
                    return;
                }
            } else {
                if (typeof showMascotMessage === 'function') {
                    showMascotMessage('Para simular, eu preciso saber o valor. Quanto custaria isso?', 'eyes', '', 'neutral');
                } else {
                    showToast('Inclua o valor para simular.', 'warning');
                }
                return;
            }
        }

        if (!userId) {
            console.error('❌ C.A.S.H. Unit: Usuário não autenticado.');
            showToast('Por favor, faça login.', 'error');
            return;
        }

        const parsed = result.data;
        if (!parsed || !parsed.valor) {
            showToast('Não entendi: "' + text + '"', 'warning');
            return;
        }

        const valor = parsed.valor;
        const tipo = parsed.tipo;
        
        // --- LÓGICA DE DÍVIDA / EMPRÉSTIMO ---
        let isSplit = !!parsed.split;
        let splitWith = parsed.split?.with || 'Alguém';

        let categoria_id = parsed.categoria_id;
        if (!categoria_id && parsed.categoria_nome && typeof _categories !== 'undefined') {
            const normalize = (str) => {
                if (!str) return '';
                return str.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                    .trim();
            };
            const normParsed = normalize(parsed.categoria_nome);
            const catMatch = _categories.find(c => {
                const normCat = normalize(c.nome);
                return normCat.includes(normParsed) || normParsed.includes(normCat);
            });
            if (catMatch) {
                categoria_id = catMatch.id;
                parsed.categoria_nome = catMatch.nome; // Keep the official casing/name
            }
        }

        let conta_id = parsed.conta_id;
        if (!conta_id && typeof _contas !== 'undefined' && Array.isArray(_contas) && _contas.length > 0) {
            const defaultAcc = _contas.find(c => c.nome.toLowerCase().includes('carteira')) || _contas[0];
            conta_id = defaultAcc.id;
        }

        if (!categoria_id || !conta_id) {
            showToast('Configure categorias e contas primeiro.', 'error');
            return;
        }

        let forma_pagamento = 'dinheiro';
        if (conta_id && typeof _contas !== 'undefined' && Array.isArray(_contas)) {
            const account = _contas.find(c => c.id === conta_id);
            if (account && account.tipo === 'credito') forma_pagamento = 'credito';
        }

        const transactionData = {
            descricao: parsed.descricao,
            valor: valor,
            tipo: tipo,
            categoria_id: categoria_id,
            conta_id: conta_id,
            forma_pagamento: forma_pagamento,
            data: parsed.data || new Date().toISOString().split('T')[0],
            is_split_loan: isSplit,
            split_contact: isSplit ? splitWith : null,
            user_id: userId
        };

        if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
            OfflineSync.addToQueue(transactionData);
            showToast('Salvo offline! 🪄', 'info');
            if (inputElement) inputElement.value = '';
            return;
        }

        const transactionsToInsert = [];

        if (parsed.split) {
            // Caso de Split: Dividir o valor
            const userShare = valor;
            const friendShare = parsed.split.value;

            // 1. Sua parte (Despesa real)
            transactionsToInsert.push({
                ...transactionData,
                descricao: `${parsed.descricao} (Minha parte)`,
                valor: userShare
            });

            // 2. Parte do Amigo (A Receber / Empréstimo)
            transactionsToInsert.push({
                ...transactionData,
                descricao: `${parsed.descricao} (A receber de ${parsed.split.with})`,
                valor: friendShare,
                tipo: 'saida', // Saiu do bolso agora
                categoria_id: (typeof _categories !== 'undefined' && _categories.find(c => c.nome.toLowerCase().includes('geral') || c.nome.toLowerCase().includes('outros'))?.id) || transactionData.categoria_id,
                is_split_loan: true // Flag interna
            });
            
            showMascotMessage(`Entendido! Registrei sua parte (${formatCurrency(userShare)}) e marquei que o(a) ${parsed.split.with} te deve ${formatCurrency(friendShare)}. 🤝`, 'happy');
        } else {
            transactionsToInsert.push(transactionData);
        }

        const { data: insertedData, error } = await supabase.from('transacoes').insert(transactionsToInsert).select('id');

        if (!error) {
            const transactionId = insertedData && insertedData.length > 0 ? insertedData[0].id : null;
            
            showToast('Mágica realizada: ' + parsed.descricao, 'success', {
                label: 'Trocar Categoria',
                callback: () => {
                    if (transactionId) window.showExpressCategoryPicker(transactionId, parsed.categoria_nome);
                }
            });

            if (inputElement) {
                inputElement.value = '';
                const preview = document.getElementById('magic-intelligence-preview');
                if (preview) preview.style.display = 'none';
            }
            await loadTransactions(userId);
            if (typeof initSankeyFlow === 'function') initSankeyFlow();
            if (typeof addXP === 'function') addXP(15);
            
            if (typeof showMascotMessage === 'function' && !text.includes('?')) {
                showMascotMessage(`Anotei ${formatCurrency(valor)} em ${parsed.categoria_nome}. ✨`, 'happy', '', 'happy');
                if (window.VoiceEngine) {
                    window.VoiceEngine.speak(`Anotei ${valor.toFixed(0)} reais em ${parsed.categoria_nome}. Tudo certo!`);
                }
            }
        } else {
            throw error;
        }
    } catch (error) {
        console.error('C.A.S.H. Unit Error:', error);
        showToast('Erro ao processar comando.', 'error');
    }
}

/**
 * Atualiza o preview visual do Magic Input em tempo real
 */
window.updateMagicPreview = function(parsed) {
    const previewContainer = document.getElementById('magic-intelligence-preview');
    if (!previewContainer) return;

    if (parsed && parsed.valor > 0) {
        previewContainer.style.display = 'flex';
        const amountEl = document.getElementById('preview-amount');
        const categoryEl = document.getElementById('preview-category');
        const typeIconEl = document.getElementById('preview-type-icon');

        if (amountEl) amountEl.textContent = formatCurrency(parsed.valor);
        if (typeIconEl) typeIconEl.innerHTML = `<i class="fas ${parsed.tipo === 'saida' ? 'fa-arrow-down val-neg' : 'fa-arrow-up val-pos'}"></i>`;
        
        if (categoryEl) {
            const catConfig = typeof getCategoryConfig === 'function' ? getCategoryConfig(parsed.categoria_nome) : { icon: 'fa-tags', color: '#ccc' };
            categoryEl.innerHTML = `<i class="fas ${catConfig.icon}" style="color:${catConfig.color}; margin-right: 4px;"></i> ${parsed.categoria_nome}`;
        }
    } else {
        previewContainer.style.display = 'none';
    }
};

/**
 * Abre um mini-seletor de categorias para correção expressa
 */
window.showExpressCategoryPicker = async function(transactionId, currentCategoryName) {
    if (typeof _categories === 'undefined') return;

    // Criar o overlay do seletor
    const picker = document.createElement('div');
    picker.className = 'express-category-picker';
    picker.innerHTML = `
        <div class="express-picker-content glass-card">
            <h4>Trocar Categoria</h4>
            <p>Selecione a categoria correta para esta transação:</p>
            <div class="express-categories-grid">
                ${_categories.map(cat => `
                    <button class="express-cat-btn ${cat.nome === currentCategoryName ? 'active' : ''}" data-id="${cat.id}">
                        <span class="cat-icon">${cat.icone || '📁'}</span>
                        <span class="cat-name">${cat.nome}</span>
                    </button>
                `).join('')}
            </div>
            <button class="btn-cancel-express">Cancelar</button>
        </div>
    `;

    document.body.appendChild(picker);
    setTimeout(() => picker.classList.add('active'), 10);

    const cleanup = () => {
        picker.classList.remove('active');
        setTimeout(() => picker.remove(), 300);
    };

    picker.querySelector('.btn-cancel-express').onclick = cleanup;

    const buttons = picker.querySelectorAll('.express-cat-btn');
    buttons.forEach(btn => {
        btn.onclick = async () => {
            const newCatId = btn.dataset.id;
            const newCatName = btn.querySelector('.cat-name').textContent;

            try {
                const { error } = await supabase
                    .from('transacoes')
                    .update({ categoria_id: newCatId })
                    .eq('id', transactionId);

                if (!error) {
                    showToast('Categoria atualizada para ' + newCatName, 'success');
                    // Recarregar dados para refletir no dashboard
                    const user = await supabase.auth.getUser();
                    if (user.data.user) loadTransactions(user.data.user.id);
                } else {
                    throw error;
                }
            } catch (err) {
                console.error('Erro ao atualizar categoria:', err);
                showToast('Erro ao atualizar.', 'error');
            }
            cleanup();
        };
    });
};

function triggerHaptic(duration = 50) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}

/**
 * Inicializa as funcionalidades avançadas do Magic Input (Voz e Preview)
 */
function initMagicFeatures() {
    const magicInput = document.getElementById('magic-input');
    const voiceBtn = document.getElementById('btn-magic-voice');
    const previewContainer = document.getElementById('magic-intelligence-preview');
    const alertContainer = document.getElementById('budget-alerts-container');

    if (!magicInput) return;

    console.log('🚀 C.A.S.H. Unit: Inicializando Recursos Avançados do Magic Input...');

    // --- 1. VOICE INPUT ---
    if (voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            if (!window._cashflowRecognition) {
                window._cashflowRecognition = new SpeechRecognition();
                window._cashflowRecognition.lang = 'pt-BR';
                window._cashflowRecognition.interimResults = true;
            }
            const recognition = window._cashflowRecognition;
            let isListening = false;

            voiceBtn.onclick = () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            };

            recognition.onstart = () => {
                isListening = true;
                voiceBtn.classList.add('listening');
                magicInput.placeholder = "Ouvindo sua mágica...";
            };

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                magicInput.value = transcript;
                magicInput.dispatchEvent(new Event('input')); 
            };

            recognition.onend = () => {
                isListening = false;
                voiceBtn.classList.remove('listening');
                magicInput.placeholder = "Ex: Gastei 50 no almoço hoje...";
            };
        } else {
            voiceBtn.style.display = 'none';
        }
    }

    // --- 2. MAGIC SCAN (OCR) ---
    const scanBtn = document.getElementById('btn-magic-scan');
    const scanInput = document.getElementById('magic-scan-input');
    if (scanBtn && scanInput) {
        scanBtn.onclick = () => scanInput.click();
        scanInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (typeof handleOCR === 'function') {
                await handleOCR(file);
            }
        };
    }

    // --- 3. PREVIEW & PREVENTIVE ALERTS ---
    let magicDebounceTimeout;
    let lastAlertTime = 0;
    magicInput.addEventListener('input', () => {
        const text = magicInput.value.trim();
        
        if (text.length < 3 || text.includes('?')) {
            if (previewContainer) previewContainer.style.display = 'none';
            if (alertContainer) alertContainer.innerHTML = '';
            return;
        }

        clearTimeout(magicDebounceTimeout);
        magicDebounceTimeout = setTimeout(async () => {
            try {
                const result = await SmartNLP.process(text);
                if (result && result.type === 'transaction') {
                    window.updateMagicPreview(result.data);
                    
                    // Alerta Preventivo (Orçamento)
                    if (result.data.tipo === 'saida' && typeof _budgets !== 'undefined') {
                        const budget = _budgets.find(b => {
                            const cat = (window._categories || []).find(c => c.nome === result.data.categoria_nome);
                            return b.categoria_id === (cat ? cat.id : null);
                        });

                        if (budget) {
                            const spent = (window._allTransactions || [])
                                .filter(t => t.categoria_id === budget.categoria_id && t.tipo === 'saida')
                                .reduce((acc, t) => acc + parseFloat(t.valor), 0);
                            
                            const total = spent + result.data.valor;
                            const percent = (total / budget.valor_limite) * 100;

                            if (alertContainer && percent >= 80) {
                                alertContainer.innerHTML = `
                                    <div class="premium-alert warning pulse-border" style="margin-bottom: 1rem; background: rgba(255, 122, 0, 0.1); border: 1px solid var(--color-primary); padding: 0.8rem; border-radius: 12px; display: flex; align-items: center; gap: 0.8rem;">
                                        <i class="fas fa-exclamation-triangle" style="color: var(--color-primary); font-size: 1.2rem;"></i>
                                        <div style="font-size: 0.8rem; color: #fff;">
                                            <strong>Alerta de Orçamento!</strong> Este gasto comprometerá ${percent.toFixed(0)}% do seu limite de ${result.data.categoria_nome}.
                                        </div>
                                    </div>`;
                                
                                if (Date.now() - lastAlertTime > 10000 && typeof showMascotMessage === 'function') {
                                    showMascotMessage(`Opa! Isso vai comprometer seu orçamento de ${result.data.categoria_nome}. 🧐`, 'warning');
                                    lastAlertTime = Date.now();
                                }
                            } else if (alertContainer) {
                                alertContainer.innerHTML = '';
                            }
                        }
                    }
                } else {
                    if (previewContainer) previewContainer.style.display = 'none';
                    if (alertContainer) alertContainer.innerHTML = '';
                }
            } catch (e) {
                console.error('Erro no preview do Magic Input:', e);
            }
        }, 500);
    });

    // --- 4. SUBMIT ---
    const submitBtn = document.getElementById('btn-magic-submit');
    if (submitBtn) {
        submitBtn.onclick = async () => {
            const userId = window.App?.State?.user?.id;
            if (userId) await handleMagicInput(userId);
        };
    }
}

/**
 * Atualiza os chips de sugestão do Magic Input baseados em Tempo e Localização
 */


/**
 * Atualiza os chips de sugestão do Magic Input baseados em Tempo e Localização REAL
 */
function updateMagicSuggestions() {
    const container = document.querySelector('.magic-suggestions');
    if (!container) return;

    const now = new Date();
    const hour = now.getHours();
    
    let suggestions = [];

    // 1. Sugestões Baseadas no Tempo (Default)
    if (hour >= 5 && hour < 11) {
        suggestions = [
            { text: 'Café R$ 12', icon: 'fa-coffee' },
            { text: 'Padaria R$ 25', icon: 'fa-bread-slice' }
        ];
    } else if (hour >= 11 && hour < 15) {
        suggestions = [
            { text: 'Almoço R$ 40', icon: 'fa-utensils' },
            { text: 'Uber R$ 15', icon: 'fa-car' }
        ];
    } else {
        suggestions = [
            { text: 'Jantar R$ 60', icon: 'fa-pizza-slice' },
            { text: 'Mercado R$ 200', icon: 'fa-shopping-cart' }
        ];
    }

    // 2. Tentar Localização Real
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            console.log(`📍 C.A.S.H. Unit: Localização real ativa (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            
            // Simulação de busca de estabelecimentos próximos baseado em coordenadas reais
            // Em produção, isso chamaria uma API de Places (Google/Mapbox)
            const nearby = getNearbyEstablishments(latitude, longitude);
            
            if (nearby && nearby.length > 0) {
                // Adicionar sugestão geo-localizada no início
                const geoSuggestion = { 
                    text: `Gastei no ${nearby[0].name}`, 
                    icon: 'fa-location-dot',
                    isGeo: true 
                };
                
                // Atualizar UI com a nova sugestão de destaque
                renderSuggestions([geoSuggestion, ...suggestions]);
            }
        }, (err) => {
            console.warn('📍 C.A.S.H. Unit: GPS Negado ou indisponível. Usando contexto temporal.');
            renderSuggestions(suggestions);
        }, { timeout: 3000 });
    } else {
        renderSuggestions(suggestions);
    }

    function renderSuggestions(list) {
        container.innerHTML = `
            <span style="font-size: 0.65rem; color: rgba(255,255,255,0.4); width: 100%; margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                Sugestões Sugeridas:
            </span>
            ${list.map(s => `
                <div class="suggestion-chip ${s.isGeo ? 'geo-active' : ''}" data-text="${s.text}">
                    <i class="fas ${s.icon}"></i>
                    <span>${s.text}</span>
                </div>
            `).join('')}
        `;

        // Rebind clicks
        container.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const magicInput = document.getElementById('magic-input');
                const text = chip.getAttribute('data-text');
                if (magicInput && text) {
                    magicInput.value = text;
                    const userId = window.App?.State?.user?.id;
                    handleMagicInput(userId);
                }
            });
        });
    }
}

/**
 * Simula a busca de estabelecimentos próximos
 */
function getNearbyEstablishments(lat, lng) {
    // Mock de lógica espacial: em um app real, faríamos um fetch para API de Places
    const establishments = [
        { name: 'Supermercado Central', type: 'market' },
        { name: 'Posto Ipê', type: 'gas' },
        { name: 'Farmácia Vida', type: 'health' },
        { name: 'Restaurante Sabor', type: 'food' }
    ];
    // Retorna um baseado na "proximidade" (aleatório para o mock)
    return [establishments[Math.floor(Math.random() * establishments.length)]];
}


// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que outras libs (Supabase, etc) inicializaram
    setTimeout(() => {
        updateMagicSuggestions();
        // Atualizar a cada 10 minutos para mudar sugestões de horário
        setInterval(updateMagicSuggestions, 600000);
        
        // Inicializar Sankey se possível
        if (typeof initSankeyFlow === 'function') initSankeyFlow();
    }, 500);
});

