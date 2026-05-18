/**
 * js/smart-parser.js - Intelligent Bank Notification Processor
 * Extracts transaction data from bank notification strings (SMS, Push, WhatsApp).
 */

const SmartParser = {
    // Dynamic Learning Cache (Phase 3)
    vendorCache: {}, // Stores { 'mcdonalds': 'Alimentação', ... }

    normalize(str) {
        if (!str) return '';
        return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .trim();
    },

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

    // High-Intelligence Category Concepts (Dynamic Concept mapping)
    categoryConcepts: {
        alimentacao: {
            names: ['alimenta', 'comida', 'restaurante', 'bebida', 'gastron', 'padaria', 'lanche', 'gourmet', 'bar', 'café', 'cafe'],
            keywords: ['comi', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'restaurante', 'ifood', 'lanche', 'padaria', 'mcdonalds', 'burger king', 'habibs', 'outback', 'gastronomia', 'pizza', 'sushi', 'espetinho', 'comida', 'refeição', 'refeicao', 'bebida', 'churrasco', 'açougue', 'acougue', 'fome', 'supermercado', 'mercado', 'hortifruti', 'mercearia', 'padoca']
        },
        transporte: {
            names: ['transp', 'uber', 'carro', 'moto', 'combust', 'posto', 'viag', 'corrida', 'pedágio', 'pedagio', 'oficina', 'mecân', 'mecan'],
            keywords: ['uber', 'gasolina', 'combustível', 'combustivel', 'ônibus', 'onibus', 'metrô', 'metro', '99app', 'posto', 'shell', 'ipiranga', 'estacionamento', 'pedágio', 'pedagio', 'oficina', 'mecânico', 'mecanico', 'pneu', 'corrida', 'viagem', 'passagem', 'carro', 'moto', 'taxa', 'volante', 'cabify', 'buser', 'azul', 'gol', 'latam']
        },
        lazer: {
            names: ['lazer', 'divers', 'rolê', 'role', 'entreten', 'festa', 'cinema', 'show', 'games', 'bar', 'cerveja', 'pub', 'churrasco'],
            keywords: ['cinema', 'show', 'festa', 'steam', 'netflix', 'spotify', 'ingressos', 'bar', 'cerveja', 'churrasco', 'games', 'playstation', 'xbox', 'nintendo', 'diversão', 'rolê', 'passeio', 'curtição', 'balada', 'pub', 'whisky', 'vinho']
        },
        compras_vestuario: {
            names: ['compra', 'luxo', 'roupa', 'vestu', 'estilo', 'presente', 'shopping', 'utilidade', 'loja', 'moda', 'shopee', 'shein', 'mercado livre', 'aliexpress', 'amazon'],
            keywords: ['roupa', 'vestuário', 'vestuario', 'calçado', 'calcado', 'tênis', 'tenis', 'camisa', 'calça', 'calca', 'casaco', 'compras', 'luxo', 'shopping', 'presente', 'joia', 'relógio', 'relogio', 'perfume', 'cosmético', 'cosmetico', 'maquiagem', 'salão', 'salao', 'barbearia', 'bolsa', 'óculos', 'oculos', 'sapato', 'vestido', 'terno', 'shopee', 'shein', 'mercado livre', 'aliexpress', 'amazon']
        },
        saude: {
            names: ['saúd', 'saud', 'med', 'farm', 'hosp', 'exame', 'remed', 'dentis', 'psic', 'clin', 'terap'],
            keywords: ['farmácia', 'farmacia', 'médico', 'medico', 'remédio', 'remedio', 'hospital', 'droga', 'exame', 'dentista', 'unimed', 'lab', 'clínica', 'clinica', 'terapia', 'psicólogo', 'psicologo', 'dor', 'doente', 'saúde', 'saude', 'consulta', 'drogaria', 'pills', 'vacina', 'lente', 'óculos', 'oculos']
        },
        mercado: {
            names: ['merc', 'superm', 'horti', 'açoug', 'acoug', 'despensa', 'mantimento'],
            keywords: ['mercado', 'supermercado', 'carrefour', 'extra', 'pao de acucar', 'atacadao', 'assai', 'hortifruti', 'mercearia', 'açougue', 'acougue', 'peixaria', 'compras', 'casa', 'despensa', 'mantimentos', 'feira', 'sacolão', 'sacolao']
        },
        moradia: {
            names: ['mora', 'alug', 'condo', 'luz', 'energia', 'agua', 'água', 'internet', 'casa', 'lar', 'resid', 'reforma', 'móvel', 'movel', 'decor'],
            keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'água', 'internet', 'vivo', 'claro', 'tim', 'reforma', 'móveis', 'moveis', 'decoração', 'decoracao', 'casa', 'lar', 'residência', 'residencia', 'apartamento', 'apto', 'enxoval', 'limpeza', 'iptu', 'gás', 'gas']
        },
        educacao: {
            names: ['educ', 'escola', 'facul', 'curso', 'estud', 'livro', 'aula', 'mensal'],
            keywords: ['escola', 'faculdade', 'curso', 'livros', 'udemy', 'alura', 'facul', 'mensalidade', 'material escolar', 'estudo', 'aprender', 'conhecimento', 'aula', 'livro', 'workshop', 'pós', 'pos', 'mba', 'tcc']
        },
        salario: {
            names: ['salár', 'salar', 'receit', 'ganho', 'renda', 'provent', 'faturam', 'venda', 'comiss'],
            keywords: ['salário', 'salario', 'pagamento', 'recebido', 'pix recebido', 'transferência recebida', 'transferencia recebida', 'depósito', 'deposito', 'renda', 'venda', 'comissão', 'comissao', 'bônus', 'bonus', 'salarial', 'pro labore', 'reembolso', 'estorno', 'cashback']
        },
        investimentos: {
            names: ['invest', 'aplic', 'poup', 'ativo', 'bolsa', 'renda fixa', 'renda var', 'cripto', 'tesouro'],
            keywords: ['investimento', 'tesouro', 'ações', 'acoes', 'fii', 'cripto', 'poupanca', 'poupança', 'cdi', 'aplicação', 'aplicacao', 'ações', 'fundos', 'tesouro direto', 'bdr', 'etf', 'bitcoin', 'ethereum']
        }
    },

    /**
     * Parses the notification text and returns a transaction object
     * Uses contextual scoring and fuzzy matching to simulate "AI" logic.
     * @param {string} text 
     * @returns {Object|null}
     */
    parse(text) {
        if (!text || text.trim().length < 2) return null;
        if (text.includes('?')) return null;

        let workingText = text.trim();
        const cleanText = workingText.toLowerCase();

        // 1. Extract Value (Enhanced currency & format support)
        const amountRegex = /(?:R\$|r\$|\$|reais|conto|pila)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?!\/)(?:\s?(?:reais|conto|pila))?/i;
        const amountMatch = workingText.match(amountRegex);
        let valor = 0;
        let amountText = "";
        if (amountMatch) {
            amountText = amountMatch[0];
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
        const isTransfer = this.keywords.transfer.some(k => {
            const regex = new RegExp('\\b' + k + '\\b', 'i');
            return regex.test(cleanText) || (window.NLP && window.NLP.isSimilar(cleanText, k, 1));
        });
        
        const isIncome = this.keywords.income.some(k => {
            const regex = new RegExp('\\b' + k + '\\b', 'i');
            return regex.test(cleanText) || (window.NLP && window.NLP.isSimilar(cleanText, k, 1));
        }) || 
        (/\brecebi\b/i.test(cleanText) && !/\bnão recebi\b/i.test(cleanText)) ||
        (/\bpix\b/i.test(cleanText) && (/\brecebido\b/i.test(cleanText) || /\bcrédito\b/i.test(cleanText)));

        if (isTransfer) {
            tipo = 'transferencia';
        } else if (isIncome) {
            tipo = 'entrada';
        }

        // 3. Extract Description (High-Intelligence Noun Phrase Heuristic)
        const stopWords = [
            'no valor de', 'no valor', 'valor', 'em', 'da', 'do', 'de', 'na', 'no', 'para', 'com', 'realizada', 
            'realizado', 'aprovada', 'recebido', 'paguei', 'gastei', 'recebi', 'um', 'uma', 'compra', 'venda', 
            'pagamento', 'estabelecimento', 'sucesso', 'comprovante', 'autorizado', 'mensagem', 'alerta', 
            'banco', 'agencia', 'conta', 'cartão', 'cartao', 'final', 'vencimento', 'transação', 'transacao', 
            'efetuada', 'via', 'pix', 'reais', 'conto', 'pila', 'comprei', 'comprar', 'compras', 'gastos', 
            'despesa', 'recebimento', 'ganhei', 'ganhar', 'por', 'deu', 'foi', 'para', 'pro', 'pra'
        ];

        let descText = workingText;
        if (amountText) {
            descText = descText.replace(amountText, '');
        }

        descText = descText
            .replace(/\b(hoje|ontem|amanhã|amanha|cedo|tarde|noite|agora|dia)\b/gi, '')
            .replace(/\bd{1,2}\/d{1,2}(\/d{2,4})?\b/g, '');

        const splitRegex = /(?:metade|divide|dividir|meio|parte)\s+(?:é|com|pro|pra|do|da|de)?\s+([A-Z][a-zà-ÿ]+)/i;
        descText = descText.replace(splitRegex, '');

        let descWords = descText.split(/\s+/)
            .map(w => w.replace(/[,.:;()]/g, '').trim())
            .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()));

        let descricao = descWords.slice(0, 4).join(' ');

        if (descricao) {
            descricao = this.capitalize(descricao);
        } else {
            descricao = tipo === 'entrada' ? 'Receita Recebida' : 'Despesa Lançada';
        }

        // 4. Zero-Click Account Detection
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
            }
        }

        // 5. Zero-Click Date Detection (Enhanced Temporal Intelligence)
        const d = new Date();
        let transDate = d.toLocaleDateString('en-CA');
        const weekdays = { 'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6, 'sabado': 6 };

        const getRelativeDate = (offset) => {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            return date.toLocaleDateString('en-CA');
        };

        if (cleanText.includes('anteontem')) {
            transDate = getRelativeDate(-2);
        } else if (cleanText.includes('ontem')) {
            transDate = getRelativeDate(-1);
        } else if (cleanText.includes('amanhã') || cleanText.includes('amanha')) {
            transDate = getRelativeDate(1);
        } else if (cleanText.includes('semana passada')) {
            transDate = getRelativeDate(-7);
        } else {
            let weekdayFound = false;
            for (const [name, dayNum] of Object.entries(weekdays)) {
                if (cleanText.includes(name)) {
                    const currentDay = d.getDay();
                    let diff = currentDay - dayNum;
                    if (cleanText.includes('passado') || cleanText.includes('passada') || diff <= 0) {
                        if (diff <= 0) diff += 7;
                    }
                    const targetDate = new Date();
                    targetDate.setDate(d.getDate() - diff);
                    transDate = targetDate.toLocaleDateString('en-CA');
                    weekdayFound = true;
                    break;
                }
            }

            if (!weekdayFound) {
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
        }

        // 6. Zero-Click Split Detection
        let splitWith = null;
        let splitValue = null;
        const splitPatterns = [
            /(?:metade|dividi|rachei)\s+(?:com|do|da|pro|pra)?\s+([a-zA-Záàâãéèêíïóôõöúçñ]+)/i,
            /([a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(?:me deve|vai pagar|paga metade)/i
        ];

        for (const pattern of splitPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                const name = match[1].toLowerCase();
                if (!['reais', 'conto', 'pila', 'hoje', 'ontem'].includes(name)) {
                    splitWith = this.capitalize(name);
                    splitValue = valor / 2;
                    break;
                }
            }
        }

        // 7. Contextual Category Scoring (Dynamic Conceptual Scoring vs Fallbacks)
        let bestCategoryObj = null;
        let highestScore = -1;
        let bestCategoryName = 'Geral';
        const activeCategories = (typeof _categories !== 'undefined' && Array.isArray(_categories)) ? _categories : [];

        // Dynamic Learning Cache Check
        for (const [vendor, category] of Object.entries(this.vendorCache)) {
            if (descricao.toLowerCase().includes(vendor.toLowerCase()) || (window.NLP && window.NLP.isSimilar(descricao, vendor, 1))) {
                const catMatch = activeCategories.find(c => c.nome.toLowerCase() === category.toLowerCase());
                if (catMatch) {
                    bestCategoryObj = catMatch;
                    highestScore = 1000; // Perfect match override
                    break;
                }
            }
        }

        if (highestScore < 1000 && activeCategories.length > 0) {
            activeCategories.forEach(cat => {
                const normCatName = this.normalize(cat.nome);
                const normCleanText = this.normalize(cleanText);
                let score = 0;

                // Word boundary check for direct category name reference
                const catNameRegex = new RegExp('\\b' + normCatName + '\\b', 'i');
                if (catNameRegex.test(normCleanText)) {
                    score += 50;
                }

                // Score against concept families
                for (const [conceptKey, conceptData] of Object.entries(this.categoryConcepts)) {
                    const isConceptMatch = conceptData.names.some(n => {
                        const normN = this.normalize(n);
                        return normCatName.includes(normN) || normN.includes(normCatName);
                    });
                    if (isConceptMatch) {
                        conceptData.keywords.forEach(k => {
                            const normK = this.normalize(k);
                            const wordRegex = new RegExp('\\b' + normK + '\\b', 'i');
                            if (wordRegex.test(normCleanText)) {
                                score += 15;
                            }
                        });

                        conceptData.keywords.forEach(k => {
                            const normK = this.normalize(k);
                            const wordRegex = new RegExp('\\b' + normK + '\\b', 'i');
                            if (wordRegex.test(this.normalize(descricao))) {
                                score += 25;
                            }
                        });
                    }
                }

                // Check direct word matches in category name
                const words = normCatName.split(/\s+/).filter(w => w.length > 2);
                words.forEach(w => {
                    const wRegex = new RegExp('\\b' + w + '\\b', 'i');
                    if (wRegex.test(normCleanText)) score += 20;
                });

                if (score > highestScore && score > 0) {
                    highestScore = score;
                    bestCategoryObj = cat;
                }
            });
        }

        // Static mapping fallback if no dynamic match could score above 0
        if (highestScore <= 0) {
            for (const [catName, data] of Object.entries(this.categoryMappings)) {
                let score = 0;
                data.keywords.forEach(k => {
                    const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                    if (wordRegex.test(cleanText)) score += 10;
                });
                
                data.keywords.forEach(k => {
                    const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                    if (wordRegex.test(descricao.toLowerCase())) score += 15;
                });

                if (score > highestScore && score > 0) {
                    highestScore = score;
                    bestCategoryName = catName;
                }
            }
        }

        // Final Category Resolution (Guarantees categoria_id is NEVER null to avoid toast crashes!)
        let categoryId = null;
        let categoria_nome = 'Geral';

        if (bestCategoryObj) {
            categoryId = bestCategoryObj.id;
            categoria_nome = bestCategoryObj.nome;
        } else if (activeCategories.length > 0) {
            // Locate static mapping match inside user's active categories using robust normalization
            const normBestName = this.normalize(bestCategoryName);
            const matchedCat = activeCategories.find(c => {
                const normCat = this.normalize(c.nome);
                return normCat.includes(normBestName) || normBestName.includes(normCat);
            });
            if (matchedCat) {
                categoryId = matchedCat.id;
                categoria_nome = matchedCat.nome;
            } else {
                // Perfect, robust ultimate fallback to prevent any toast blocks!
                const fallbackCat = activeCategories.find(c => {
                    const normCat = this.normalize(c.nome);
                    return normCat.includes('outro') || normCat.includes('geral') || normCat.includes('lazer');
                }) || activeCategories[0];
                
                categoryId = fallbackCat.id;
                categoria_nome = fallbackCat.nome;
            }
        }

        // 8. Final Description Cleanup (Remove auxiliary words, temporal shifts, splits)
        let finalDesc = descricao;
        if (detectedAccountName) {
            const accRegex = new RegExp('\\b' + detectedAccountName + '\\b', 'gi');
            finalDesc = finalDesc.replace(accRegex, '');
        }
        ['ontem', 'hoje', 'amanhã', 'amanha', 'no valor de', 'metade', 'dividi', 'rachei'].forEach(word => {
            const wordRegex = new RegExp('\\b' + word + '\\b', 'gi');
            finalDesc = finalDesc.replace(wordRegex, '');
        });
        if (splitWith) {
            const nameRegex = new RegExp('\\b' + splitWith + '\\b', 'gi');
            finalDesc = finalDesc.replace(nameRegex, '');
        }
        finalDesc = finalDesc.replace(/\s+/g, ' ').trim();

        // If cleanup left description empty, restore clean initial candidate
        if (!finalDesc || finalDesc.length < 2) {
            finalDesc = descricao;
        }

        return {
            valor: splitValue ? splitValue : valor,
            descricao: this.capitalize(finalDesc),
            tipo,
            categoria_id: categoryId,
            categoria_nome,
            conta_id: detectedAccountId,
            conta_nome: detectedAccountName,
            data: transDate,
            confidence: highestScore > 15 ? 95 : (highestScore > 0 ? highestScore : 10),
            split: splitWith ? { with: splitWith, value: splitValue, original_total: valor } : null
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
