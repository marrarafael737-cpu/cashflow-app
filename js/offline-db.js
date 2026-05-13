/* js/offline-db.js - IndexedDB Manager for Offline Persistence */

const DB_NAME = 'CashFlowOfflineDB';
const DB_VERSION = 1;
const STORE_TRANSACTIONS = 'pending_transactions';

/**
 * Initializes the IndexedDB
 */
function initOfflineDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Erro ao abrir IndexedDB: ' + event.target.error);
    });
}

/**
 * Saves a transaction to the offline store
 */
async function saveOfflineTransaction(transactionData) {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_TRANSACTIONS], 'readwrite');
        const store = transaction.objectStore(STORE_TRANSACTIONS);
        
        const data = {
            ...transactionData,
            offline_created_at: new Date().toISOString()
        };

        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Erro ao salvar transação offline');
    });
}

/**
 * Retrieves all pending transactions
 */
async function getPendingTransactions() {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_TRANSACTIONS], 'readonly');
        const store = transaction.objectStore(STORE_TRANSACTIONS);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Erro ao recuperar transações offline');
    });
}

/**
 * Removes a transaction from the offline store
 */
async function removeOfflineTransaction(id) {
    const db = await initOfflineDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_TRANSACTIONS], 'readwrite');
        const store = transaction.objectStore(STORE_TRANSACTIONS);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Erro ao remover transação offline');
    });
}
