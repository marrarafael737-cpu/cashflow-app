/**
 * js/smart-parser.js - Intelligent Bank Notification Processor
 * Extracts transaction data from bank notification strings (SMS, Push, WhatsApp).
 */

const SmartParser = {
    // Keywords for detection
    keywords: {
        expense: [
            'compra aprovada', 'pagamento realizado', 'saída de', 'vencimento', 
            'pagamento de', 'compra no valor', 'transferência enviada', 'ted enviada', 'doc enviado'
        ],
        income: [
            'recebido', 'pix recebido', 'transferência recebida', 'depósito', 
            'crédito em conta', 'reembolso', 'estorno'
        ],
        transfer: [
            'entre contas', 'transferência entre', 'resgate de investimento'
        ]
    },

    // Category mappings with Weights for scoring
    categoryMappings: {
        'Alimentação': { 
            keywords: ['comi', 'almoço', 'jantar', 'café', 'restaurante', 'ifood', 'lanche', 'padaria', 'mcdonalds', 'burger king', 'habibs', 'outback', 'gastronomia', 'pizza', 'sushi', 'espetinho'],
            context: ['fome', 'comida', 'refeição', 'lanche']
        },
        'Transporte': {
            keywords: ['uber', 'gasolina', 'combustível', 'ônibus', 'metrô', '99app', 'posto', 'shell', 'ipiranga', 'estacionamento', 'pedágio', 'oficina', 'mecânico', 'pneu'],
            context: ['viagem', 'corrida', 'carro', 'transporte', 'volante']
        },
        'Lazer': {
            keywords: ['cinema', 'show', 'festa', 'viagem', 'steam', 'netflix', 'spotify', 'ingressos', 'hospedagem', 'bar', 'cerveja', 'churrasco', 'games', 'playstation', 'xbox'],
            context: ['diversão', 'rolê', 'passeio', 'curtição']
        },
        'Saúde': {
            keywords: ['farmácia', 'médico', 'remédio', 'hospital', 'droga', 'exame', 'dentista', 'unimed', 'lab', 'clínica', 'terapia', 'psicólogo'],
            context: ['dor', 'doente', 'saúde', 'consulta', 'remédio']
        },
        'Mercado': {
            keywords: ['mercado', 'supermercado', 'carrefour', 'extra', 'pao de acucar', 'atacadao', 'assai', 'hortifruti', 'mercearia', 'açougue', 'peixaria'],
            context: ['compras', 'casa', 'despensa', 'mantimentos']
        },
        'Moradia': {
            keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'internet', 'vivo', 'claro', 'tim', 'reforma', 'móveis', 'decoração'],
            context: ['casa', 'lar', 'residência', 'apartamento']
        },
        'Educação': {
            keywords: ['escola', 'faculdade', 'curso', 'livros', 'udemy', 'alura', 'facul', 'mensalidade', 'material escolar'],
            context: ['estudo', 'aprender', 'conhecimento', 'aula']
        }
    },

    /**
     * Parses the notification text and returns a transaction object
     * Uses contextual scoring to simulate "AI" logic.
     * @param {string} text 
     * @returns {Object|null}
     */
    parse(text) {
        if (!text || text.trim().length < 5) return null;

        const cleanText = text.toLowerCase();
        
        // 1. Extract Value (Enhanced Regex)
        const amountMatch = text.match(/(?:R\$|r\$|\$)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)/);
        let valor = 0;
        if (amountMatch) {
            let rawValue = amountMatch[1];
            if (rawValue.includes(',') && rawValue.includes('.')) {
                rawValue = rawValue.replace(/\./g, '').replace(',', '.');
            } else if (rawValue.includes(',')) {
                rawValue = rawValue.replace(',', '.');
            }
            valor = parseFloat(rawValue);
        }

        // 2. Identify Type (Entry vs Exit vs Transfer)
        let tipo = 'saida';
        if (this.keywords.income.some(k => cleanText.includes(k))) {
            tipo = 'entrada';
        } else if (this.keywords.transfer.some(k => cleanText.includes(k))) {
            tipo = 'transferencia';
        }

        // 3. Extract Description (Advanced Heuristic)
        let descricao = "Nova Transação";
        const stopWords = ['no valor', 'em', 'da', 'do', 'na', 'no', 'para', 'com', 'realizada', 'aprovada', 'recebido'];
        
        const patterns = [
            /(?:em|no|na|no estabelecimento|para|de)\s+([^,.:;()0-9]+)/i,
            /aprovada\s+(?:no|na|em)\s+([^,.:;()0-9]+)/i,
            /recebido\s+de\s+([^,.:;()0-9]+)/i,
            /^([^,.:;()0-9]+)\s+(?:valor|no valor|no valor de)/i, // New: "Almoço no valor de..."
            /^([^,.:;()0-9]+)\s+[0-9]/i // New: "Supermercado 50.00"
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let candidate = match[1].trim();
                // Clean up trailing/leading stop words
                stopWords.forEach(sw => {
                    if (candidate.toLowerCase().startsWith(sw + ' ')) candidate = candidate.slice(sw.length + 1);
                    if (candidate.toLowerCase().endsWith(' ' + sw)) candidate = candidate.slice(0, -(sw.length + 1));
                });
                
                if (candidate.length > 2) {
                    descricao = candidate;
                    break;
                }
            }
        }

        // If still fallback, use the first 4 words of the text
        if (descricao === "Nova Transação") {
            descricao = text.split(' ').slice(0, 4).join(' ');
        }

        // 4. Contextual Category Scoring (Simulated AI)
        let bestCategory = 'Geral';
        let highestScore = 0;

        for (const [catName, data] of Object.entries(this.categoryMappings)) {
            let score = 0;
            
            // Check direct keywords (High weight)
            data.keywords.forEach(k => {
                if (cleanText.includes(k)) score += 10;
            });

            // Check description (Medium weight)
            data.keywords.forEach(k => {
                if (descricao.toLowerCase().includes(k)) score += 15;
            });

            // Check context words (Low weight)
            data.context.forEach(c => {
                if (cleanText.includes(c)) score += 5;
            });

            if (score > highestScore) {
                highestScore = score;
                bestCategory = catName;
            }
        }

        // 4. Resolve Category
        let categoryId = null;
        let categoria_nome = bestCategory;
        if (typeof _categories !== 'undefined') {
            const cat = _categories.find(c => c.nome.toLowerCase().includes(bestCategory.toLowerCase()));
            if (cat) categoryId = cat.id;
        }

        // Fallback for Category ID
        if (!categoryId && typeof _categories !== 'undefined') {
            const fallbackCat = _categories.find(c => c.tipo === tipo) || _categories[0];
            categoryId = fallbackCat ? fallbackCat.id : null;
        }

        // 5. Detect Account (Zero-Click)
        let detectedAccountId = null;
        let detectedAccountName = null;
        if (typeof _contas !== 'undefined') {
            const accMatch = _contas.find(c => cleanText.includes(c.nome.toLowerCase()));
            if (accMatch) {
                detectedAccountId = accMatch.id;
                detectedAccountName = accMatch.nome;
                highestScore += 20; 
            }
        }

        // 6. Detect Date (Zero-Click)
        const d = new Date();
        const toLocalDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let transDate = toLocalDateString(d);
        if (cleanText.includes('ontem')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            transDate = toLocalDateString(yesterday);
            highestScore += 10;
        } else if (cleanText.includes('amanhã')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            transDate = toLocalDateString(tomorrow);
            highestScore += 10;
        }

        // 7. Final Description Cleanup (Remove detected account, dates, and extra words)
        let finalDesc = descricao;
        if (detectedAccountName) {
            const accRegex = new RegExp(detectedAccountName, 'gi');
            finalDesc = finalDesc.replace(accRegex, '');
        }
        ['ontem', 'hoje', 'amanhã', 'no valor de'].forEach(word => {
            const wordRegex = new RegExp('\\b' + word + '\\b', 'gi');
            finalDesc = finalDesc.replace(wordRegex, '');
        });
        finalDesc = finalDesc.replace(/\s+/g, ' ').trim();

        return {
            valor,
            descricao: this.capitalize(finalDesc || descricao),
            tipo,
            categoria_id: categoryId,
            categoria_nome,
            conta_id: detectedAccountId,
            conta_nome: detectedAccountName,
            data: transDate,
            confidence: highestScore 
        };
    },

    capitalize(str) {
        return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
};

window.SmartParser = SmartParser;
