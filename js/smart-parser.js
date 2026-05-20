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
            'pagamento de', 'compra no valor', 'transferência enviada', 'ted enviada', 'doc enviado',
            'paguei', 'gastei', 'comprei', 'compra', 'gastos', 'despesa', 'debito', 'debito em conta',
            'saida', 'enviado', 'enviou', 'pagou', 'gastou'
        ],
        income: [
            'recebido', 'pix recebido', 'transferência recebida', 'depósito', 
            'crédito em conta', 'reembolso', 'estorno', 'ganhei', 'recebi', 
            'faturei', 'entrou', 'recebimento', 'vendi', 'comissão', 'salário',
            'pagamento', 'ganhos', 'lucro', 'dividendos', 'rendimento', 'proventos',
            'cashback', 'ganhou', 'recebeu'
        ],
        transfer: [
            'entre contas', 'transferência entre', 'resgate de investimento', 'transferencia entre',
            'resgate', 'aplicacao', 'aplicação', 'investimento', 'guardar'
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

        // 1. PRE-PARSING FOR BANK PUSHES (Itaú & Inter)
        let isBankPush = false;
        let bankAccount = null;

        if (cleanText.includes('itau')) {
            isBankPush = true;
            if (typeof _contas !== 'undefined' && Array.isArray(_contas)) {
                bankAccount = _contas.find(c => c.nome.toLowerCase().includes('itau'));
            }
        } else if (cleanText.includes('inter')) {
            isBankPush = true;
            if (typeof _contas !== 'undefined' && Array.isArray(_contas)) {
                bankAccount = _contas.find(c => c.nome.toLowerCase().includes('inter') || c.nome.toLowerCase().includes('banco inter'));
            }
        }

        // Clean merchant and description for bank pushes
        let extractedDesc = null;
        let extractedTipo = null;
        let extractedValor = null;

        if (isBankPush) {
            // 1.1 Extract amount from push
            const pushAmountMatch = workingText.match(/(?:R\$|r\$|\$)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)/i);
            if (pushAmountMatch) {
                let rawValue = pushAmountMatch[1];
                if (rawValue.includes(',') && rawValue.includes('.')) {
                    rawValue = rawValue.replace(/\./g, '').replace(',', '.');
                } else if (rawValue.includes(',')) {
                    rawValue = rawValue.replace(',', '.');
                }
                extractedValor = parseFloat(rawValue);
            }

            // 1.2 Identify Type (Entry vs Exit)
            if (cleanText.includes('recebido') || cleanText.includes('recebeu') || cleanText.includes('recebi') || cleanText.includes('deposito') || cleanText.includes('credito') || cleanText.includes('estorno') || cleanText.includes('reembolso')) {
                extractedTipo = 'entrada';
            } else {
                extractedTipo = 'saida';
            }

            // 1.3 Extract merchant/person name
            if (cleanText.includes('itau')) {
                // Itaú purchase: "Itaú: Compra aprovada no seu cartao final 1234 - McDonald's R$ 45,90 em 20/05..."
                const merchantMatch = workingText.match(/-\s*([^R$]+?)\s+(?:R\$|\d)/i);
                if (merchantMatch && merchantMatch[1]) {
                    extractedDesc = merchantMatch[1].trim();
                } else {
                    // Pix enviado: "Itaú: Pix enviado: R$ 150,00 para Joao da Silva em 20/05."
                    const pixDestMatch = workingText.match(/(?:para|para\s+o)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?:\s+em|\s+no|\s+-\s*R\$|\.|$)/i);
                    if (pixDestMatch && pixDestMatch[1]) {
                        extractedDesc = "Pix: " + pixDestMatch[1].trim();
                    } else {
                        // Pix recebido de: "Itaú: Pix recebido de Maria de Souza: R$ 300,00"
                        const pixSrcMatch = workingText.match(/(?:de|de\s+a|do)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?:\s+em|\s+no|:|\s+-\s*R\$|\.|$)/i);
                        if (pixSrcMatch && pixSrcMatch[1]) {
                            extractedDesc = "Pix de: " + pixSrcMatch[1].trim();
                        }
                    }
                }
            } else if (cleanText.includes('inter')) {
                // Inter purchase: "Inter: Compra de R$ 99,90 no cartao final 5678 aprovada em Uber."
                const interMerchantMatch = workingText.match(/aprovada\s+em\s+([a-zA-Z0-9\s]+?)(?:\.|$)/i);
                if (interMerchantMatch && interMerchantMatch[1]) {
                    extractedDesc = interMerchantMatch[1].trim();
                } else {
                    // Pix enviado para: "Inter: Pix enviado para Joao da Silva - R$ 50,00."
                    const pixDestMatch = workingText.match(/(?:para|para\s+o)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?:\s+em|\s+no|\s+-\s*R\$|\.|$)/i);
                    if (pixDestMatch && pixDestMatch[1]) {
                        extractedDesc = "Pix: " + pixDestMatch[1].trim();
                    } else {
                        // Pix recebido de: "Inter: Pix recebido de Jose dos Santos - R$ 1.000,00."
                        const pixSrcMatch = workingText.match(/(?:de|de\s+a|do)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?:\s+em|\s+no|:|\s+-\s*R\$|\.|$)/i);
                        if (pixSrcMatch && pixSrcMatch[1]) {
                            extractedDesc = "Pix de: " + pixSrcMatch[1].trim();
                        }
                    }
                }
            }
        }

        let tipoComando = 'transacao';
        let valor = extractedValor || 0;
        let tipo = extractedTipo || 'saida';
        let amountText = "";

        // 2. EXTRACT VALUE (If not extracted by push pre-parser)
        const amountRegex = /(?:R\$|r\$|\$|reais|conto|pila)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?!\/)(?:\s?(?:reais|conto|pila))?/i;
        const amountMatch = workingText.match(amountRegex);
        if (amountMatch) {
            amountText = amountMatch[0];
            if (valor === 0) {
                let rawValue = amountMatch[1];
                if (rawValue.includes(',') && rawValue.includes('.')) {
                    rawValue = rawValue.replace(/\./g, '').replace(',', '.');
                } else if (rawValue.includes(',')) {
                    rawValue = rawValue.replace(',', '.');
                }
                valor = parseFloat(rawValue);
            }
        }

        // 3. DETECT TRANSFER COMMAND (de [origem] para [destino])
        let sourceAcc = null;
        let destAcc = null;
        let isTransferCommand = false;

        const transferRegex = /(?:transferir|transferi|transferencia|pix|ted|doc)\s+(?:de\s+)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)\s+(?:do|de|da)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para\s+o|para\s+a|para|pro|pra|a|ao)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)(?:\s+hoje|\s+ontem|\.|$)/i;
        const transferRegex2 = /(?:transferir|transferi|transferencia|pix|ted|doc)\s+(?:do|de|da)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)\s+(?:para\s+o|para\s+a|para|pro|pra|a|ao)\s+([a-zA-Záàâãéèêíïóôõöúçñ\s]+?)\s+(?:no\s+valor\s+de|valor|r\$\s*|de\s+)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?:\s|$)/i;
        
        let transMatch = cleanText.match(transferRegex);
        let originWord = "";
        let destWord = "";

        if (transMatch) {
            let rawValue = transMatch[1];
            if (rawValue.includes(',') && rawValue.includes('.')) {
                rawValue = rawValue.replace(/\./g, '').replace(',', '.');
            } else if (rawValue.includes(',')) {
                rawValue = rawValue.replace(',', '.');
            }
            valor = parseFloat(rawValue);
            originWord = transMatch[2].trim().toLowerCase();
            destWord = transMatch[3].trim().toLowerCase();
            isTransferCommand = true;
        } else {
            transMatch = cleanText.match(transferRegex2);
            if (transMatch) {
                originWord = transMatch[1].trim().toLowerCase();
                destWord = transMatch[2].trim().toLowerCase();
                let rawValue = transMatch[3];
                if (rawValue.includes(',') && rawValue.includes('.')) {
                    rawValue = rawValue.replace(/\./g, '').replace(',', '.');
                } else if (rawValue.includes(',')) {
                    rawValue = rawValue.replace(',', '.');
                }
                valor = parseFloat(rawValue);
                isTransferCommand = true;
            }
        }

        if (isTransferCommand && typeof _contas !== 'undefined' && Array.isArray(_contas)) {
            sourceAcc = _contas.find(c => {
                const name = c.nome.toLowerCase();
                return name.includes(originWord) || originWord.includes(name);
            });
            destAcc = _contas.find(c => {
                const name = c.nome.toLowerCase();
                return name.includes(destWord) || destWord.includes(name);
            });

            if (sourceAcc && destAcc) {
                tipoComando = 'transferencia';
                tipo = 'transferencia';
            }
        }

        // 4. DETECT INSTALLMENTS COMMAND (parcelado em 10x)
        let isInstallmentCommand = false;
        let parcelasTotal = 1;
        let valorParcela = valor;
        let valorTotal = valor;

        const matchInstAmount = cleanText.match(/(\d{1,2})\s*(?:x|vezes|parcelas)\s+(?:de\s+)?(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)/i);
        const matchTotalInst = cleanText.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)\s+(?:parcelado\s+em|em)\s+(\d{1,2})\s*(?:x|vezes|parcelas)/i);
        const matchPlainInst = cleanText.match(/(?:parcelado\s+em|em|parcelado)\s+(\d{1,2})\s*(?:x|vezes|parcelas)/i);

        if (matchInstAmount) {
            parcelasTotal = parseInt(matchInstAmount[1]);
            let rawValue = matchInstAmount[2];
            if (rawValue.includes(',') && rawValue.includes('.')) {
                rawValue = rawValue.replace(/\./g, '').replace(',', '.');
            } else if (rawValue.includes(',')) {
                rawValue = rawValue.replace(',', '.');
            }
            valorParcela = parseFloat(rawValue);
            valorTotal = valorParcela * parcelasTotal;
            isInstallmentCommand = true;
        } else if (matchTotalInst) {
            let rawValue = matchTotalInst[1];
            if (rawValue.includes(',') && rawValue.includes('.')) {
                rawValue = rawValue.replace(/\./g, '').replace(',', '.');
            } else if (rawValue.includes(',')) {
                rawValue = rawValue.replace(',', '.');
            }
            valorTotal = parseFloat(rawValue);
            parcelasTotal = parseInt(matchTotalInst[2]);
            valorParcela = valorTotal / parcelasTotal;
            isInstallmentCommand = true;
        } else if (matchPlainInst) {
            parcelasTotal = parseInt(matchPlainInst[1]);
            valorTotal = valor;
            valorParcela = valorTotal / parcelasTotal;
            isInstallmentCommand = true;
        }

        if (isInstallmentCommand && parcelasTotal > 1) {
            tipoComando = 'parcelamento';
            valor = valorParcela; // return installment value
        }

        // 5. DETECT RECURRENCE COMMAND (todo mês)
        let isRecurrenceCommand = false;
        let diaVencimento = new Date().getDate();

        if (/\b(todo\s+mês|todo\s+mes|mensalmente|mensal|recorrente)\b/i.test(cleanText)) {
            isRecurrenceCommand = true;
            tipoComando = 'recorrencia';
            
            const dayMatch = cleanText.match(/\bdia\s+(\d{1,2})\b/i);
            if (dayMatch) {
                const day = parseInt(dayMatch[1]);
                if (day >= 1 && day <= 31) {
                    diaVencimento = day;
                }
            }
        }

        // 6. DETECT GOALS COMMAND (guardei 150 na Meta Viagem)
        let isGoalCommand = false;
        let detectedMetaId = null;
        let detectedMetaName = null;

        if (/\b(guardar|guardei|salvei|aporte|meta|poupar|cofre|reserva)\b/i.test(cleanText) && typeof _metas !== 'undefined' && Array.isArray(_metas)) {
            const matchedMeta = _metas.find(m => {
                const mName = m.nome.toLowerCase();
                return cleanText.includes(mName);
            });

            if (matchedMeta) {
                detectedMetaId = matchedMeta.id;
                detectedMetaName = matchedMeta.nome;
                isGoalCommand = true;
                tipoComando = 'meta';
                tipo = 'saida'; // savings is out of pocket
            }
        }

        // 7. Identify Type (Entry vs Exit) if not set by push/transfers/goals
        if (tipoComando !== 'transferencia' && tipoComando !== 'meta' && !extractedTipo) {
            const normalizedText = this.normalize(workingText);

            const isIncome = this.keywords.income.some(k => {
                const cleanK = this.normalize(k);
                const regex = new RegExp('\\b' + cleanK + '\\b', 'i');
                return regex.test(normalizedText) || (window.NLP && window.NLP.isSimilar(normalizedText, cleanK, 1));
            }) || 
            (/\b(recebi|receber|recebido|recebimento|recebimentos|recebida|ganhei|ganhar|ganho|ganhos|faturei|faturar|faturamento|entrou|caiu|salario|pagamento|vendi|venda|comissao|deposito|reembolso|estorno|lucro|dividendo|rendimento|proventos|provento|cashback|ted recebida|doc recebido|pix recebido|recebidos|ganhos|ganhou|recebeu)\b/i.test(normalizedText) && !/\b(nao recebi)\b/i.test(normalizedText)) ||
            (/\bpix\b/i.test(normalizedText) && /\b(recebi|receber|recebido|recebimento|ganhei|ganhar|ganho|faturei|faturar|entrou|caiu|deposito|credito|estorno|reembolso|ganhou|recebeu)\b/i.test(normalizedText));

            if (isIncome) {
                tipo = 'entrada';
            } else {
                tipo = 'saida';
            }
        }

        // 8. ZERO-CLICK ACCOUNT DETECTION
        let detectedAccountId = null;
        let detectedAccountName = null;

        if (tipoComando === 'transferencia' && sourceAcc) {
            detectedAccountId = sourceAcc.id;
            detectedAccountName = sourceAcc.nome;
        } else if (isBankPush && bankAccount) {
            detectedAccountId = bankAccount.id;
            detectedAccountName = bankAccount.nome;
        } else if (typeof _contas !== 'undefined' && Array.isArray(_contas)) {
            const accMatch = _contas.find(c => {
                const accName = c.nome.toLowerCase();
                return cleanText.includes(accName) || accName.includes(cleanText.replace('cartão', '').replace('conta', '').trim());
            });
            
            if (accMatch) {
                detectedAccountId = accMatch.id;
                detectedAccountName = accMatch.nome;
            }
        }

        // 9. EXTRACT DESCRIPTION (If not pre-parsed by bank push)
        let finalDesc = extractedDesc;

        if (!finalDesc) {
            const stopWords = [
                'no valor de', 'no valor', 'valor', 'em', 'da', 'do', 'de', 'na', 'no', 'para', 'com', 'realizada', 
                'realizado', 'aprovada', 'recebido', 'paguei', 'gastei', 'recebi', 'um', 'uma', 'compra', 'venda', 
                'pagamento', 'estabelecimento', 'sucesso', 'comprovante', 'autorizado', 'mensagem', 'alerta', 
                'banco', 'agencia', 'conta', 'cartão', 'cartao', 'final', 'vencimento', 'transação', 'transacao', 
                'efetuada', 'via', 'pix', 'reais', 'conto', 'pila', 'comprei', 'comprar', 'compras', 'gastos', 
                'despesa', 'recebimento', 'ganhei', 'ganhar', 'por', 'deu', 'foi', 'para', 'pro', 'pra',
                'faturei', 'faturar', 'faturamento', 'entrou', 'caiu', 'salário', 'salario', 'vendi', 'venda',
                'comissão', 'comissao', 'depósito', 'deposito', 'depositou', 'reembolso', 'estorno', 'lucro',
                'dividendos', 'rendimento', 'proventos', 'cashback', 'ganhou', 'recebeu', 'ganhos', 'transferi',
                'transferir', 'transferencia', 'ted', 'doc', 'parcelado', 'parcelas', 'vezes', 'dia', 'meta', 'guardar',
                'guardei', 'salvei', 'aporte', 'poupar', 'todo mês', 'todo mes', 'mensalmente', 'mensal', 'recorrente'
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
                .map(w => w.replace(/[,.:;()\-]/g, '').trim())
                .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()));

            extractedDesc = descWords.slice(0, 4).join(' ');

            if (extractedDesc) {
                finalDesc = this.capitalize(extractedDesc);
            } else {
                if (tipoComando === 'transferencia') {
                    finalDesc = `Transferência de ${sourceAcc?.nome || 'Origem'} para ${destAcc?.nome || 'Destino'}`;
                } else if (tipoComando === 'meta') {
                    finalDesc = `Aporte: Meta ${detectedMetaName}`;
                } else if (tipoComando === 'recorrencia') {
                    finalDesc = `Recorrência: ${tipo === 'entrada' ? 'Receita' : 'Despesa'}`;
                } else {
                    finalDesc = tipo === 'entrada' ? 'Receita Recebida' : 'Despesa Lançada';
                }
            }
        }

        // 10. ZERO-CLICK DATE DETECTION (Same as before)
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

        // 11. ZERO-CLICK SPLIT DETECTION
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

        // 12. CONTEXTUAL CATEGORY SCORING
        let bestCategoryObj = null;
        let highestScore = -1;
        let bestCategoryName = 'Geral';
        const activeCategories = (typeof _categories !== 'undefined' && Array.isArray(_categories)) ? _categories : [];

        // Dynamic Learning Cache Check
        for (const [vendor, category] of Object.entries(this.vendorCache)) {
            if (finalDesc.toLowerCase().includes(vendor.toLowerCase()) || (window.NLP && window.NLP.isSimilar(finalDesc, vendor, 1))) {
                const catMatch = activeCategories.find(c => c.nome.toLowerCase() === category.toLowerCase());
                if (catMatch) {
                    bestCategoryObj = catMatch;
                    highestScore = 1000;
                    break;
                }
            }
        }

        if (highestScore < 1000 && activeCategories.length > 0) {
            activeCategories.forEach(cat => {
                const normCatName = this.normalize(cat.nome);
                const normCleanText = this.normalize(cleanText);
                let score = 0;

                const catNameRegex = new RegExp('\\b' + normCatName + '\\b', 'i');
                if (catNameRegex.test(normCleanText)) {
                    score += 50;
                }

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
                            if (wordRegex.test(this.normalize(finalDesc))) {
                                score += 25;
                            }
                        });
                    }
                }

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

        if (highestScore <= 0) {
            for (const [catName, data] of Object.entries(this.categoryMappings)) {
                let score = 0;
                data.keywords.forEach(k => {
                    const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                    if (wordRegex.test(cleanText)) score += 10;
                });
                
                data.keywords.forEach(k => {
                    const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                    if (wordRegex.test(finalDesc.toLowerCase())) score += 15;
                });

                if (score > highestScore && score > 0) {
                    highestScore = score;
                    bestCategoryName = catName;
                }
            }
        }

        let categoryId = null;
        let categoria_nome = 'Geral';

        if (bestCategoryObj) {
            categoryId = bestCategoryObj.id;
            categoria_nome = bestCategoryObj.nome;
        } else if (activeCategories.length > 0) {
            const normBestName = this.normalize(bestCategoryName);
            const matchedCat = activeCategories.find(c => {
                const normCat = this.normalize(c.nome);
                return normCat.includes(normBestName) || normBestName.includes(normCat);
            });
            if (matchedCat) {
                categoryId = matchedCat.id;
                categoria_nome = matchedCat.nome;
            } else {
                const fallbackCat = activeCategories.find(c => {
                    const normCat = this.normalize(c.nome);
                    return normCat.includes('outro') || normCat.includes('geral') || normCat.includes('lazer');
                }) || activeCategories[0];
                
                categoryId = fallbackCat.id;
                categoria_nome = fallbackCat.nome;
            }
        }

        // 13. FINAL DESCRIPTION CLEANUP & PRE-PROCESS
        let descCleanup = finalDesc;
        if (detectedAccountName) {
            const accRegex = new RegExp('\\b' + detectedAccountName + '\\b', 'gi');
            descCleanup = descCleanup.replace(accRegex, '');
        }
        ['ontem', 'hoje', 'amanhã', 'amanha', 'no valor de', 'metade', 'dividi', 'rachei', 'itau', 'inter'].forEach(word => {
            const wordRegex = new RegExp('\\b' + word + '\\b', 'gi');
            descCleanup = descCleanup.replace(wordRegex, '');
        });
        if (splitWith) {
            const nameRegex = new RegExp('\\b' + splitWith + '\\b', 'gi');
            descCleanup = descCleanup.replace(nameRegex, '');
        }
        descCleanup = descCleanup.replace(/\s+/g, ' ').trim();

        if (!descCleanup || descCleanup.length < 2) {
            descCleanup = finalDesc;
        }

        return {
            tipo_comando: tipoComando,
            valor: splitValue ? splitValue : valor,
            valor_total: valorTotal,
            descricao: this.capitalize(descCleanup),
            tipo,
            categoria_id: categoryId,
            categoria_nome,
            conta_id: detectedAccountId,
            conta_nome: detectedAccountName,
            data: transDate,
            confidence: highestScore > 15 ? 95 : (highestScore > 0 ? highestScore : 10),
            split: splitWith ? { with: splitWith, value: splitValue, original_total: valor } : null,
            
            // Command specifics
            parcelas_total: parcelasTotal,
            dia_vencimento: diaVencimento,
            meta_id: detectedMetaId,
            meta_nome: detectedMetaName,
            conta_origem_id: sourceAcc?.id || null,
            conta_origem_nome: sourceAcc?.nome || null,
            conta_destino_id: destAcc?.id || null,
            conta_destino_nome: destAcc?.nome || null
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
