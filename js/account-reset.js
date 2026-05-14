/* js/account-reset.js - Factory Reset & Black Box Logic */

const AccountReset = {
    async exportData(userId) {
        showToast('Iniciando extração da Caixa Preta...', 'info');
        
        const tables = [
            'transacoes', 'contas', 'metas', 'orcamentos', 
            'recorrencias', 'categorias', 'subcategorias', 
            'ativos', 'historico_acesso'
        ];
        
        const backupData = {
            metadata: {
                exported_at: new Date().toISOString(),
                app_version: window.CONFIG?.APP_VERSION || '1.2.0',
                user_id: userId
            },
            database: {},
            localStorage: {}
        };

        // 1. Fetch Supabase Data
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
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

        // 2. Fetch LocalStorage Data
        const lsKeys = Object.keys(localStorage);
        lsKeys.forEach(key => {
            if (key.includes('xp_') || key.includes('badges_') || key.includes('import_') || key.includes('predict_')) {
                backupData.localStorage[key] = localStorage.getItem(key);
            }
        });

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
        return true;
    },

    async performFullWipe(userId) {
        showToast('Iniciando limpeza total do núcleo...', 'warning');
        
        const tables = [
            'transacoes', 'contas', 'metas', 'orcamentos', 
            'recorrencias', 'categorias', 'subcategorias', 
            'ativos', 'historico_acesso'
        ];

        // 1. Wipe Supabase
        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).delete().eq('user_id', userId);
                if (error) console.error(`Erro ao limpar tabela ${table}:`, error);
            } catch (e) {
                console.error(`Falha ao limpar ${table}:`, e);
            }
        }

        // 2. Clear IndexedDB
        if (typeof OfflineDB !== 'undefined' && OfflineDB.db) {
            try {
                const tx = OfflineDB.db.transaction('pending_transactions', 'readwrite');
                tx.objectStore('pending_transactions').clear();
                await tx.done;
            } catch (e) { console.warn('Erro ao limpar IndexedDB:', e); }
        }

        // 3. Clear LocalStorage
        const lsKeys = Object.keys(localStorage);
        lsKeys.forEach(key => {
            if (key.includes('xp_') || key.includes('badges_') || key.includes('import_') || key.includes('predict_')) {
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

    if (!btnOpen || !modal) return;

    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        goToResetStep(1);
    });

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
            // Tenta logar novamente para validar a senha
            const { error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (!error) {
                goToResetStep(3);
            } else {
                showToast('Falha na autenticação. Senha incorreta.', 'error');
            }
        } catch (e) {
            showToast('Erro ao verificar identidade.', 'error');
        } finally {
            btnVerifyAuth.disabled = false;
            btnVerifyAuth.innerHTML = 'Verificar Acesso';
        }
    });

    btnFinalReset.addEventListener('click', async () => {
        const word = document.getElementById('reset-final-word').value.toUpperCase();
        if (word !== 'DELETAR') {
            showToast('Digite DELETAR para confirmar.', 'alert');
            return;
        }

        btnFinalReset.disabled = true;
        btnFinalReset.innerHTML = '<i class="fas fa-radiation fa-spin"></i> RESETANDO...';
        
        await AccountReset.performFullWipe(userId);
    });
}

function goToResetStep(step) {
    document.querySelectorAll('.reset-step').forEach(el => el.style.display = 'none');
    const target = document.getElementById(`reset-step-${step}`);
    if (target) {
        target.style.display = 'block';
        // Animation if GSAP is available
        if (window.gsap) {
            gsap.from(target, { opacity: 0, y: 10, duration: 0.4 });
        }
    }
}

// Export to global scope
window.AccountReset = AccountReset;
window.initResetUI = initResetUI;
window.goToResetStep = goToResetStep;
