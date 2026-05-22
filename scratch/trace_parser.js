// scratch/trace_parser.js
const fs = require('fs');
const path = require('path');

const parserFilePath = path.join(__dirname, '../js/smart-parser.js');
let parserContent = fs.readFileSync(parserFilePath, 'utf8');
parserContent = parserContent.replace('const SmartParser =', 'global.SmartParser =');

global.window = {};
global._categories = [
    { id: 'cat-1', nome: 'Alimentação', tipo: 'saida' },
    { id: 'cat-2', nome: 'Moradia', tipo: 'saida' },
    { id: 'cat-3', nome: 'Lazer', tipo: 'saida' },
    { id: 'cat-4', nome: 'Saúde', tipo: 'saida' },
    { id: 'cat-5', nome: 'Transporte', tipo: 'saida' },
    { id: 'cat-6', nome: 'Salário', tipo: 'entrada' },
    { id: 'cat-7', nome: 'Investimentos', tipo: 'entrada' }
];

eval(parserContent);

const text = "recebi meu salario de 3000";
console.log("Original text:", text);

let workingText = text.trim();
const cleanText = workingText.toLowerCase();

// 1. Value
const amountRegex = /(?:R\$|r\$|\$|reais|conto|pila)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:\.\d{2})?)(?!\/)(?:\s?(?:reais|conto|pila))?/i;
const amountMatch = workingText.match(amountRegex);
let valor = 0;
if (amountMatch) {
    valor = parseFloat(amountMatch[1].replace(',', '.'));
}
console.log("Parsed value:", valor);

// 2. Type
let tipo = 'saida';
if (cleanText.includes('recebi')) tipo = 'entrada';
console.log("Parsed type:", tipo);

// 3. Description Trace
let descricao = "Nova Transação";
const stopWords = ['no valor de', 'no valor', 'valor', 'em', 'da', 'do', 'de', 'na', 'no', 'para', 'com', 'realizada', 'realizado', 'aprovada', 'recebido', 'paguei', 'gastei', 'recebi', 'um', 'uma', 'compra', 'venda', 'pagamento', 'estabelecimento', 'sucesso', 'comprovante', 'autorizado', 'mensagem', 'alerta', 'banco', 'agencia', 'conta', 'cartão', 'final', 'vencimento', 'transação', 'efetuada', 'via', 'pix', 'reais', 'conto', 'pila'];

const patterns = [
    /(?:em|no|na|estabelecimento|para|de)\s+([^,.:;()0-9]+)/i,
    /aprovada\s+(?:no|na|em)\s+([^,.:;()0-9]+)/i,
    /recebido\s+de\s+([^,.:;()0-9]+)/i,
    /gastei\s+(?:no|na|em)?\s?([^,.:;()0-9]+)/i,
    /paguei\s+(?:no|na|em)?\s?([^,.:;()0-9]+)/i
];

for (const pattern of patterns) {
    const match = workingText.match(pattern);
    if (match && match[1]) {
        let candidate = match[1].trim();
        if (candidate.length > 2) {
            descricao = candidate;
            console.log(`Matched pattern ${pattern}: "${descricao}"`);
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
    console.log("After basic words fallback:", descricao);
}

// Cleanup Description
stopWords.forEach(sw => {
    const regexStart = new RegExp('^' + sw + '\\b\\s*', 'i');
    const regexEnd = new RegExp('\\s*\\b' + sw + '$', 'i');
    descricao = descricao.replace(regexStart, '').replace(regexEnd, '').trim();
});
console.log("After stopWords cleanup:", descricao);

if (descricao.length < 3 || descricao === "Nova Transação") {
    let textWithoutValue = workingText;
    if (amountMatch) textWithoutValue = textWithoutValue.replace(amountMatch[0], '');
    
    descricao = textWithoutValue.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase())).slice(0, 3).join(' ') || "Nova Transação";
    console.log("After length fallback:", descricao);
}

descricao = descricao
    .replace(/\b(hoje|ontem|amanhã|cedo|tarde|noite|agora|dia)\b/gi, '')
    .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
console.log("Final parsed description:", descricao);

// Category scoring trace
console.log("\n=== CATEGORY SCORING TRACE ===");
let bestCategory = 'Geral';
let highestScore = 0;
for (const [catName, data] of Object.entries(SmartParser.categoryMappings)) {
    let score = 0;
    data.keywords.forEach(k => { 
        if (cleanText.includes(k)) score += 10; 
    });
    
    data.keywords.forEach(k => { 
        if (descricao.toLowerCase().includes(k)) score += 15; 
    });

    data.context.forEach(c => { 
        if (cleanText.includes(c)) score += 5; 
    });

    console.log(`Category: ${catName}, Score: ${score}`);
}
