/* js/offline-sync.js - Advanced Offline Sync Engine (Phase 4) */

const SYNC_QUEUE_KEY = 'cashflow_sync_queue';

const OfflineSync = {
    isSyncing: false,

    /**
     * Adiciona uma transação à fila e atualiza a UI otimisticamente
     */
    addToQueue: function(transactionData) {
        try {
            const queue = this.getQueue();
            const itemId = 'offline_' + Date.now() + Math.random().toString(36).substr(2, 5);
            
            const item = {
                id: itemId,
                data: transactionData,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            queue.push(item);
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
            
            console.log('C.A.S.H. Unit: Lançamento em fila offline.', item);
            
            // Feedback Visual Imediato (Haptic + Toast)
            if (typeof triggerHaptic === 'function') triggerHaptic([40, 20, 40]);
            
            if (typeof showToast === 'function') {
                showToast('Modo Offline: Lançamento salvo localmente e será sincronizado em breve.', 'info');
            }

            // Atualizar UI Otimisticamente se as globais estiverem disponíveis
            this.applyOptimisticUpdate(item);
            
            return itemId;
        } catch (error) {
            console.error('Erro no cache offline:', error);
            return null;
        }
    },

    /**
     * Aplica os dados na memória global para que o usuário veja o lançamento NA HORA
     */
    applyOptimisticUpdate: function(offlineItem) {
        if (typeof _allTransactions !== 'undefined') {
            // Criar objeto compatível com a UI
            const optimisticTx = {
                ...offlineItem.data,
                id: offlineItem.id,
                is_pending: true, // Flag para estilização
                created_at: offlineItem.timestamp
            };
            
            _allTransactions.unshift(optimisticTx);
            
            if (typeof filterAndRenderData === 'function') {
                filterAndRenderData();
            }
            if (typeof updateSummary === 'function') {
                updateSummary();
            }
        }
    },

    getQueue: function() {
        const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    },

    removeFromQueue: function(itemId) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== itemId);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    },

    /**
     * Sincronização em Massa com Supabase (Phase 4)
     */
    sync: async function(userId) {
        if (this.isSyncing) return;
        const queue = this.getQueue();
        if (queue.length === 0) {
            this.updateSyncStatus('online');
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus('syncing');
        
        console.log(`C.A.S.H. Unit: Sincronizando ${queue.length} itens...`);

        let successCount = 0;

        for (const item of queue) {
            try {
                // Preparar dados (remover IDs temporários e flags de UI)
                const { id, is_pending, ...cleanData } = item.data;
                const dataToInsert = { ...cleanData, user_id: userId };

                const { error } = await supabase.from('transacoes').insert([dataToInsert]);
                
                if (!error) {
                    this.removeFromQueue(item.id);
                    successCount++;
                } else {
                    console.error('Erro ao sincronizar item:', error);
                }
            } catch (err) {
                console.error('Falha crítica na sync:', err);
            }
        }

        this.isSyncing = false;
        
        if (successCount > 0) {
            if (typeof showToast === 'function') {
                showToast(`${successCount} itens sincronizados com a nuvem! ☁️`, 'success');
            }
            if (typeof triggerHaptic === 'function') triggerHaptic(100);
            
            // Recarregar dados oficiais
            if (typeof loadTransactions === 'function') await loadTransactions(userId);
        }
        
        this.updateSyncStatus(this.isOnline() ? 'online' : 'offline');
    },

    /**
     * Gerencia o indicador visual de sync na UI
     */
    updateSyncStatus: function(state) {
        const statusEl = document.getElementById('sync-status-indicator');
        if (!statusEl) {
            this.injectStatusIndicator();
            return this.updateSyncStatus(state);
        }

        statusEl.className = 'sync-status ' + state;
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('.status-text');

        switch(state) {
            case 'syncing':
                icon.className = 'fas fa-sync-alt fa-spin';
                text.textContent = 'Sincronizando...';
                break;
            case 'offline':
                icon.className = 'fas fa-cloud-slash';
                text.textContent = 'Modo Offline';
                break;
            case 'online':
                icon.className = 'fas fa-check-circle';
                text.textContent = 'Nuvem Ativa';
                // Esconder após 3 segundos se estiver online
                setTimeout(() => {
                    if (this.isOnline() && !this.isSyncing && this.getQueue().length === 0) {
                        statusEl.classList.add('hide');
                    }
                }, 3000);
                break;
        }
        
        if (state !== 'online' || this.getQueue().length > 0) {
            statusEl.classList.remove('hide');
        }
    },

    injectStatusIndicator: function() {
        const html = `
            <div id="sync-status-indicator" class="sync-status hide">
                <i class="fas fa-check-circle"></i>
                <span class="status-text">Conectado</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Estilo básico injetado se não houver no CSS
        const style = document.createElement('style');
        style.textContent = `
            .sync-status {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 8px 16px;
                background: rgba(15, 15, 20, 0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                color: white;
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 9999;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .sync-status.hide { opacity: 0; transform: translateY(20px); pointer-events: none; }
            .sync-status.offline { border-color: var(--color-danger); color: var(--color-danger); }
            .sync-status.syncing { border-color: var(--color-primary); color: var(--color-primary); }
            .sync-status.online { border-color: var(--color-success); color: var(--color-success); }
            
            /* Estilo para itens pendentes no histórico */
            .transaction-item.is-pending {
                opacity: 0.7;
                border-left: 3px solid var(--color-primary) !important;
                position: relative;
            }
            .transaction-item.is-pending::after {
                content: '\\f017';
                font-family: 'Font Awesome 6 Free';
                font-weight: 900;
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 0.7rem;
                color: var(--color-primary);
            }
        `;
        document.head.appendChild(style);
    },

    isOnline: function() {
        return navigator.onLine;
    }
};

// Listeners de Conexão
window.addEventListener('online', async () => {
    OfflineSync.updateSyncStatus('online');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await OfflineSync.sync(user.id);
    }
});

window.addEventListener('offline', () => {
    OfflineSync.updateSyncStatus('offline');
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    OfflineSync.updateSyncStatus(OfflineSync.isOnline() ? 'online' : 'offline');
});

window.OfflineSync = OfflineSync;
