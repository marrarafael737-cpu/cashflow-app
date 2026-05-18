/* js/enhancements.js - OCR & Heatmap Logic */

/**
 * Redimensiona e pré-processa a imagem para otimizar o uso de memória em celulares
 * e melhorar significativamente a precisão do OCR (limita a 1000px e aplica escala de cinza/contraste).
 * Isso evita totalmente o crash do Web Worker por falta de RAM no iOS Safari e Android.
 */
function preprocessImage(file) {
    return new Promise((resolve) => {
        // Use URL.createObjectURL instead of FileReader to save massive RAM on mobile devices (e.g. iPhone)
        let objectUrl;
        try {
            objectUrl = URL.createObjectURL(file);
        } catch (err) {
            console.warn("C.A.S.H. Unit OCR: URL.createObjectURL falhou, usando FileReader.", err);
            // Fallback gracefully
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = Math.min(800, img.width);
                    canvas.height = img.height * (canvas.width / img.width);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.85);
                };
                img.onerror = () => resolve(file);
                img.src = event.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
            return;
        }

        const img = new Image();
        img.onload = () => {
            try {
                // Free the blob memory reference immediately
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Limit maximum dimension to 800px for guaranteed memory safety on iOS Safari/Chrome Android
                const MAX_DIM = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                // Apply mild grayscale and contrast boost for OCR accuracy
                try {
                    const imgData = ctx.getImageData(0, 0, width, height);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        let v = brightness;
                        if (brightness < 120) {
                            v = Math.max(0, brightness * 0.7); // Darken darks
                        } else {
                            v = Math.min(255, brightness * 1.2); // Lighten lights
                        }
                        data[i] = v;     // R
                        data[i + 1] = v; // G
                        data[i + 2] = v; // B
                    }
                    ctx.putImageData(imgData, 0, 0);
                } catch (e) {
                    console.warn("C.A.S.H. Unit OCR: Falha ao aplicar filtro de contraste. Usando imagem redimensionada.", e);
                }

                canvas.toBlob((blob) => {
                    resolve(blob || file);
                }, 'image/jpeg', 0.85);
            } catch (err) {
                console.error("C.A.S.H. Unit OCR Preprocessing Exception:", err);
                resolve(file); // Critical fallback: resolve with raw file if processing errors out
            }
        };

        img.onerror = (err) => {
            console.error("C.A.S.H. Unit OCR: Erro ao carregar imagem no elemento Image:", err);
            if (objectUrl) {
                try { URL.revokeObjectURL(objectUrl); } catch(e){}
            }
            resolve(file); // Fallback to raw file
        };

        img.src = objectUrl;
    });
}

/**
 * OCR: Processamento de Comprovantes
 */
async function handleOCR(file, target = 'magic') {
    if (!file) return;

    showToast('Iniciando escaneamento... 🤖', 'info');
    
    // Feedback visual de carregamento no botão
    const btnId = target === 'modal' ? 'btn-ocr-trigger' : 'btn-magic-scan';
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.add('loading-ocr');
        btn.disabled = true;
    }

    try {
        // 1. Pré-processa e reduz o tamanho da foto tirada pela câmera para evitar crash no iOS/Android
        showToast('Otimizando imagem para o celular... 📸', 'info');
        const preprocessedFile = await preprocessImage(file);

        showToast('Extraindo texto do cupom... 📝', 'info');
        const worker = await Tesseract.createWorker('por'); // Português
        const { data: { text } } = await worker.recognize(preprocessedFile);
        await worker.terminate();

        console.log('Texto extraído:', text);
        
        if (text && text.trim().length > 0) {
            // Inteligência Zero-Click: Processa o texto extraído diretamente
            const result = await SmartNLP.processOCR(text);
            
            if (result && result.type === 'transaction') {
                const parsed = result.data;
                if (target === 'modal') {
                    const descInput = document.getElementById('descricao');
                    const valInput = document.getElementById('valor');
                    if (descInput) descInput.value = parsed.descricao || '';
                    if (valInput) valInput.value = parsed.valor || '';
                    if (typeof window.showToast === 'function') window.showToast('Comprovante lido com sucesso! 🎉', 'success');
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
                showToast('Não identifiquei valores claros, tente preencher manualmente! 😅', 'warning');
            }
        } else {
            showToast('Não consegui ler nenhum texto legível no comprovante.', 'warning');
        }

    } catch (error) {
        console.error('Erro no OCR:', error);
        showToast('Falha ao processar imagem. Verifique a iluminação do comprovante.', 'error');
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

    // 2. Ouvinte para o Microfone (Web Speech API - iOS and Android Optimized)
    const btnVoice = document.getElementById('btn-magic-voice');
    if (btnVoice) {
        let isListening = false;
        btnVoice.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                showToast('Seu navegador não suporta reconhecimento de voz.', 'error');
                return;
            }

            // Cancela síntese de voz ativa para liberar hardware de gravação no iOS/Android
            if (window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch(e){}
            }

            // Se já estiver ouvindo, para gentilmente
            if (isListening && window._cashflowSpeechRecognition) {
                try {
                    window._cashflowSpeechRecognition.stop();
                } catch(e){}
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            // Hack crítico para iOS/Safari: Salva a instância no escopo global para impedir
            // que ela seja coletada pelo garbage collector no meio da gravação
            window._cashflowSpeechRecognition = recognition;
            
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.continuous = false;

            // Feedback tátil instantâneo no celular
            if (window.navigator && window.navigator.vibrate) {
                try { window.navigator.vibrate(15); } catch(e){}
            }

            recognition.onstart = () => {
                isListening = true;
                btnVoice.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                btnVoice.style.color = '#ff4444';
                btnVoice.classList.add('listening');
                showToast('Ouvindo... Fale agora! 🎙️', 'info');
            };

            recognition.onresult = (event) => {
                if (event.results && event.results[0] && event.results[0][0]) {
                    const transcript = event.results[0][0].transcript;
                    const magicInput = document.getElementById('magic-input');
                    if (magicInput) {
                        magicInput.value = transcript;
                        magicInput.dispatchEvent(new Event('input')); // Dispara o preview de inteligência automaticamente
                        showToast('Entendido! Processando... ✨', 'success');
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('C.A.S.H. Unit SpeechError:', event.error);
                if (event.error === 'not-allowed') {
                    showToast('Permissão de microfone negada ou bloqueada. Ative nas configurações do aparelho!', 'error');
                } else if (event.error !== 'aborted') {
                    showToast('Erro no microfone: ' + event.error, 'error');
                }
            };

            recognition.onend = () => {
                isListening = false;
                btnVoice.style.backgroundColor = 'rgba(255, 122, 0, 0.15)';
                btnVoice.style.color = 'var(--color-primary)';
                btnVoice.classList.remove('listening');
            };

            try {
                recognition.start();
            } catch(e) {
                console.error("C.A.S.H. Unit Voice Start Error:", e);
                showToast("Erro ao ligar o microfone.", "error");
            }
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
