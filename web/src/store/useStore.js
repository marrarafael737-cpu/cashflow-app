import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Estado de Autenticação
  user: null,
  setUser: (user) => set({ user }),

  // Dados Financeiros
  transactions: [],
  accounts: [],
  categories: [],
  projections: {
    balance: 0,
    monthly: 0
  },

  // Ações para Transações
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => set((state) => ({ 
    transactions: [...state.transactions, transaction] 
  })),
  updateTransaction: (id, updatedTx) => set((state) => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, ...updatedTx } : t)
  })),
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id)
  })),

  // Ações para Contas e Categorias
  setAccounts: (accounts) => set({ accounts }),
  setCategories: (categories) => set({ categories }),

  // Gamificação
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
  
  updateGamification: (data) => set((state) => ({
    gamification: { ...state.gamification, ...data }
  })),
  
  addXp: (amount) => set((state) => {
    const newXp = state.gamification.xp + amount;
    // Lógica simplificada de level up (100 xp por level)
    const newLevel = Math.floor(newXp / 100) + 1;
    return {
      gamification: {
        ...state.gamification,
        xp: newXp,
        level: Math.max(state.gamification.level, newLevel)
      }
    };
  })
}));

export default useStore;
