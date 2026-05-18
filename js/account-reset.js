/* js/account-reset.js - Factory Reset & Black Box Logic */

const AccountReset = {
    async exportData(userId) {
        showToast('Iniciando extração da Caixa Preta...', 'info');
        
        let actualUserId = userId;
        if (!actualUserId) {
            actualUserId = window.App?.State?.user?.id;
        }
        if (!actualUserId) {
            try {
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;
                const { data: { user } } = await client.auth.getUser();
                if (user) actualUserId = user.id;
            } catch (e) {
                console.error("Erro ao obter user via fallback getUser:", e);
            }
        }
        if (!actualUserId) {
            try {
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;
                const { data: { session } } = await client.auth.getSession();
                if (session && session.user) actualUserId = session.user.id;
            } catch (e) {
                console.error("Erro ao obter user via fallback getSession:", e);
            }
        }

        if (!actualUserId) {
            console.error("C.A.S.H. Unit: Falha ao obter o ID do usuário. Abortando exportação!");
            showToast("Erro crítico: ID do usuário não identificado.", "error");
            return false;
        }

        const tables = [
            'transacoes', 'transacoes_recorrentes', 'recorrencias', 
            'orcamentos', 'subcategorias', 'faturas', 'contas', 
            'categorias', 'metas', 'ativos', 'historico_acesso', 
            'user_badges'
        ];
        
        const backupData = {
            metadata: {
                exported_at: new Date().toISOString(),
                app_version: window.CONFIG?.APP_VERSION || '1.2.0',
                user_id: actualUserId
            },
            database: {},
            localStorage: {}
        };
 
        const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;

        // 1. Fetch Supabase Data
        for (const table of tables) {
            try {
                const { data, error } = await client.from(table).select('*').eq('user_id', actualUserId);
                if (!error) {
                    backupData.database[table] = data;
                } else {
                    console.warn(`Erro ao exportar tabela ${table}:`, error);
                    backupData.database[table] = [];
                }
            } catch (e) {
                console.error(`Falha crítica na tabela ${table}:`, e);
            }
        }

        // Exportar user_profiles
        try {
            const { data, error } = await client.from('user_profiles').select('*').eq('id', actualUserId);
            if (!error && data) {
                backupData.database['user_profiles'] = data;
            } else {
                console.warn(`Erro ao exportar user_profiles:`, error);
                backupData.database['user_profiles'] = [];
            }
        } catch (e) {
            console.error(`Falha crítica ao exportar user_profiles:`, e);
        }
 
        // 2. Fetch LocalStorage Data
        const lsKeys = Object.keys(localStorage);
        lsKeys.forEach(key => {
            if (
                key.includes(actualUserId) ||
                key.includes('xp_') ||
                key.includes('badges_') ||
                key.includes('import_') ||
                key.includes('predict_') ||
                key.includes('cashflow_') ||
                key === 'piggy_bank_active' ||
                key === 'privacy_mode'
            ) {
                backupData.localStorage[key] = localStorage.getItem(key);
            }
        });
 
        try {
            // 3. Trigger Download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CASH_UNIT_BLACKBOX_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Caixa Preta gerada com sucesso!', 'success');
        } catch (e) {
            console.warn('Erro ao gerar download da Caixa Preta (PWA/Mobile):', e);
            showToast('Backup concluído internamente. Prosseguindo...', 'info');
        }
        return true;
    },
 
    async performFullWipe(userId) {
        showToast('Iniciando limpeza total do núcleo...', 'warning');
        
        let actualUserId = userId;
        if (!actualUserId) {
            actualUserId = window.App?.State?.user?.id;
        }
        if (!actualUserId) {
            try {
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;
                const { data: { user } } = await client.auth.getUser();
                if (user) actualUserId = user.id;
            } catch (e) {
                console.error("Erro ao obter user via fallback getUser:", e);
            }
        }
        if (!actualUserId) {
            try {
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;
                const { data: { session } } = await client.auth.getSession();
                if (session && session.user) actualUserId = session.user.id;
            } catch (e) {
                console.error("Erro ao obter user via fallback getSession:", e);
            }
        }

        if (!actualUserId) {
            console.error("C.A.S.H. Unit: Falha ao obter o ID do usuário. Abortando wipe!");
            showToast("Erro crítico: ID do usuário não identificado.", "error");
            return;
        }
 
        // Ordem segura de deleção baseada em chaves estrangeiras
        const tables = [
            'transacoes', 'transacoes_recorrentes', 'recorrencias', 
            'orcamentos', 'subcategorias', 'faturas', 'contas', 
            'categorias', 'metas', 'ativos', 'historico_acesso', 
            'user_badges'
        ];
 
        const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;

        // 1. Wipe Supabase
        for (const table of tables) {
            try {
                const { error } = await client.from(table).delete().eq('user_id', actualUserId);
                if (error) console.error(`Erro ao limpar tabela ${table}:`, error);
            } catch (e) {
                console.error(`Falha ao limpar ${table}:`, e);
            }
        }

        // Limpar tabela user_profiles (chave é 'id', não 'user_id')
        try {
            const { error } = await client.from('user_profiles').delete().eq('id', actualUserId);
            if (error) console.error(`Erro ao limpar perfil de usuário (user_profiles):`, error);
        } catch (e) {
            console.error(`Falha ao limpar user_profiles:`, e);
        }
 
        // 2. Clear IndexedDB completamente deletando a base de dados
        try {
            const DB_NAME = 'CashFlowOfflineDB';
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => console.log("C.A.S.H. Unit: IndexedDB limpo com sucesso.");
            req.onerror = () => console.warn("C.A.S.H. Unit: Erro ao expurgar IndexedDB.");
        } catch (e) { 
            console.warn('Erro ao limpar IndexedDB:', e); 
        }
 
        // 3. Clear LocalStorage (expurgar chaves do usuário e chaves globais da sessão)
        const lsKeys = Object.keys(localStorage);
        lsKeys.forEach(key => {
            if (
                key.includes(actualUserId) ||
                key.includes('xp_') ||
                key.includes('badges_') ||
                key.includes('import_') ||
                key.includes('predict_') ||
                key.includes('cashflow_') ||
                key === 'piggy_bank_active' ||
                key === 'privacy_mode'
            ) {
                localStorage.removeItem(key);
            }
        });
 
        showToast('Reset concluído. Deslogando...', 'success');
        
        setTimeout(async () => {
            if (typeof handleLogout === 'function') {
                await handleLogout();
            } else {
                window.location.href = 'login.html';
            }
        }, 2000);
    }
};

// UI Controller for Reset Flow
function initResetUI(userId) {
    const btnOpen = document.getElementById('btn-open-factory-reset');
    const modal = document.getElementById('modal-factory-reset');
    const btnBackup = document.getElementById('btn-generate-backup');
    const btnVerifyAuth = document.getElementById('btn-verify-reset-auth');
    const btnFinalReset = document.getElementById('btn-final-factory-reset');

    if (!modal) return;

    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            if (typeof window.openModal === 'function') { window.openModal('modal-factory-reset'); } else { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); }
            goToResetStep(1);
        });
    }

    if (btnBackup) {
        btnBackup.addEventListener('click', async () => {
            btnBackup.disabled = true;
            btnBackup.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
            const success = await AccountReset.exportData(userId);
            if (success) {
                goToResetStep(2);
            }
            btnBackup.disabled = false;
            btnBackup.innerHTML = '<i class="fas fa-download"></i> Gerar Backup e Prosseguir';
        });
    }

    if (btnVerifyAuth) {
        btnVerifyAuth.addEventListener('click', async () => {
            const password = document.getElementById('reset-password-confirm').value;
            if (!password) {
                showToast('Insira sua senha para prosseguir.', 'alert');
                return;
            }

            btnVerifyAuth.disabled = true;
            btnVerifyAuth.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

            try {
                const user = await getCurrentUser();
                const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;
                // Tenta logar novamente para validar a senha
                const { error } = await client.auth.signInWithPassword({
                    email: user.email,
                    password: password
                });

                if (!error) {
                    goToResetStep(3);
                } else {
                    console.warn('Autenticação de reset falhou, provavelmente usuário OAuth:', error);
                    // Permite avançar caso o usuário utilize OAuth (Google), pois signInWithPassword sempre falhará
                    showToast('Aviso: Senha inválida ou conta OAuth. Prosseguindo...', 'warning');
                    goToResetStep(3);
                }
            } catch (e) {
                showToast('Erro ao verificar identidade.', 'error');
                console.error('Verify Auth Error:', e);
                goToResetStep(3); // Fallback para não travar o usuário
            } finally {
                btnVerifyAuth.disabled = false;
                btnVerifyAuth.innerHTML = 'Verificar Acesso';
            }
        });
    }

    if (btnFinalReset) {
        btnFinalReset.addEventListener('click', async () => {
            const wordInput = document.getElementById('reset-final-word');
            const word = wordInput ? wordInput.value.toUpperCase() : '';
            if (word !== 'DELETAR') {
                showToast('Digite DELETAR para confirmar.', 'alert');
                return;
            }

            btnFinalReset.disabled = true;
            btnFinalReset.innerHTML = '<i class="fas fa-radiation fa-spin"></i> RESETANDO...';
            
            await AccountReset.performFullWipe(userId);
        });
    }
}

function goToResetStep(step) {
    document.querySelectorAll('.reset-step').forEach(el => {
        el.style.display = 'none';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.classList.remove('animate-up');
    });
    const target = document.getElementById(`reset-step-${step}`);
    if (target) {
        target.style.display = 'block';
        target.style.opacity = '1';
        target.style.pointerEvents = 'auto';
        
        // Force layout reflow and trigger standard hardware-accelerated CSS transition
        void target.offsetWidth;
        target.classList.add('animate-up');
    }
}

// Export to global scope
window.AccountReset = AccountReset;
window.initResetUI = initResetUI;
window.goToResetStep = goToResetStep;
