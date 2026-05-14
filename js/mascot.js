/* js/mascot.js - C.A.S.H. Unit Logic & Interactions */
let _mascotLoaded = false;

async function loadMascotSVG() {
    const container = document.getElementById('mascot-svg-container');
    if (!container) return;

    try {
        const response = await fetch('assets/mascot.svg');
        if (!response.ok) throw new Error('SVG not found');
        const svgText = await response.text();
        container.innerHTML = svgText;
        _mascotLoaded = true;
        console.log('C.A.S.H. Unit: Assets carregados com sucesso.');
        
        // Se o GSAP já estiver pronto, podemos reinicializar se necessário
        // Mas o main.js garante a ordem
    } catch (error) {
        console.error('C.A.S.H. Unit: Falha ao carregar assets externos.', error);
        // Fallback or error message
        container.innerHTML = `<span style="font-size: 10px; color: var(--color-danger)">Erro Asset</span>`;
    }
}

function initMascotInteractions() {
    const trigger = document.getElementById('mascot-trigger');
    const modal = document.getElementById('modal-briefing');
    const closeBtns = document.querySelectorAll('.btn-close-briefing, #btn-close-briefing-footer');

    if (trigger && modal) {
        trigger.addEventListener('click', () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(trigger, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
            }
            openMascotBriefing();
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
    });

    // Fechar Card de Dica
    const tipClose = document.querySelector('.tip-close');
    const tipCard = document.querySelector('.mascot-speech-bubble');
    if (tipClose && tipCard) {
        tipClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            tipCard.classList.remove('active');
            console.log('C.A.S.H. Unit: Speech bubble closed by user.');
        });
    }
}

let _mascotCtx;

function initMascotGSAP() {
    if (typeof gsap === 'undefined' || !_mascotLoaded) return;

    if (_mascotCtx) _mascotCtx.revert();

    _mascotCtx = gsap.context(() => {
        // Floating Animation
        gsap.to("#mascot-svg-container", {
            y: -15,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });
        
        // Draggable Logic (Somente se NÃO estiver integrado na sidebar)
        const trigger = document.getElementById('mascot-trigger');
        if (typeof Draggable !== 'undefined' && trigger && !trigger.classList.contains('sidebar-integrated')) {
            Draggable.create("#mascot-trigger", {
                type: "x,y",
                edgeResistance: 0.65,
                bounds: window,
                inertia: true,
                onDragStart: function() {
                    showMascotMessage("Ei! Aonde você está me levando?", "eyes", "", "happy");
                }
            });
        }

        // Eye Tracking
        const moveEyes = (e) => {
            const mascot = document.getElementById('mascot-trigger');
            if (!mascot) return;
            const rect = mascot.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const distance = Math.min(4, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 60);

            gsap.to(".eye-group", {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                duration: 0.4
            });
        };

        window.addEventListener("mousemove", moveEyes);
        
        // Return cleanup for the listener
        return () => window.removeEventListener("mousemove", moveEyes);
    });
}



function updateMascotExpression(state) {
    const eyeLeft = document.getElementById('eye-left');
    const eyeRight = document.getElementById('eye-right');
    if (!eyeLeft || !eyeRight || typeof gsap === 'undefined') return;

    const paths = {
        neutral: { l: "M82 72 L94 72", r: "M106 72 L118 72" },
        happy: { l: "M82 72 Q88 65 94 72", r: "M106 72 Q112 65 118 72" },
        angry: { l: "M82 65 L94 75", r: "M106 75 L118 65" },
        sad: { l: "M82 75 Q88 85 94 75", r: "M106 75 Q112 85 118 75" }
    };

    const target = paths[state] || paths.neutral;
    gsap.to(eyeLeft, { attr: { d: target.l }, duration: 0.3 });
    gsap.to(eyeRight, { attr: { d: target.r }, duration: 0.3 });
}

function initMascotTips() {
    const tips = [
        "Economizar é a arte de escolher o que você quer mais no futuro.",
        "Sua reserva de emergência é sua melhor amiga.",
        "Já conferiu seus orçamentos hoje?",
        "O C.A.S.H. Unit está de olho nos seus cafezinhos!",
        "Investir R$ 100 hoje vale mais do que R$ 200 amanhã."
    ];
    if (!tips || tips.length === 0) return;
    const tip = tips[Math.floor(Math.random() * tips.length)];
    showMascotMessage(tip);
}

function updateMascotInsight(transactions) {
    if (!transactions.length) return;
    // Lógica simplificada de insight
    showMascotMessage("Analisando seus dados... Tudo sob controle!", "eyes", "", "happy");
}

function openMascotBriefing() {
    const modal = document.getElementById('modal-briefing');
    const content = document.getElementById('briefing-content');
    const dateEl = document.getElementById('briefing-date');
    
    if (!modal || !content) return;

    // Set Date
    const now = new Date();
    if (dateEl) dateEl.textContent = `Resumo de ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;

    // Generate Briefing Items
    let html = '';
    
    // 1. Saldo Atual
    const balance = typeof calculateGlobalBalance === 'function' ? calculateGlobalBalance() : 0;
    html += `
        <div class="briefing-item">
            <div class="briefing-icon">💰</div>
            <div class="briefing-text">
                <h3>Saldo Disponível</h3>
                <p>Seu fôlego financeiro atual é de <strong>${typeof formatar === 'function' ? formatar(balance) : balance}</strong>.</p>
            </div>
        </div>
    `;

    // 2. Gastos de Hoje
    const today = now.toLocaleDateString('en-CA');
    const todayTransactions = (typeof _allTransactions !== 'undefined') ? _allTransactions.filter(t => t.data === today && t.tipo === 'saida') : [];
    const todayTotal = todayTransactions.reduce((acc, t) => acc + parseFloat(t.valor), 0);
    
    if (todayTotal > 0) {
        html += `
            <div class="briefing-item">
                <div class="briefing-icon">💸</div>
                <div class="briefing-text">
                    <h3>Gastos de Hoje</h3>
                    <p>Você já utilizou <strong>${typeof formatar === 'function' ? formatar(todayTotal) : todayTotal}</strong> hoje. Mantenha o foco!</p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="briefing-item">
                <div class="briefing-icon">🎯</div>
                <div class="briefing-text">
                    <h3>Dia de Foco</h3>
                    <p>Nenhum gasto registrado hoje. Excelente autocontrole, humano!</p>
                </div>
            </div>
        `;
    }

    // 3. Status de Orçamentos
    const activeBudgets = (typeof _budgets !== 'undefined') ? _budgets.filter(b => b.mes === (now.getMonth() + 1)) : [];
    if (activeBudgets.length > 0) {
        const overBudget = activeBudgets.some(b => {
            const spent = _allTransactions.filter(t => t.categoria_id === b.categoria_id && t.tipo === 'saida').reduce((acc, t) => acc + parseFloat(t.valor), 0);
            return spent > b.valor_limite;
        });

        html += `
            <div class="briefing-item">
                <div class="briefing-icon">${overBudget ? '⚠️' : '✅'}</div>
                <div class="briefing-text">
                    <h3>Orçamentos</h3>
                    <p>${overBudget ? 'Detectei categorias que ultrapassaram o limite. Recomendo ajuste!' : 'Todos os seus orçamentos mensais estão dentro do planejado.'}</p>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('active'); }, 10);
}

let _tourStep = 0;
const _tourData = [
    { 
        target: null, 
        msg: "Olá! Eu sou o Cashy, seu copiloto financeiro. 🤖 Vou te mostrar como dominar suas finanças em 1 minuto!", 
        expr: "happy" 
    },
    { 
        target: ".hero-balance", 
        msg: "Este é o seu Saldo Real. Ele consolida tudo o que você tem em todas as suas contas.", 
        expr: "neutral" 
    },
    { 
        target: ".sidebar-nav [data-target='wallets']", 
        msg: "Aqui você cadastra seus bancos e carteiras. Comece por aqui para ter um saldo preciso!", 
        expr: "happy" 
    },
    { 
        target: "#btn-new-transaction", 
        msg: "O coração do app! Use este botão para lançar seus gastos. Quanto mais você lança, mais eu aprendo sobre você.", 
        expr: "neutral" 
    },
    { 
        target: ".sidebar-nav [data-target='goals']", 
        msg: "Tem um sonho? 🎯 Crie uma meta aqui e eu calcularei exatamente quanto você precisa poupar por mês.", 
        expr: "happy" 
    },
    { 
        target: "#oracle-section", 
        msg: "Meu sistema de análise avançada. Aqui eu te dou notas e dicas reais baseadas no seu comportamento.", 
        expr: "neutral" 
    },
    { 
        target: null, 
        msg: "Tudo pronto! Se precisar de mim, é só clicar no meu ícone ou no botão de ajuda. Vamos prosperar? 🚀", 
        expr: "happy" 
    }
];

function startMascotTour(userId) {
    _tourStep = 0;
    const container = document.getElementById('mascot-trigger');
    const actions = document.getElementById('mascot-speech-actions');
    const nextBtn = document.getElementById('btn-mascot-next');
    const overlay = document.getElementById('onboarding-overlay');

    if (!container || !actions || !nextBtn) return;

    if (overlay) overlay.classList.add('active');
    actions.style.display = 'flex';
    container.classList.add('in-tour'); 
    
    const runStep = () => {
        const step = _tourData[_tourStep];
        if (!step) {
            endTour(userId);
            return;
        }

        // Highlight target
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                targetEl.classList.add('onboarding-highlight');
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Mascot feedback
        if (typeof gsap !== 'undefined') {
            gsap.to(container, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
        }

        showMascotMessage(step.msg, 'eyes', '', step.expr || 'happy', true);
    };

    nextBtn.onclick = (e) => {
        e.stopPropagation();
        _tourStep++;
        runStep();
    };

    runStep();
}

function endTour(userId) {
    const actions = document.getElementById('mascot-speech-actions');
    const container = document.getElementById('mascot-trigger');
    const overlay = document.getElementById('onboarding-overlay');
    
    if (actions) actions.style.display = 'none';
    if (container) container.classList.remove('in-tour');
    if (overlay) overlay.classList.remove('active');
    
    // Clean up all highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    if (typeof gsap !== 'undefined' && container && !container.classList.contains('sidebar-integrated')) {
        gsap.to(container, { x: 0, y: 0, duration: 1, ease: "back.out(1.7)" });
    }
    
    // Save completion status to prevent auto-start next time
    if (userId) {
        localStorage.setItem(`tour_completed_${userId}`, 'true');
        console.log(`C.A.S.H. Unit: Tour completed for user ${userId}.`);
    }
    
    showMascotMessage("Tour finalizado! Agora é com você, humano. Boa sorte!", "eyes", "", "happy");
}

let _mascotMessageTimeout = null;

function showMascotMessage(text, visorMode = 'eyes', visorValue = '', expression = 'neutral', persistent = false) {
    const msgEl = document.getElementById('mascot-message');
    const container = document.getElementById('mascot-trigger');
    if (!msgEl || !container) return;

    if (_mascotMessageTimeout) clearTimeout(_mascotMessageTimeout);

    msgEl.innerHTML = text;
    container.classList.add('active');

    // Update Visor Mode
    const eyes = document.getElementById('visor-eyes');
    const numbers = document.getElementById('visor-numbers');
    const alertLayer = document.getElementById('visor-alert');

    if (eyes) eyes.style.display = visorMode === 'eyes' ? 'block' : 'none';
    if (numbers) numbers.style.display = visorMode === 'numbers' ? 'block' : 'none';
    if (alertLayer) alertLayer.style.display = visorMode === 'alert' ? 'block' : 'none';

    if (visorMode === 'numbers' && visorValue) {
        const valEl = document.getElementById('visor-amount');
        if (valEl) valEl.textContent = visorValue;
    }

    updateMascotExpression(expression);
    
    // Mostra o balão de fala
    const speechBubble = document.querySelector('.mascot-speech-bubble');
    if (speechBubble) speechBubble.classList.add('active');

    if (!persistent) {
        _mascotMessageTimeout = setTimeout(() => {
            if (!container.classList.contains('in-tour')) { 
                container.classList.remove('active');
                if (speechBubble) speechBubble.classList.remove('active');
                if (eyes) eyes.style.display = 'block';
                if (numbers) numbers.style.display = 'none';
                if (alertLayer) alertLayer.style.display = 'none';
                updateMascotExpression('neutral');
            }
        }, 8000);
    }
}
