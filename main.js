/* main.js - Orchestrator & Global State */

// Global State
let _allTransactions = [];
let _categories = [];
let _subcategories = [];
let _contas = [];
let _budgets = [];
let _metas = [];
let _recorrencias = [];
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

    // Sidebar avatar
    const sidebarAvatar = document.getElementById('avatar-header');
    const sidebarInitials = document.getElementById('avatar-initials');
    if (sidebarAvatar) {
        if (avatarUrl) {
            sidebarAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            sidebarAvatar.innerHTML = `<span id="avatar-initials" style="font-size:0.875rem;">${initials}</span>`;
        }
    }

    // Modal preview
    const previewEl = document.getElementById('profile-avatar-preview');
    const previewInitials = document.getElementById('profile-avatar-initials');
    if (previewEl) {
        if (avatarUrl) {
            previewEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else if (previewInitials) {
            previewInitials.textContent = initials;
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
        try { setupEventListeners(user.id); } catch (e) { console.error('Erro EventListeners:', e); }

        // 2. Inicializar Mascote (Visual)
        await loadMascotSVG();
        initMascotInteractions();
        initMascotGSAP();
        
        // 3. Carregar Dados (Em segundo plano, sem travar a UI)
        showSkeletons(true);
        
        try {
            await Promise.all([
                initializeCategories(user.id).catch(e => console.error('Erro Cat:', e)),
                loadContas(user.id).catch(e => console.error('Erro Contas:', e))
            ]);

            // Transações e Render Imediato
            await loadTransactions(user.id).catch(e => console.error('Erro Trans:', e));
            if (typeof filterAndRenderData === 'function') filterAndRenderData();

            // --- CONFIGURAÇÃO DE UI ---
            initTheme();
            initPrivacyMode();
            if (typeof setupNavigation === 'function') setupNavigation(); 
            
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
            console.warn('Alguns dados não puderam ser carregados, mas o app continua funcional.', dataError);
        } finally {
            // --- REMOVER LOADER SEMPRE ---
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.remove();
                    console.log('C.A.S.H. Unit: Interface Liberada.');
                }, 500);
            }
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
        if (typeof setupParserEvents === 'function') setupParserEvents(user.id);
        if (typeof initImportEvents === 'function') initImportEvents(user.id);

        // 4.1 Histórico de Segurança - Registrar acesso e renderizar log
        logSecurityAccess(user.id);
        renderSessions(user.id);

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
                    if (view === 'security') renderSessions(userId);
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
            if (confirm('Deseja realmente encerrar todas as outras sessões?')) {
                try {
                    await SecurityVault.logoutAllOtherSessions(supabase);
                    showToast('Outras sessões encerradas.', 'success');
                    renderSessions(userId);
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
    }

    renderSessions(userId);
    setupPrivacyAndSecurity(userId);
    // initOnboarding(userId);

    // --- REGISTRO SERVICE WORKER (PWA) ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('C.A.S.H. Unit: Service Worker Ativo (Offline Mode Ready)', reg))
                .catch(err => console.log('C.A.S.H. Unit: Erro ao carregar Service Worker', err));
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
    if (!modal) return;

    modal.classList.remove('hidden');
    _currentPinInput = '';
    updatePinDots();

    const pinSet = localStorage.getItem(`user_pin_${userId}`);
    if (!pinSet) {
        document.getElementById('pin-title').textContent = 'Defina seu PIN';
        document.getElementById('pin-msg').textContent = 'Crie um código de 4 dígitos para segurança';
    } else {
        document.getElementById('pin-title').textContent = 'Segurança CashFlow';
        document.getElementById('pin-msg').textContent = 'Insira seu PIN de 4 dígitos';
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
    
    if (value === 'DEL') {
        _currentPinInput = _currentPinInput.slice(0, -1);
    } else if (_currentPinInput.length < 4) {
        _currentPinInput += value;
    }

    updatePinDots();

    if (_currentPinInput.length === 4) {
        validatePin();
    }
};

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        if (i < _currentPinInput.length) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

async function validatePin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const storedPin = localStorage.getItem(`user_pin_${user.id}`);
    
    if (!storedPin) {
        // Primeiro uso: definir PIN
        localStorage.setItem(`user_pin_${user.id}`, _currentPinInput);
        showToast('PIN definido com sucesso!', 'success');
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
        updatePinDots();
        
        if (_failedPinAttempts >= 3) {
            _lockoutUntil = Date.now() + (30 * 1000); // 30 segundos de bloqueio
            showToast('Muitas tentativas. Bloqueado por 30s.', 'error');
        } else {
            showToast(`PIN incorreto. Tentativas: ${_failedPinAttempts}/3`, 'error');
        }
        
        // Feedback visual de erro
        const container = document.querySelector('.pin-container');
        if (container) {
            container.style.animation = 'shake 0.4s ease-in-out';
            setTimeout(() => container.style.animation = '', 400);
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

async function renderSessions(userId) {
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

async function handleMagicInput(userId) {
    const input = document.getElementById('magic-input');
    const text = input.value.trim().toLowerCase();
    if (!text) return;

    // Feedback visual/háptico
    triggerHaptic();
    showToast('Processando comando mágico...', 'info');

    // NLP Básico (Regex/Keywords)
    const amountMatch = text.match(/(\d+([.,]\d{1,2})?)/);
    if (!amountMatch) {
        showToast('Não entendi o valor. Tente algo como "Gastei 50 no café"', 'warning');
        return;
    }

    const valor = parseFloat(amountMatch[0].replace(',', '.'));
    let tipo = 'saida';
    if (text.includes('ganhei') || text.includes('recebi') || text.includes('vendi')) {
        tipo = 'entrada';
    }

    // Inferência de categoria
    let categoria_id = null;
    const catMappings = {
        'alimentação': ['comi', 'almoço', 'jantar', 'café', 'restaurante', 'ifood', 'lanche'],
        'transporte': ['uber', 'gasolina', 'combustível', 'ônibus', 'metrô'],
        'lazer': ['cinema', 'show', 'festa', 'viagem'],
        'saúde': ['farmácia', 'médico', 'remédio']
    };

    // Tentar encontrar categoria id real baseada no nome
    for (const [catName, keywords] of Object.entries(catMappings)) {
        if (keywords.some(k => text.includes(k))) {
            const cat = _categories.find(c => c.nome.toLowerCase().includes(catName));
            if (cat) categoria_id = cat.id;
            break;
        }
    }

    // Se não encontrou, usa a primeira categoria do tipo
    if (!categoria_id) {
        const fallbackCat = _categories.find(c => c.tipo === tipo);
        categoria_id = fallbackCat ? fallbackCat.id : null;
    }

    // Tentar encontrar conta mencionada
    let conta_id = _contas.length > 0 ? _contas[0].id : null;
    let forma_pagamento = 'dinheiro';

    const accountMentioned = _contas.find(c => text.includes(c.nome.toLowerCase()));
    if (accountMentioned) {
        conta_id = accountMentioned.id;
        if (accountMentioned.tipo === 'credito') {
            forma_pagamento = 'credito';
        }
    } else {
        // Se não mencionou conta, mas mencionou "crédito" ou "cartão"
        if (text.includes('crédito') || text.includes('cartão')) {
            const firstCard = _contas.find(c => c.tipo === 'credito');
            if (firstCard) {
                conta_id = firstCard.id;
                forma_pagamento = 'credito';
            }
        }
    }

    if (!categoria_id || !conta_id) {
        showToast('Configure categorias e contas antes de usar o Magic Input.', 'error');
        return;
    }

    const { error } = await supabase.from('transacoes').insert([{
        user_id: userId,
        descricao: text.charAt(0).toUpperCase() + text.slice(1),
        valor: valor,
        tipo: tipo,
        categoria_id: categoria_id,
        conta_id: conta_id,
        forma_pagamento: forma_pagamento,
        data: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
        showToast('Lançado com sucesso!', 'success');
        input.value = '';
        await loadTransactions(userId);
        if (typeof filterAndRenderData === 'function') filterAndRenderData();
    } else {
        showToast('Erro ao processar Magic Input.', 'error');
    }
}

function triggerHaptic(duration = 50) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}
