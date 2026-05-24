/* js/offline-sync.js - Advanced Offline Sync Engine (Phase 4) */

const SYNC_QUEUE_KEY = 'cashflow_sync_queue';

const OfflineSync = {
    isSyncing: false,

    /**
     * Adiciona uma transação à fila e atualiza a UI otimisticamente
     */
    addToQueue: function (transactionData) {
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
            if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic([40, 20, 40]);

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
    applyOptimisticUpdate: function (offlineItem) {
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

    getQueue: function () {
        const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    },

    removeFromQueue: function (itemId) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== itemId);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
        return filtered.length < queue.length;
    },

    removeFromQueueByTxId: function (txId) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== txId);
        if (filtered.length < queue.length) {
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
            return true;
        }
        return false;
    },

    /**
     * Sincronização em Massa com Supabase (Phase 4)
     */
    sync: async function (userId) {
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
            if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(100);

            // Recarregar dados oficiais
            if (typeof loadTransactions === 'function') await loadTransactions(userId);
        }

        this.updateSyncStatus(this.isOnline() ? 'online' : 'offline');
    },

    /**
     * Gerencia o indicador visual de sync na UI (Phase 4 Premium)
     */
    updateSyncStatus: function (state) {
        const statusEl = document.getElementById('sync-status-indicator');
        if (!statusEl) {
            this.injectStatusIndicator();
            return this.updateSyncStatus(state);
        }

        statusEl.className = 'sync-status ' + state;
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('.status-text');

        switch (state) {
            case 'syncing':
                icon.className = 'fas fa-sync-alt fa-spin';
                text.textContent = 'Sincronizando...';
                break;
            case 'offline':
                icon.className = 'fas fa-cloud-slash';
                text.textContent = 'Modo Offline';
                break;
            case 'online':
                icon.className = 'fas fa-cloud-check';
                text.textContent = 'Nuvem Ativa';
                // Esconder após 4 segundos se estiver online e limpo
                setTimeout(() => {
                    if (this.isOnline() && !this.isSyncing && this.getQueue().length === 0) {
                        statusEl.classList.add('hide');
                    }
                }, 4000);
                break;
        }

        if (state !== 'online' || this.getQueue().length > 0) {
            statusEl.classList.remove('hide');
        }
    },

    injectStatusIndicator: function () {
        const html = `
            <div id="sync-status-indicator" class="sync-status hide">
                <div class="sync-pulse"></div>
                <i class="fas fa-cloud-check"></i>
                <span class="status-text">Conectado</span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const style = document.createElement('style');
        style.textContent = `
            .sync-status {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 10px 20px;
                background: rgba(15, 15, 20, 0.7);
                backdrop-filter: blur(15px) saturate(180%);
                -webkit-backdrop-filter: blur(15px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 30px;
                color: #FAFAFA;
                font-size: 0.7rem;
                font-weight: 600;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 10px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1);
                pointer-events: none;
            }
            .sync-status.hide { opacity: 0; transform: translateY(30px) scale(0.9); }
            
            .sync-status.offline { border-color: rgba(239, 68, 68, 0.3); color: #EF4444; }
            .sync-status.syncing { border-color: rgba(59, 130, 246, 0.3); color: #3B82F6; }
            .sync-status.online { border-color: rgba(16, 185, 129, 0.2); color: #10B981; }

            .sync-pulse {
                width: 8px;
                height: 8px;
                background: currentColor;
                border-radius: 50%;
                position: relative;
            }
            .syncing .sync-pulse {
                animation: pulse-sync 1.5s infinite;
            }
            @keyframes pulse-sync {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
            
            /* Pendentes no histórico */
            .transaction-item.is-pending {
                position: relative;
                overflow: hidden;
            }
            .transaction-item.is-pending::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                width: 3px;
                height: 100%;
                background: linear-gradient(to bottom, #3B82F6, #60A5FA);
                box-shadow: 2px 0 10px rgba(59, 130, 246, 0.4);
            }
        `;
        document.head.appendChild(style);
    },

    isOnline: function () {
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
