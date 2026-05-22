
const SmartParser = {
    keywords: {
        expense: ['compra aprovada', 'pagamento realizado', 'saída de'],
        income: ['recebido', 'pix recebido', 'transferência recebida', 'depósito'],
        transfer: ['entre contas']
    },
    parse(text) {
        if (!text || text.trim().length < 5) return null;
        const cleanText = text.toLowerCase();
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
        return { valor };
    }
};

console.log('Test 1: "Gastei 50 no almoço" ->', SmartParser.parse("Gastei 50 no almoço"));
console.log('Test 2: "recebi 5000 de salario" ->', SmartParser.parse("recebi 5000 de salario"));
console.log('Test 3: "compra de 12,50 no mcdonalds" ->', SmartParser.parse("compra de 12,50 no mcdonalds"));
console.log('Test 4: "R$ 100,00 pro churrasco" ->', SmartParser.parse("R$ 100,00 pro churrasco"));
