/* js/enhancements.js - OCR & Heatmap Logic */

/**
 * OCR: Processamento de Comprovantes
 */
async function handleOCR(file) {
    if (!file) return;

    showToast('Iniciando escaneamento... 🤖', 'info');
    
    // Feedback visual de carregamento no botão
    const btn = document.getElementById('btn-magic-scan');
    const originalContent = btn ? btn.innerHTML : '';
    if (btn) {
        btn.classList.add('loading-ocr');
        btn.disabled = true;
    }

    try {
        const worker = await Tesseract.createWorker('por'); // Português
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        console.log('Texto extraído:', text);
        const linhas = text.split('\n').filter(l => l.trim().length > 0);
 
        // Lógica simples de extração de valor (Regex para R$ ou números com vírgula)
        const valorRegex = /(?:R\$|TOTAL|VALOR|PAGAR)\s*[:\s]*([\d.,]+)/i;
        const match = text.match(valorRegex);

        if (match) {
            let valor = match[1].replace(/\./g, '').replace(',', '.');
            const magicInput = document.getElementById('magic-input');
            if (magicInput) {
                magicInput.value = `Gastei ${valor} em ${linhas[0]?.substring(0, 20) || 'Compra'}`;
                magicInput.focus();
                // Disparar input para o preview atualizar
                magicInput.dispatchEvent(new Event('input'));
            }
            showToast('Dados extraídos para o Magic Input!', 'success');
        } else {
            showToast('Não consegui ler o valor, mas tentei! 😅', 'warning');
        }

    } catch (error) {
        console.error('Erro no OCR:', error);
        showToast('Falha ao processar imagem.', 'error');
    } finally {
        if (btn) {
            btn.classList.remove('loading-ocr');
            btn.disabled = false;
        }
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
        days.push(d.toLocaleDateString('en-CA'));
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

/**
 * Configura os ouvintes de eventos para as melhorias (OCR e Geo)
 */
function setupEnhancementListeners(userId) {
    // 1. Ouvinte para o botão de Magic Scan (OCR)
    const btnScan = document.getElementById('btn-magic-scan');
    const fileInput = document.getElementById('magic-scan-input');

    if (btnScan && fileInput) {
        btnScan.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleOCR(file);
        });
    }

    // 2. Ouvinte para Geolocalização (Sugestões de Contexto)
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`C.A.S.H. Unit: Localização detectada (${latitude}, ${longitude})`);
            
            // Aqui poderíamos chamar uma API de Reverse Geocoding ou buscar estabelecimentos próximos salvos
            // Por enquanto, vamos apenas atualizar o estado para o SmartParser usar
            window._currentLocation = { lat: latitude, lon: longitude };
            
            // Se o SmartParser estiver disponível, atualizamos as sugestões
            if (typeof updateMagicSuggestions === 'function') {
                updateMagicSuggestions();
            }
        }, (error) => {
            console.warn('C.A.S.H. Unit: Permissão de GPS negada ou falhou.', error.message);
        });
    }
}

// Hook na inicialização do dashboard (main.js chamará isso)
function initEnhancements(userId) {
    setupEnhancementListeners(userId);
    // Renderizar heatmap inicial se houver dados
    if (window._allTransactions) {
        renderHeatmap(window._allTransactions);
    }
}
