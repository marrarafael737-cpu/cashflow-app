import { create } from 'zustand';
import classifier from '../utils/CategoryML';

const useStore = create((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  transactions: [],
  categories: [],
  
  // Atualiza as transações e automaticamente treina o modelo de ML
  setTransactions: (transactions) => {
    set({ transactions });
    classifier.train(transactions);
    console.log(`ML Engine treinado com ${transactions.length} transações.`);
  },

  addTransaction: (transaction) => {
    // Se a transação não tem categoria e é uma despesa, tenta adivinhar usando IA
    if (!transaction.category && transaction.type === 'expense' && transaction.description) {
      const predictedCategory = classifier.predict(transaction.description);
      if (predictedCategory) {
        transaction.category = predictedCategory;
        transaction.mlCategorized = true; // Flag para UI saber que foi a IA
      }
    }

    set((state) => {
      const newTransactions = [...state.transactions, transaction];
      // Retreinar no background
      classifier.train(newTransactions);
      return { transactions: newTransactions };
    });
  },

  setCategories: (categories) => set({ categories }),
}));

export default useStore;
