/**
 * Motor Offline de Machine Learning (Naive Bayes)
 * Utilizado para prever a categoria de uma despesa baseado no histórico do usuário.
 */

class CategoryClassifier {
  constructor() {
    this.wordFrequencies = {}; // { word: { categoryA: 2, categoryB: 1 } }
    this.categoryCounts = {};  // { categoryA: 10, categoryB: 5 }
    this.totalTransactions = 0;
    this.vocabularySize = 0;
  }

  /**
   * Tokeniza um texto removendo acentos e pontuações,
   * retornando apenas palavras-chave.
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, " ")     // Remove pontuação
      .split(/\s+/)
      .filter(word => word.length > 2); // Ignora preposições curtas (de, da, no)
  }

  /**
   * Treina o modelo com o histórico (executado ao carregar o app).
   */
  train(transactions) {
    // Resetar estado
    this.wordFrequencies = {};
    this.categoryCounts = {};
    this.totalTransactions = 0;
    const vocabSet = new Set();

    transactions.forEach(tx => {
      if (!tx.description || !tx.category) return;
      
      const category = tx.category;
      this.categoryCounts[category] = (this.categoryCounts[category] || 0) + 1;
      this.totalTransactions++;

      const tokens = this.tokenize(tx.description);
      tokens.forEach(word => {
        vocabSet.add(word);
        if (!this.wordFrequencies[word]) {
          this.wordFrequencies[word] = {};
        }
        this.wordFrequencies[word][category] = (this.wordFrequencies[word][category] || 0) + 1;
      });
    });

    this.vocabularySize = vocabSet.size;
  }

  /**
   * Prevê a categoria de um novo texto.
   */
  predict(text) {
    if (this.totalTransactions === 0) return null; // Sem histórico

    const tokens = this.tokenize(text);
    if (tokens.length === 0) return null;

    let bestCategory = null;
    let maxProbability = -Infinity;

    Object.keys(this.categoryCounts).forEach(category => {
      // Logaritmo da probabilidade P(Categoria)
      let probability = Math.log(this.categoryCounts[category] / this.totalTransactions);

      // Probabilidade P(Palavra | Categoria) com Laplace Smoothing (+1)
      tokens.forEach(word => {
        const wordCountInCategory = (this.wordFrequencies[word] && this.wordFrequencies[word][category]) || 0;
        const probWordGivenCategory = (wordCountInCategory + 1) / (this.categoryCounts[category] + this.vocabularySize);
        probability += Math.log(probWordGivenCategory);
      });

      if (probability > maxProbability) {
        maxProbability = probability;
        bestCategory = category;
      }
    });

    return bestCategory;
  }
}

// Instância global em memória para o ciclo de vida do app
const classifier = new CategoryClassifier();

export default classifier;
