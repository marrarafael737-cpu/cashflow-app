// scratch/test_new_parser_dynamic.js
const fs = require('fs');

const global_categories = [
    { id: 'cat-1', nome: 'Alimentação', tipo: 'saida' },
    { id: 'cat-2', nome: 'Moradia', tipo: 'saida' },
    { id: 'cat-3', nome: 'Lazer', tipo: 'saida' },
    { id: 'cat-4', nome: 'Saúde', tipo: 'saida' },
    { id: 'cat-5', nome: 'Transporte', tipo: 'saida' },
    { id: 'cat-6', nome: 'Salário', tipo: 'entrada' },
    { id: 'cat-7', nome: 'Investimentos', tipo: 'entrada' },
    { id: 'cat-8', nome: 'Compras e Luxo', tipo: 'saida' } // Custom Category!
];

const categoryConcepts = {
    alimentacao: {
        names: ['alimenta', 'comida', 'restaurante', 'bebida', 'gastron', 'padaria', 'lanche', 'gourmet', 'bar', 'café', 'cafe'],
        keywords: ['comi', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'restaurante', 'ifood', 'lanche', 'padaria', 'mcdonalds', 'burger king', 'habibs', 'outback', 'gastronomia', 'pizza', 'sushi', 'espetinho', 'comida', 'refeição', 'refeicao', 'bebida', 'churrasco', 'açougue', 'acougue', 'fome', 'supermercado', 'mercado', 'hortifruti', 'mercearia', 'padoca']
    },
    transporte: {
        names: ['transp', 'uber', 'carro', 'moto', 'combust', 'posto', 'viag', 'corrida', 'pedágio', 'pedagio', 'oficina', 'mecân', 'mecan'],
        keywords: ['uber', 'gasolina', 'combustível', 'combustivel', 'ônibus', 'onibus', 'metrô', 'metro', '99app', 'posto', 'shell', 'ipiranga', 'estacionamento', 'pedágio', 'pedagio', 'oficina', 'mecânico', 'mecanico', 'pneu', 'corrida', 'viagem', 'passagem', 'carro', 'moto', 'taxa', 'volante', 'cabify', 'buser', 'azul', 'gol', 'latam']
    },
    lazer_compras: {
        names: ['lazer', 'divers', 'rolê', 'role', 'entreten', 'viag', 'festa', 'cinema', 'show', 'compras', 'luxo', 'roupa', 'vestu', 'estilo', 'presente', 'games', 'jogo', 'shopping', 'utilidade'],
        keywords: ['cinema', 'show', 'festa', 'viagem', 'steam', 'netflix', 'spotify', 'ingressos', 'hospedagem', 'bar', 'cerveja', 'churrasco', 'games', 'playstation', 'xbox', 'nintendo', 'roupa', 'vestuário', 'vestuario', 'calçado', 'calcado', 'tênis', 'tenis', 'camisa', 'calça', 'calca', 'casaco', 'compras', 'luxo', 'shopping', 'presente', 'joia', 'relógio', 'relogio', 'perfume', 'cosmético', 'cosmetico', 'maquiagem', 'salão', 'salao', 'barbearia', 'diversão', 'diversao', 'rolê', 'role', 'passeio', 'curtição', 'curticao', 'balada', 'pub', 'whisky', 'vinho']
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
};

const SmartParser = {
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

    parse(text, customCategories = global_categories) {
        if (!text || text.trim().length < 2) return null;
        if (text.includes('?')) return null;

        let workingText = text.trim();
        const cleanText = workingText.toLowerCase();

        // 1. Extract Value
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

        // 2. Identify Type
        let tipo = 'saida';
        const isTransfer = this.keywords.transfer.some(k => {
            const regex = new RegExp('\\b' + k + '\\b', 'i');
            return regex.test(cleanText);
        });
        
        const isIncome = this.keywords.income.some(k => {
            const regex = new RegExp('\\b' + k + '\\b', 'i');
            return regex.test(cleanText);
        }) || 
        (/\brecebi\b/i.test(cleanText) && !/\bnão recebi\b/i.test(cleanText)) ||
        (/\bpix\b/i.test(cleanText) && (/\brecebido\b/i.test(cleanText) || /\bcrédito\b/i.test(cleanText)));

        if (isTransfer) {
            tipo = 'transferencia';
        } else if (isIncome) {
            tipo = 'entrada';
        }

        // 3. Extract Description
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
            .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '');

        const splitRegex = /(?:metade|divide|dividir|meio|parte)\s+(?:é|com|pro|pra|do|da|de)?\s+([A-Z][a-zà-ÿ]+)/i;
        descText = descText.replace(splitRegex, '');

        let descWords = descText.split(/\s+/)
            .map(w => w.replace(/[,.:;()]/g, '').trim())
            .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()));

        let descricao = descWords.slice(0, 4).join(' ');

        if (descricao) {
            descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);
        } else {
            descricao = tipo === 'entrada' ? 'Receita Recebida' : 'Despesa Lançada';
        }

        // 5. Dynamic Category Matching Logic
        let bestCategoryObj = null;
        let highestScore = -1;

        if (customCategories.length > 0) {
            customCategories.forEach(cat => {
                const catNameLower = cat.nome.toLowerCase();
                let score = 0;

                // Word boundary check for direct category name reference
                const catNameRegex = new RegExp('\\b' + catNameLower + '\\b', 'i');
                if (catNameRegex.test(cleanText)) {
                    score += 50;
                }

                // Score against concepts
                for (const [conceptKey, conceptData] of Object.entries(categoryConcepts)) {
                    const isMatch = conceptData.names.some(n => catNameLower.includes(n));
                    if (isMatch) {
                        conceptData.keywords.forEach(k => {
                            const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                            if (wordRegex.test(cleanText)) {
                                score += 15;
                            }
                        });

                        conceptData.keywords.forEach(k => {
                            const wordRegex = new RegExp('\\b' + k + '\\b', 'i');
                            if (wordRegex.test(descricao.toLowerCase())) {
                                score += 25;
                            }
                        });
                    }
                }

                // Check direct word matches in category name
                const words = catNameLower.split(/\s+/).filter(w => w.length > 2);
                words.forEach(w => {
                    const wRegex = new RegExp('\\b' + w + '\\b', 'i');
                    if (wRegex.test(cleanText)) score += 20;
                });

                if (score > highestScore) {
                    highestScore = score;
                    bestCategoryObj = cat;
                }
            });
        }

        // Resolve Final Categoria ID and Nome
        let categoryId = null;
        let categoria_nome = 'Geral';

        if (bestCategoryObj && highestScore > 0) {
            categoryId = bestCategoryObj.id;
            categoria_nome = bestCategoryObj.nome;
        } else if (customCategories.length > 0) {
            // Perfect Graceful Fallback:
            // Check if they have an 'Outros' or 'Geral' or 'Lazer' category
            const fallbackCat = customCategories.find(c => {
                const name = c.nome.toLowerCase();
                return name.includes('outro') || name.includes('geral') || name.includes('lazer');
            }) || customCategories[0]; // Otherwise first category in database!
            
            categoryId = fallbackCat.id;
            categoria_nome = fallbackCat.nome;
        }

        return {
            valor,
            tipo,
            descricao,
            categoria_nome,
            categoria_id: categoryId
        };
    }
};

console.log("=== RUNNING PARSER WITH CUSTOM 'COMPRAS E LUXO' CATEGORY ===");
const phrase = "comprei uma roupa por 50 reais";
const result = SmartParser.parse(phrase);
console.log(`\nText: "${phrase}"`);
console.log(`- Parsed Valor: R$ ${result.valor}`);
console.log(`- Parsed Tipo: ${result.tipo}`);
console.log(`- Parsed Descrição: "${result.descricao}"`);
console.log(`- Parsed Categoria Nome: "${result.categoria_nome}"`);
console.log(`- Parsed Categoria ID: ${result.categoria_id}`);
