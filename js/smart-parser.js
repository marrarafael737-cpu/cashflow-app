/**
 * js/smart-parser.js - Intelligent Bank Notification Processor
 * Extracts transaction data from bank notification strings (SMS, Push, WhatsApp).
 */

const SmartParser = {
    // Dynamic Learning Cache (Phase 3)
    vendorCache: {}, // Stores { 'mcdonalds': 'Alimentação', ... }

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

        let workingText = text.trim();
        const cleanText = workingText.toLowerCase();
        
        // 1. Extract Value (Enhanced Regex with date protection)
        const amountRegex = /(?:R\$|r\$|\$)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?!\/)/i;
        const amountMatch = workingText.match(amountRegex);
        let valor = 0;
        if (amountMatch) {
            let rawValue = amountMatch[1];
            if (rawValue.includes(',') && rawValue.includes('.')) {
                rawValue = rawValue.replace(/\./g, '').replace(',', '.');
            } else if (rawValue.includes(',')) {
                rawValue = rawValue.replace(',', '.');
            }
            valor = parseFloat(rawValue);
            workingText = workingText.replace(amountMatch[0], '').trim();
        }

        // 2. Identify Type (Entry vs Exit vs Transfer)
        let tipo = 'saida';
        const isTransfer = this.keywords.transfer.some(k => cleanText.includes(k));
        const isIncome = this.keywords.income.some(k => cleanText.includes(k)) || 
                         (cleanText.includes('recebi') && !cleanText.includes('não recebi')) ||
                         (cleanText.includes('pix') && (cleanText.includes('recebido') || cleanText.includes('crédito')));

        if (isTransfer) {
            tipo = 'transferencia';
        } else if (isIncome) {
            tipo = 'entrada';
        }

        // 3. Extract Description (Advanced Heuristic)
        let descricao = "Nova Transação";
        const stopWords = ['no valor de', 'no valor', 'valor', 'em', 'da', 'do', 'de', 'na', 'no', 'para', 'com', 'realizada', 'realizado', 'aprovada', 'recebido', 'paguei', 'gastei', 'recebi', 'um', 'uma', 'compra', 'venda', 'pagamento', 'estabelecimento', 'sucesso', 'comprovante', 'autorizado', 'mensagem', 'alerta', 'banco', 'agencia', 'conta', 'cartão', 'final', 'vencimento', 'transação', 'efetuada', 'via', 'pix'];
        
        const patterns = [
            /(?:em|no|na|estabelecimento|para|de)\s+([^,.:;()0-9]+)/i,
            /aprovada\s+(?:no|na|em)\s+([^,.:;()0-9]+)/i,
            /recebido\s+de\s+([^,.:;()0-9]+)/i
        ];

        for (const pattern of patterns) {
            const match = workingText.match(pattern);
            if (match && match[1]) {
                let candidate = match[1].trim();
                if (candidate.length > 2) {
                    descricao = candidate;
                    break;
                }
            }
        }

        if (descricao === "Nova Transação") {
            const words = workingText.split(/\s+/);
            if (words.length > 0 && !stopWords.includes(words[0].toLowerCase())) {
                const potentialVendor = words[0];
                if (potentialVendor.length > 2) {
                    descricao = potentialVendor;
                    if (words[1] && !stopWords.includes(words[1].toLowerCase()) && words[1].length > 2) {
                        descricao += ' ' + words[1];
                    }
                }
            }
        }

        // Cleanup Description
        stopWords.forEach(sw => {
            const regexStart = new RegExp('^' + sw + '\\b\\s*', 'i');
            const regexEnd = new RegExp('\\s*\\b' + sw + '$', 'i');
            descricao = descricao.replace(regexStart, '').replace(regexEnd, '').trim();
        });

        if (descricao.length < 3 || descricao === "Nova Transação") {
            descricao = workingText.split(/\s+/).slice(0, 3).join(' ') || "Nova Transação";
        }

        descricao = descricao
            .replace(/\b(hoje|ontem|amanhã|cedo|tarde|noite|agora|dia)\b/gi, '')
            .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // 4. Contextual Category Scoring (Simulated AI)
        let bestCategory = 'Geral';
        let highestScore = 0;

        for (const [vendor, category] of Object.entries(this.vendorCache)) {
            if (descricao.toLowerCase().includes(vendor.toLowerCase())) {
                bestCategory = category;
                highestScore = 100;
                break;
            }
        }

        if (highestScore < 100) {
            for (const [catName, data] of Object.entries(this.categoryMappings)) {
                let score = 0;
                data.keywords.forEach(k => { if (cleanText.includes(k)) score += 10; });
                data.keywords.forEach(k => { if (descricao.toLowerCase().includes(k)) score += 15; });
                data.context.forEach(c => { if (cleanText.includes(c)) score += 5; });

                if (score > highestScore) {
                    highestScore = score;
                    bestCategory = catName;
                }
            }
        }

        // 5. Resolve Category
        let categoryId = null;
        let categoria_nome = bestCategory;
        if (typeof _categories !== 'undefined' && Array.isArray(_categories)) {
            const cat = _categories.find(c => c.nome.toLowerCase().includes(bestCategory.toLowerCase()));
            if (cat) categoryId = cat.id;
        }

        if (!categoryId && typeof _categories !== 'undefined' && Array.isArray(_categories)) {
            const fallbackCat = _categories.find(c => c.tipo === tipo) || _categories[0];
            categoryId = fallbackCat ? fallbackCat.id : null;
        }

        // 6. Detect Account (Zero-Click)
        let detectedAccountId = null;
        let detectedAccountName = null;
        if (typeof _contas !== 'undefined' && Array.isArray(_contas)) {
            const accMatch = _contas.find(c => {
                const accName = c.nome.toLowerCase();
                return cleanText.includes(accName) || accName.includes(cleanText.replace('cartão', '').replace('conta', '').trim());
            });
            
            if (accMatch) {
                detectedAccountId = accMatch.id;
                detectedAccountName = accMatch.nome;
                highestScore += 25; 
            }
        }

        // 7. Detect Date (Zero-Click)
        const d = new Date();
        let transDate = d.toLocaleDateString('en-CA');

        if (cleanText.includes('ontem')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            transDate = yesterday.toLocaleDateString('en-CA');
        } else if (cleanText.includes('amanhã')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            transDate = tomorrow.toLocaleDateString('en-CA');
        } else {
            const dayMatch = cleanText.match(/\bdia\s+(\d{1,2})\b/i);
            if (dayMatch) {
                const targetDay = parseInt(dayMatch[1]);
                if (targetDay >= 1 && targetDay <= 31) {
                    const targetDate = new Date();
                    targetDate.setDate(targetDay);
                    if (targetDay > d.getDate()) {
                        targetDate.setMonth(targetDate.getMonth() - 1);
                    }
                    transDate = targetDate.toLocaleDateString('en-CA');
                }
            }
        }

        // 8. Final Description Cleanup
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

    /**
     * Analyzes history to learn vendor patterns (Phase 3)
     */
    learnFromHistory(transactions) {
        if (!transactions || !Array.isArray(transactions)) return;
        
        const frequencyMap = {};

        transactions.forEach(t => {
            if (!t.descricao || !t.categoria_nome) return;
            const vendor = t.descricao.split(' ').slice(0, 2).join(' ').toLowerCase();
            if (vendor.length < 3) return;

            if (!frequencyMap[vendor]) frequencyMap[vendor] = {};
            frequencyMap[vendor][t.categoria_nome] = (frequencyMap[vendor][t.categoria_nome] || 0) + 1;
        });

        for (const [vendor, categories] of Object.entries(frequencyMap)) {
            let topCat = null;
            let topCount = 0;
            for (const [cat, count] of Object.entries(categories)) {
                if (count > topCount) {
                    topCount = count;
                    topCat = cat;
                }
            }
            if (topCat && topCount >= 1) {
                this.vendorCache[vendor] = topCat;
            }
        }
        
        localStorage.setItem('cashflow_vendor_cache', JSON.stringify(this.vendorCache));
    },

    /**
     * Initializes parser from local storage
     */
    init() {
        const saved = localStorage.getItem('cashflow_vendor_cache');
        if (saved) {
            try {
                this.vendorCache = JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao carregar cache do parser:', e);
            }
        }
    },

    capitalize(str) {
        if (!str) return '';
        const lowerPrepositions = ['de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com'];
        return str.toLowerCase().split(/\s+/).map((word, index) => {
            if (index > 0 && lowerPrepositions.includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }
};

window.SmartParser = SmartParser;
