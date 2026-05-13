/* js/offline-sync.js - Offline Transaction Cache & Synchronization */

const SYNC_QUEUE_KEY = 'cashflow_sync_queue';

const OfflineSync = {
    /**
     * Adiciona uma transação à fila de sincronização local
     */
    addToQueue: function(transactionData) {
        try {
            const queue = this.getQueue();
            // Adicionar timestamp local para referência
            const item = {
                data: transactionData,
                timestamp: new Date().toISOString(),
                id: 'offline_' + Date.now() + Math.random().toString(36).substr(2, 5)
            };
            
            queue.push(item);
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
            
            console.log('C.A.S.H. Unit: Lançamento salvo em cache (Offline).', item);
            
            if (typeof showToast === 'function') {
                showToast('Você está offline. O lançamento foi salvo e será sincronizado automaticamente quando houver conexão!', 'info');
            }
            
            // Disparar evento customizado para atualizar a UI se necessário
            window.dispatchEvent(new CustomEvent('offline-data-added', { detail: item }));
            
            return item.id;
        } catch (error) {
            console.error('Erro ao salvar em cache offline:', error);
            return null;
        }
    },

    /**
     * Obtém a fila atual de sincronização
     */
    getQueue: function() {
        const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    },

    /**
     * Limpa a fila (geralmente após sincronização bem-sucedida)
     */
    clearQueue: function() {
        localStorage.removeItem(SYNC_QUEUE_KEY);
    },

    /**
     * Remove um item específico da fila
     */
    removeFromQueue: function(itemId) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== itemId);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    },

    /**
     * Sincroniza a fila local com o Supabase
     */
    sync: async function(userId) {
        const queue = this.getQueue();
        if (queue.length === 0) return;

        console.log(`C.A.S.H. Unit: Iniciando sincronização de ${queue.length} itens...`);
        
        if (typeof showToast === 'function') {
            showToast(`Sincronizando ${queue.length} lançamentos pendentes...`, 'info');
        }

        let successCount = 0;
        let failCount = 0;

        for (const item of queue) {
            try {
                // Garantir que o user_id está correto
                const dataToSync = Array.isArray(item.data) 
                    ? item.data.map(d => ({ ...d, user_id: userId }))
                    : { ...item.data, user_id: userId };

                const { error } = await supabase.from('transacoes').insert(dataToSync);
                
                if (error) throw error;

                // Remover da fila após sucesso
                this.removeFromQueue(item.id);
                successCount++;
            } catch (error) {
                console.error(`Erro ao sincronizar item ${item.id}:`, error);
                failCount++;
            }
        }

        if (successCount > 0) {
            if (typeof showToast === 'function') {
                showToast(`${successCount} lançamentos sincronizados com sucesso! 🚀`, 'success');
            }
            // Recarregar dados globais para refletir as mudanças
            if (typeof loadTransactions === 'function') await loadTransactions(userId);
            if (typeof updateSummary === 'function') updateSummary();
        }

        if (failCount > 0) {
            console.warn(`C.A.S.H. Unit: ${failCount} itens falharam na sincronização.`);
        }
    },

    /**
     * Verifica status da conexão
     */
    isOnline: function() {
        return navigator.onLine;
    }
};

// Listeners de Conexão
window.addEventListener('online', async () => {
    console.log('C.A.S.H. Unit: Conexão restaurada!');
    document.body.classList.remove('is-offline');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        OfflineSync.sync(user.id);
    }
});

window.addEventListener('offline', () => {
    console.log('C.A.S.H. Unit: Conexão perdida. Entrando em modo Offline.');
    document.body.classList.add('is-offline');
    if (typeof showToast === 'function') {
        showToast('Você está offline. Funcionalidades limitadas ativadas.', 'alert');
    }
});
