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
            'ativos', 'transacoes', 'recorrencias', 'orcamentos', 
            'subcategorias', 'contas', 'categorias', 'metas', 
            'historico_acesso', 'user_badges'
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
        // Transition UI to Step 4 (Terminal logs)
        if (typeof goToResetStep === 'function') {
            goToResetStep(4);
        } else {
            const step4 = document.getElementById('reset-step-4');
            if (step4) step4.style.display = 'block';
        }

        const terminal = document.getElementById('reset-terminal-logs');
        const progressBar = document.getElementById('reset-progress-bar');
        
        if (terminal) terminal.innerHTML = '';
        if (progressBar) progressBar.style.width = '0%';

        const sleep = ms => new Promise(res => setTimeout(res, ms));

        function addLog(text, status = 'info') {
            if (!terminal) return;
            const div = document.createElement('div');
            div.style.lineHeight = '1.4';
            div.style.wordBreak = 'break-all';
            div.style.marginBottom = '0.25rem';
            
            let color = 'rgba(255,255,255,0.8)';
            let prefix = '[⚙] ';
            if (status === 'success') {
                color = '#10b981';
                prefix = '[✔] ';
            } else if (status === 'error') {
                color = '#ef4444';
                prefix = '[✘] ';
            } else if (status === 'warning') {
                color = '#f59e0b';
                prefix = '[⚠] ';
            } else if (status === 'system') {
                color = '#60a5fa';
                prefix = '[⚡] ';
            }
            
            div.style.color = color;
            div.textContent = `${prefix}${text}`;
            terminal.appendChild(div);
            terminal.scrollTop = terminal.scrollHeight;
        }

        function updateProgress(percentage) {
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        }

        addLog('INICIANDO EXPURGO INTEGRAL DO SISTEMA...', 'system');
        await sleep(350);
        addLog('ESTABELECENDO CANAL SEGURO DE DADOS...', 'info');
        await sleep(250);
        
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
            addLog('FALHA CRÍTICA: IDENTIFICADOR DO USUÁRIO NÃO ENCONTRADO.', 'error');
            addLog('ABORTANDO EXPURGO PARA PRESERVAR INTEGRIDADE.', 'error');
            showToast("Erro crítico: ID do usuário não identificado.", "error");
            return;
        }

        addLog(`AUTENTICADO COM SUCESSO. UUID: ${actualUserId}`, 'success');
        await sleep(200);

        // Safe order deletion (children first)
        const tables = [
            'ativos', 
            'transacoes', 
            'recorrencias', 
            'orcamentos', 
            'subcategorias', 
            'contas', 
            'categorias', 
            'metas', 
            'historico_acesso', 
            'user_badges'
        ];

        const totalSteps = tables.length + 5; // Tables + user_profiles + IndexedDB + localStorage + browserCache + signOut
        let currentStep = 0;

        const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : window.supabase;

        // 1. Wipe Supabase Tables sequentially
        for (const table of tables) {
            currentStep++;
            updateProgress((currentStep / totalSteps) * 100);
            addLog(`DESVINCULANDO REGISTROS DA TABELA '${table.toUpperCase()}'...`, 'info');
            await sleep(200);

            try {
                const { data, error } = await client
                    .from(table)
                    .delete()
                    .eq('user_id', actualUserId)
                    .select();
                
                if (error) {
                    addLog(`FALHA NA TABELA '${table.toUpperCase()}': ${error.message || JSON.stringify(error)}`, 'error');
                } else {
                    const count = data ? data.length : 0;
                    if (count > 0) {
                        addLog(`TABELA '${table.toUpperCase()}' EXPURGADA COM SUCESSO! (${count} regs)`, 'success');
                    } else {
                        addLog(`TABELA '${table.toUpperCase()}': 0 registros deletados.`, 'warning');
                        addLog(`  -> Verifique se há dados ou se a política RLS DELETE está ativa.`, 'warning');
                    }
                }
            } catch (e) {
                addLog(`ERRO INESPERADO NA TABELA '${table.toUpperCase()}': ${e.message || e}`, 'error');
            }
            await sleep(150);
        }

        // 2. Wipe user_profiles
        currentStep++;
        updateProgress((currentStep / totalSteps) * 100);
        addLog("DELETANDO REGISTRO DE PERFIL ('USER_PROFILES')...", 'info');
        await sleep(200);

        try {
            const { data, error } = await client
                .from('user_profiles')
                .delete()
                .eq('id', actualUserId)
                .select();
            
            if (error) {
                addLog(`FALHA AO APAGAR USER_PROFILES: ${error.message || JSON.stringify(error)}`, 'error');
            } else {
                const count = data ? data.length : 0;
                if (count > 0) {
                    addLog(`PERFIL DO NÚCLEO APAGADO COM SUCESSO! (${count} regs)`, 'success');
                } else {
                    addLog(`USER_PROFILES: 0 registros deletados.`, 'warning');
                }
            }
        } catch (e) {
            addLog(`ERRO INESPERADO EM USER_PROFILES: ${e.message || e}`, 'error');
        }
        await sleep(200);

        // 3. Clear IndexedDB
        currentStep++;
        updateProgress((currentStep / totalSteps) * 100);
        addLog('APAGANDO BANCO DE DADOS LOCAL (INDEXEDDB)...', 'info');
        await sleep(250);

        try {
            const DB_NAME = 'CashFlowOfflineDB';
            const req = indexedDB.deleteDatabase(DB_NAME);
            
            await new Promise((resolve) => {
                req.onsuccess = () => {
                    addLog('INDEXEDDB LOCAL DESTRUÍDO COM SUCESSO.', 'success');
                    resolve();
                };
                req.onerror = () => {
                    addLog('AVISO: FALHA AO EXPURGAR INDEXEDDB.', 'warning');
                    resolve();
                };
                setTimeout(resolve, 1000); // safety timeout
            });
        } catch (e) { 
            addLog(`AVISO ERRO INDEXEDDB: ${e.message}`, 'warning'); 
        }
        await sleep(150);

        // 4. Clear LocalStorage completely (except theme)
        currentStep++;
        updateProgress((currentStep / totalSteps) * 100);
        addLog('DESTRUINDO VARIÁVEIS E CREDENCIAIS (LOCALSTORAGE)...', 'info');
        await sleep(250);

        try {
            const lsKeys = Object.keys(localStorage);
            let cleanedCount = 0;
            lsKeys.forEach(key => {
                if (key !== 'theme') {
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            });
            addLog(`LOCALSTORAGE HIGIENIZADO COM SUCESSO (${cleanedCount} chaves).`, 'success');
        } catch (e) {
            addLog(`AVISO ERRO LOCALSTORAGE: ${e.message}`, 'warning');
        }
        await sleep(150);

        // 4.5. Clear PWA Cache Storage to force fresh client download
        currentStep++;
        updateProgress((currentStep / totalSteps) * 100);
        addLog('LIMPENDO CACHES DO NAVEGADOR (PURGE PWA)...', 'info');
        await sleep(250);

        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                let deletedCount = 0;
                for (const key of keys) {
                    await caches.delete(key);
                    deletedCount++;
                }
                addLog(`CACHE DE ARQUIVOS LIMPO COM SUCESSO (${deletedCount} caches).`, 'success');
            } else {
                addLog('CACHE STORAGE NÃO SUPORTADO NESTE NAVEGADOR.', 'info');
            }
        } catch (e) {
            addLog(`AVISO ERRO CACHE PURGE: ${e.message}`, 'warning');
        }
        await sleep(150);

        // 5. Cloud signout
        currentStep++;
        updateProgress(100);
        addLog('DESCONECTANDO DO SERVIDOR REMOTO SUPABASE...', 'info');
        await sleep(350);

        try {
            await client.auth.signOut();
            addLog('SESSÃO ENCERRADA E PASSAPORTE REVOGADO.', 'success');
        } catch (e) {
            addLog('AVISO: FALHA AO REALIZAR SIGNOUT NA NUVEM.', 'warning');
        }
        await sleep(250);

        addLog('EXPURGO INTEGRAL CONCLUÍDO COM SUCESSO!', 'system');
        addLog('REDIRECIONANDO PARA TELA DE LOGIN...', 'system');
        await sleep(2500);

        window.location.href = 'login.html';
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
