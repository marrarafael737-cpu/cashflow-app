// ofxParser.js
// Utilitário simples para extrair transações de um arquivo OFX
// Nota: O formato OFX varia bastante de banco para banco (Nubank, Itaú, Inter),
// mas no geral eles seguem a estrutura de blocos <STMTTRN>.

export const parseOFX = (ofxString) => {
  const transactions = [];
  
  // Dividir o texto em blocos de transação
  // Procura por blocos que começam com <STMTTRN> e terminam com </STMTTRN>
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmttrnRegex.exec(ofxString)) !== null) {
    const trnBlock = match[1];

    // Extrair o tipo
    const typeMatch = trnBlock.match(/<TRNTYPE>(.+)/);
    // Extrair o valor
    const amtMatch = trnBlock.match(/<TRNAMT>([\-\d\.]+)/);
    // Extrair a descrição (pode estar em MEMO ou NAME dependendo do banco)
    let descMatch = trnBlock.match(/<MEMO>(.+)/);
    if (!descMatch) {
      descMatch = trnBlock.match(/<NAME>(.+)/);
    }
    // Extrair a data (formato YYYYMMDDHHMMSS)
    const dateMatch = trnBlock.match(/<DTPOSTED>([\d]{8})/);

    if (amtMatch) {
      const amount = parseFloat(amtMatch[1]);
      const description = descMatch ? descMatch[1].trim() : 'Despesa Não Identificada';
      let date = new Date().toISOString();

      if (dateMatch) {
        const dStr = dateMatch[1];
        const year = dStr.substring(0, 4);
        const month = dStr.substring(4, 6);
        const day = dStr.substring(6, 8);
        date = `${year}-${month}-${day}T12:00:00.000Z`;
      }

      transactions.push({
        id: Math.random().toString(36).substring(2, 11),
        type: amount < 0 ? 'expense' : 'income',
        amount: Math.abs(amount),
        description: description,
        category: '', // Será preenchido pelo Machine Learning
        date: date,
        source: 'ofx',
      });
    }
  }

  return transactions;
};
