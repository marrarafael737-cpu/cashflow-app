/* js/sync-engine.js - Orchestrates offline/online data flow */

/**
 * Main function to sync pending transactions with Supabase
 */
async function syncOfflineData() {
    if (!navigator.onLine) return;

    const pending = await getPendingTransactions();
    if (pending.length === 0) return;

    console.log(`C.A.S.H. Unit: Detectadas ${pending.length} transações pendentes de sincronização.`);
    
    // Mostrar indicador de sync no UI se existir
    showSyncIndicator(true, pending.length);

    let successCount = 0;
    let failCount = 0;

    for (const item of pending) {
        try {
            // Remover o ID local do IndexedDB para não dar conflito no Supabase (que gera o seu próprio)
            const { id, offline_created_at, ...supabaseData } = item;
            
            const { error } = await supabase.from('transacoes').insert([supabaseData]);
            
            if (error) throw error;

            // Se inseriu com sucesso no Supabase, removemos do IndexedDB
            await removeOfflineTransaction(id);
            successCount++;
        } catch (err) {
            console.error('Falha ao sincronizar item:', err);
            failCount++;
        }
    }

    if (successCount > 0) {
        showToast(`${successCount} transações sincronizadas com sucesso! ✨`, 'success');
        
        // Recarregar dados globais para refletir as novas transações no dashboard
        const { data: { user } } = await supabase.auth.getUser();
        if (user && typeof loadTransactions === 'function') {
            await loadTransactions(user.id);
        }
    }

    if (failCount > 0) {
        showToast(`${failCount} itens falharam na sincronização e serão tentados novamente depois.`, 'warning');
    }

    showSyncIndicator(false);
}

/**
 * Updates UI to show sync progress
 */
function showSyncIndicator(active, count = 0) {
    let indicator = document.getElementById('sync-indicator');
    
    if (!indicator) {
        // Criar elemento se não existir
        indicator = document.createElement('div');
        indicator.id = 'sync-indicator';
        indicator.className = 'sync-indicator-toast';
        document.body.appendChild(indicator);
    }

    if (active) {
        indicator.innerHTML = `
            <div class="sync-content">
                <i class="fas fa-sync fa-spin"></i>
                <span>Sincronizando ${count} lançamentos...</span>
            </div>
        `;
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
    }
}

// Escutar eventos de conectividade
window.addEventListener('online', () => {
    console.log('C.A.S.H. Unit: Conexão restaurada. Iniciando sincronização...');
    showToast('Conexão restaurada! Sincronizando dados...', 'info');
    syncOfflineData();
});

window.addEventListener('offline', () => {
    console.warn('C.A.S.H. Unit: Conexão perdida. Entrando em Modo Offline.');
    showToast('Você está offline. Os lançamentos serão salvos localmente.', 'alert');
});

// Tentar sincronizar ao carregar o app se estiver online
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(syncOfflineData, 3000); // Delay curto para garantir que o Supabase/Auth esteja pronto
});
