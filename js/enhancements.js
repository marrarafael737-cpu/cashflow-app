/* js/enhancements.js - OCR & Heatmap Logic */

/**
 * OCR: Processamento de Comprovantes
 */
async function handleOCR(file, target = 'magic') {
    if (!file) return;

    showToast('Iniciando escaneamento... 🤖', 'info');
    
    // Feedback visual de carregamento no botão
    const btnId = target === 'modal' ? 'btn-ocr-trigger' : 'btn-magic-scan';
        const btn = document.getElementById(btnId);
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

        if (text) {
            // Inteligência Zero-Click: Processa o texto extraído diretamente
            const result = await SmartNLP.processOCR(text);
            
            if (result && result.type === 'transaction') {
                const parsed = result.data;
                if (target === 'modal') {
                    const descInput = document.getElementById('descricao');
                    const valInput = document.getElementById('valor');
                    if (descInput) descInput.value = parsed.descricao || '';
                    if (valInput) valInput.value = parsed.valor || '';
                    if (typeof window.showToast === 'function') window.showToast('Comprovante lido! Verifique os dados.', 'success');
                } else {
                    const magicInput = document.getElementById('magic-input');
                
                if (magicInput) {
                    // Preenche o input para visibilidade
                    magicInput.value = `Gastei ${parsed.valor} em ${parsed.descricao}`;
                    magicInput.focus();
                    
                    // Atualiza o preview de inteligência automaticamente
                    if (typeof window.updateMagicPreview === 'function') {
                        window.updateMagicPreview(parsed);
                    }
                }
                
                showToast('Mágica! Dados extraídos do comprovante. 📸', 'success');
                }
                
                // Feedback de voz opcional se habilitado
                if (window.VoiceEngine) {
                    window.VoiceEngine.speak(`Entendi! Um gasto de ${parsed.valor} reais em ${parsed.descricao}. Quer que eu salve?`);
                }
            } else {
                showToast('Não identifiquei valores claros, mas o texto está no input! 😅', 'warning');
            }
        } else {
            showToast('Não consegui ler o comprovante.', 'warning');
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

    // 2. Ouvinte para o Microfone (Web Speech API)
    const btnVoice = document.getElementById('btn-magic-voice');
    if (btnVoice) {
        btnVoice.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                showToast('Seu navegador não suporta reconhecimento de voz.', 'error');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            btnVoice.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            btnVoice.style.color = '#ff4444';
            showToast('Ouvindo... Fale o seu gasto.', 'info');

            recognition.start();

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const magicInput = document.getElementById('magic-input');
                if (magicInput) {
                    magicInput.value = transcript;
                    showToast('Áudio capturado com sucesso! ✨', 'success');
                }
            };

            recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz', event.error);
                if (event.error !== 'aborted') {
                    showToast('Erro no microfone: ' + event.error, 'error');
                }
            };

            recognition.onend = () => {
                btnVoice.style.backgroundColor = 'rgba(255, 122, 0, 0.15)';
                btnVoice.style.color = 'var(--color-primary)';
            };
        });
    }

    // 3. Ouvinte para Geolocalização (Sugestões de Contexto)
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
