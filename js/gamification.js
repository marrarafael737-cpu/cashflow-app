/* js/gamification.js - Level System, Badges & Financial Oracle */

let _userXP = 0;
let _userLevel = 1;
let _badges = {
    economyMaster: false,
    serialImporter: false,
    oracleApprentice: false,
    level5: false
};

async function initGamification(userId) {
    try {
        const savedXP = localStorage.getItem(`xp_${userId}`);
        if (savedXP) {
            _userXP = parseInt(savedXP);
            calculateLevel();
        }

        // Carregar conquistas salvas
        const savedBadges = localStorage.getItem(`badges_${userId}`);
        if (savedBadges) {
            _badges = JSON.parse(savedBadges);
        }

        updateMascotEvolutionUI();
        updateBadgesUI();
        setupPredictor(userId);
        setupShareSnapshot(userId);
    } catch (error) {
        console.error('Erro na gamificação:', error);
    }
}

async function addXP(amount) {
    if (amount <= 0) return;
    _userXP += amount;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        localStorage.setItem(`xp_${user.id}`, _userXP);
    }
    const leveledUp = calculateLevel();
    updateMascotEvolutionUI();
    checkBadges(user?.id);
    
    if (leveledUp && typeof showToast === 'function') {
        showToast(`Nível UP! C.A.S.H. Unit evoluiu para o Nível ${_userLevel}!`, 'success');
        if (typeof confetti === 'function') confetti();
    }
}

/**
 * Avalia o desempenho financeiro e concede XP/Badges
 */
function evaluateFinancialPerformance(summary) {
    const { totalReceita, totalDespesa, saldoMes } = summary;
    
    // 1. XP por Economia (Surplus)
    if (saldoMes > 1000) {
        if (!_badges.economyMaster) {
            unlockBadge('economyMaster');
        }
    }

    // 2. XP por Disciplina (Cumprir Orçamentos)
    // ... lógica existente ...
}

function calculateLevel() {
    const oldLevel = _userLevel;
    _userLevel = Math.floor(Math.sqrt(_userXP / 100)) + 1;
    return _userLevel > oldLevel;
}

function unlockBadge(badgeId) {
    if (_badges[badgeId]) return;
    _badges[badgeId] = true;
    
    const userId = supabase.auth.getUser().then(({data}) => {
        if (data.user) {
            localStorage.setItem(`badges_${data.user.id}`, JSON.stringify(_badges));
            updateBadgesUI();
            showToast(`Conquista Desbloqueada!`, 'success');
            if (typeof confetti === 'function') confetti();
        }
    });
}

function updateBadgesUI() {
    const countEl = document.getElementById('unlocked-badges-count');
    let unlockedCount = 0;

    Object.keys(_badges).forEach(key => {
        const id = `badge-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        const el = document.getElementById(id);
        if (el && _badges[key]) {
            el.classList.remove('locked');
            el.classList.add('unlocked');
            unlockedCount++;
        }
    });

    if (countEl) countEl.textContent = `${unlockedCount}/${Object.keys(_badges).length}`;
}

function checkBadges(userId) {
    if (_userLevel >= 5 && !_badges.level5) {
        unlockBadge('level5');
    }

    const importCount = parseInt(localStorage.getItem(`import_count_${userId}`) || '0');
    if (importCount >= 3 && !_badges.serialImporter) {
        unlockBadge('serialImporter');
    }

    const predictCount = parseInt(localStorage.getItem(`predict_count_${userId}`) || '0');
    if (predictCount >= 5 && !_badges.oracleApprentice) {
        unlockBadge('oracleApprentice');
    }
}

function updateMascotEvolutionUI() {
    const xpBar = document.getElementById('user-xp-bar');
    const xpText = document.getElementById('user-xp-text');
    const lvlBadges = [
        document.getElementById('user-level-badge'),
        document.getElementById('mascot-level-badge')
    ];
    const container = document.getElementById('mascot-trigger');

    if (!xpBar) return;

    const nextLevelXP = Math.pow(_userLevel, 2) * 100;
    const currentLevelXP = Math.pow(_userLevel - 1, 2) * 100;
    const range = nextLevelXP - currentLevelXP;
    const currentProgress = _userXP - currentLevelXP;
    const percent = (currentProgress / range) * 100;

    xpBar.style.width = `${Math.min(percent, 100)}%`;
    if (xpText) xpText.textContent = `${_userXP} XP (Lvl ${_userLevel})`;
    
    lvlBadges.forEach(badge => {
        if (badge) badge.textContent = `LVL ${_userLevel}`;
    });

    if (container) {
        const hue = (_userLevel - 1) * 30;
        container.style.filter = `hue-rotate(${hue}deg)`;
        if (_userLevel >= 5) {
            container.classList.add('evolved-glow');
        }
    }
}

/* --- SNAPSHOT DE PROGRESSO (ESTILO DUOLINGO) --- */

function setupShareSnapshot(userId) {
    const btn = document.getElementById('btn-share-snapshot');
    if (!btn) return;

    btn.addEventListener('click', () => {
        showSnapshotModal();
    });
}

function showSnapshotModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.style.zIndex = '10000';
    
    const balance = window._projectedBalance || 0;
    const name = document.getElementById('user-name-header')?.textContent || 'Usuário';

    modal.innerHTML = `
        <div class="snapshot-card card-glass animate-pop" style="max-width: 400px; padding: 2rem; text-align: center; border: 2px solid var(--color-primary);">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-primary); margin-bottom: 1rem;">Progresso Semanal</div>
            <div class="mascot-snapshot" style="font-size: 4rem; margin-bottom: 1.5rem;">🤖</div>
            <h2 style="margin: 0; font-size: 1.5rem;">${window.escapeHTML ? window.escapeHTML(name) : name}</h2>
            <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 2rem;">Nível ${_userLevel} • ${_userXP} XP</div>
            
            <div class="snapshot-stat" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Sobra Projetada</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-success);">${formatar(balance)}</div>
            </div>

            <div style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic; margin-bottom: 2rem;">
                "O Oráculo previu um futuro próspero para mim. E o seu?"
            </div>

            <div style="display: flex; gap: 1rem;">
                <button class="btn-primary-action" onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; background: var(--color-surface-secondary); border: 1px solid var(--color-border);">Fechar</button>
                <button class="btn-primary-action" onclick="window.print()" style="flex: 1;">Baixar Snapshot</button>
            </div>
            
            <div style="margin-top: 1.5rem; font-size: 0.6rem; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <span class="brand">Cash<span>Flow</span></span> • Inteligência Financeira
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function setupPredictor(userId) {
    const form = document.getElementById('predictor-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = document.getElementById('predict-item').value;
        const value = parseFloat(document.getElementById('predict-value').value);
        const resultDiv = document.getElementById('predictor-result');

        if (!value || isNaN(value)) return;

        // Incrementar contador de predições
        const count = parseInt(localStorage.getItem(`predict_count_${userId}`) || '0') + 1;
        localStorage.setItem(`predict_count_${userId}`, count);
        checkBadges(userId);

        const balance = window._projectedBalance || calculateGlobalBalance();
        const remaining = balance - value;
        
        let message = "";
        let type = "info";
        let mood = "neutral";

        const escapedItem = window.escapeHTML ? window.escapeHTML(item) : item;
        if (remaining < 0) {
            message = `Análise crítica: Comprar <strong>${escapedItem}</strong> destruirá sua reserva e te deixará com saldo NEGATIVO de ${formatar(Math.abs(remaining))}. Não recomendo.`;
            type = "danger";
            mood = "angry";
        } else if (value > (balance * 0.3)) {
            message = `Cuidado, humano. <strong>${escapedItem}</strong> consome mais de 30% da sua projeção mensal. Isso pode comprometer suas metas futuras.`;
            type = "warning";
            mood = "alert";
        } else {
            message = `Compra de <strong>${escapedItem}</strong> aprovada. Seu saldo projetado continuará saudável em ${formatar(remaining)}.`;
            type = "success";
            mood = "happy";
            addXP(10); // XP por simular compras seguras
        }

        resultDiv.innerHTML = `<p>${message}</p>`;
        resultDiv.style.display = 'block';
        resultDiv.className = `predictor-result border-${type}`;

        if (typeof showMascotMessage === 'function') {
            showMascotMessage(message, type, '', mood);
        }
    });
}

function calculateGlobalBalance() {
    if (typeof _contas === 'undefined') return 0;
    return _contas.reduce((acc, c) => acc + (parseFloat(c.saldo_inicial) || 0), 0) + 
           _allTransactions.reduce((acc, t) => acc + (t.tipo === 'entrada' ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
}
