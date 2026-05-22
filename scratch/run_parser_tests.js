// scratch/run_parser_tests.js
const fs = require('fs');
const path = require('path');

// Load smart-parser.js content
const parserFilePath = path.join(__dirname, '../js/smart-parser.js');
let parserContent = fs.readFileSync(parserFilePath, 'utf8');

// Replace const SmartParser with global.SmartParser
parserContent = parserContent.replace('const SmartParser =', 'global.SmartParser =');

// Mock browser globals
global.window = {};
global._categories = [
    { id: 'cat-1', nome: 'Alimentação', tipo: 'saida' },
    { id: 'cat-2', nome: 'Moradia', tipo: 'saida' },
    { id: 'cat-3', nome: 'Lazer', tipo: 'saida' },
    { id: 'cat-4', nome: 'Saúde', tipo: 'saida' },
    { id: 'cat-5', nome: 'Transporte', tipo: 'saida' },
    { id: 'cat-6', nome: 'Salário', tipo: 'entrada' },
    { id: 'cat-7', nome: 'Investimentos', tipo: 'entrada' },
    { id: 'cat-8', nome: 'Compras e Luxo', tipo: 'saida' }
];

// Evaluate the parser
eval(parserContent);

// Test phrases
const testPhrases = [
    "comprei uma roupa por 50 reais",
    "ifood de ontem deu 85 reais",
    "combustivel no posto 150 reais",
    "aluguel da casa 1200 reais",
    "recebi meu salario de 3000",
    "remédio na farmácia 45 reais"
];

console.log("=== RUNNING MAGIC INPUT DIAGNOSTICS ===");
testPhrases.forEach(phrase => {
    try {
        const result = global.SmartParser.parse(phrase);
        console.log(`\nText: "${phrase}"`);
        console.log(`- Parsed Valor: R$ ${result ? result.valor : 'null'}`);
        console.log(`- Parsed Tipo: ${result ? result.tipo : 'null'}`);
        console.log(`- Parsed Descrição: "${result ? result.descricao : 'null'}"`);
        console.log(`- Parsed Categoria Nome: "${result ? result.categoria_nome : 'null'}"`);
        console.log(`- Parsed Categoria ID: ${result ? result.categoria_id : 'null'}`);
    } catch (e) {
        console.error(`- Error parsing "${phrase}":`, e.stack);
    }
});
