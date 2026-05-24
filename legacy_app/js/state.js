/**
 * js/state.js - Gerenciador de Estado Centralizado (C.A.S.H. State)
 * Substitui o uso excessivo de variáveis globais e evita Race Conditions.
 */

window.App = window.App || {};

window.App.State = {
    user: null,
    transactions: [],
    accounts: [],
    categories: [],
    projections: {
        balance: 0,
        monthly: 0
    },
    gamification: {
        xp: 0,
        level: 1,
        badges: {
            economyMaster: false,
            serialImporter: false,
            oracleApprentice: false,
            level5: false
        }
    },
    
    // Callbacks para quando o estado mudar (Observer Pattern)
    listeners: [],

    /**
     * Atualiza o estado e notifica os interessados
     */
    set: function(key, value) {
        this[key] = value;
        this.notify(key);
        console.log(`📦 State Update: ${key}`, value);
    },

    /**
     * Atalho para atualizar o objeto de gamificação
     */
    updateGamification: function(data) {
        this.gamification = { ...this.gamification, ...data };
        this.notify('gamification');
    },

    /**
     * Adiciona um listener para mudanças no estado
     */
    subscribe: function(callback) {
        this.listeners.push(callback);
    },

    /**
     * Notifica todos os listeners sobre uma mudança
     */
    notify: function(key) {
        this.listeners.forEach(cb => cb(key, this[key]));
    }
};

// Facilita o acesso legado enquanto migramos
window._allTransactions = window.App.State.transactions;
window._contas = window.App.State.accounts;
window._categories = window.App.State.categories;
