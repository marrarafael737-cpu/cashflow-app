/* js/enhancements.js - OCR & Heatmap Logic */

/**
 * OCR: Processamento de Comprovantes
 */
async function handleOCR(file) {
    if (!file) return;

    showToast('Iniciando escaneamento... 🤖', 'info');
    
    // Feedback visual de carregamento no botão
    const btn = document.getElementById('btn-ocr-trigger');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '⌛';
    btn.disabled = true;

    try {
        const worker = await Tesseract.createWorker('por'); // Português
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        console.log('Texto extraído:', text);

        // Lógica simples de extração de valor (Regex para R$ ou números com vírgula)
        const valorRegex = /(?:R\$|TOTAL|VALOR)\s*[:\s]*([\d.,]+)/i;
        const match = text.match(valorRegex);

        if (match) {
            let valor = match[1].replace(/\./g, '').replace(',', '.');
            document.getElementById('valor').value = valor;
            showToast('Valor extraído com sucesso!', 'success');
        } else {
            showToast('Não consegui ler o valor, mas tentei! 😅', 'warning');
        }

        // Tentar extrair descrição (primeira linha ou palavra chave)
        const linhas = text.split('\n').filter(l => l.trim().length > 3);
        if (linhas.length > 0) {
            document.getElementById('descricao').value = linhas[0].substring(0, 30);
        }

    } catch (error) {
        console.error('Erro no OCR:', error);
        showToast('Falha ao processar imagem.', 'error');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

/**
 * HEATMAP: Visualização de Intensidade
 */
function renderHeatmap(transactions) {
    const container = document.getElementById('finance-heatmap');
    if (!container) return;

    container.innerHTML = '';
    
    // Obter últimos 35 dias (5 semanas)
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    // Calcular gastos por dia
    const spendingPerDay = {};
    transactions.forEach(t => {
        if (t.tipo === 'saida') {
            spendingPerDay[t.data] = (spendingPerDay[t.data] || 0) + parseFloat(t.valor);
        }
    });

    // Encontrar o maior gasto para escala
    const maxSpending = Math.max(...Object.values(spendingPerDay), 100);

    days.forEach(date => {
        const amount = spendingPerDay[date] || 0;
        const intensity = amount === 0 ? 0 : Math.min(1, amount / (maxSpending * 0.7));
        
        const dayEl = document.createElement('div');
        dayEl.className = 'heatmap-day';
        dayEl.title = `${date}: R$ ${amount.toFixed(2)}`;
        
        // Cores baseadas no design system (variáveis de opacidade)
        if (amount > 0) {
            dayEl.style.backgroundColor = `rgba(0, 255, 122, ${0.2 + intensity * 0.8})`; // Verde neon
            dayEl.style.boxShadow = intensity > 0.6 ? `0 0 10px rgba(0, 255, 122, ${intensity})` : 'none';
        }

        container.appendChild(dayEl);
    });
}

// Hook na inicialização do dashboard (main.js chamará isso)
function initEnhancements(userId) {
    setupEnhancementListeners(userId);
    // Renderizar heatmap inicial se houver dados
    if (window._allTransactions) {
        renderHeatmap(_allTransactions);
    }
}
