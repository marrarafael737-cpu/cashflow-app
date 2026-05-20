/* js/gamification.js - Persistent Level System, Badges & Financial Oracle */

let _userXP = 0;
let _userLevel = 1;
let _badges = {
    economyMaster: false,
    serialImporter: false,
    oracleApprentice: false,
    level5: false
};

/**
 * Inicializa o sistema de gamificação buscando dados no Supabase.
 * Se não encontrar, tenta migrar do localStorage.
 */
async function initGamification(userId) {
    if (!userId) return;

    try {
        console.log('C.A.S.H. Unit: Inicializando Gamificação Persistente...');

        // 1. Tentar carregar do Supabase (user_profiles)
        const { data: profile, error: pError } = await supabase
            .from('user_profiles')
            .select('xp, level, import_count, predict_count')
            .eq('id', userId)
            .maybeSingle();

        // 2. Tentar carregar conquistas (user_badges)
        const { data: badgeRows, error: bError } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);

        if (pError || bError) {
            console.warn('C.A.S.H. Unit: Tabelas de gamificação não encontradas ou inacessíveis. Usando modo offline/local.');
            loadFromLocalStorage(userId);
        } else if (!profile) {
            // Usuário novo no banco, tentar migrar se houver algo local
            console.log('C.A.S.H. Unit: Perfil não encontrado no banco. Iniciando migração...');
            await migrateToSupabase(userId);
        } else {
            // Dados carregados com sucesso do Supabase
            _userXP = profile.xp || 0;
            _userLevel = profile.level || 1;

            // Marcar badges desbloqueadas
            if (badgeRows) {
                badgeRows.forEach(row => {
                    if (_badges.hasOwnProperty(row.badge_id)) {
                        _badges[row.badge_id] = true;
                    }
                });
            }
            console.log('C.A.S.H. Unit: Dados de gamificação carregados da nuvem.');
        }

        updateMascotEvolutionUI();
        updateBadgesUI();
        setupPredictor(userId);
        setupShareSnapshot(userId);
    } catch (error) {
        console.error('Erro na gamificação:', error);
        loadFromLocalStorage(userId); // Fallback de emergência
    }
}

function loadFromLocalStorage(userId) {
    const savedXP = localStorage.getItem(`xp_${userId}`);
    if (savedXP) {
        _userXP = parseInt(savedXP);
        calculateLevel();
    }

    const savedBadges = localStorage.getItem(`badges_${userId}`);
    if (savedBadges) {
        _badges = JSON.parse(savedBadges);
    }
}

async function migrateToSupabase(userId) {
    // Pegar dados locais
    const localXP = parseInt(localStorage.getItem(`xp_${userId}`) || '0');
    const localBadges = JSON.parse(localStorage.getItem(`badges_${userId}`) || '{}');
    const localImports = parseInt(localStorage.getItem(`import_count_${userId}`) || '0');
    const localPredicts = parseInt(localStorage.getItem(`predict_count_${userId}`) || '0');

    _userXP = localXP;
    calculateLevel();
    Object.assign(_badges, localBadges);

    try {
        // Criar perfil
        await supabase.from('user_profiles').upsert({
            id: userId,
            xp: localXP,
            level: _userLevel,
            import_count: localImports,
            predict_count: localPredicts,
            updated_at: new Date().toISOString()
        });

        // Criar badges
        const badgesToInsert = Object.keys(_badges)
            .filter(id => _badges[id])
            .map(id => ({ user_id: userId, badge_id: id }));

        if (badgesToInsert.length > 0) {
            await supabase.from('user_badges').insert(badgesToInsert);
        }

        console.log('C.A.S.H. Unit: Migração concluída com sucesso.');
    } catch (err) {
        console.error('Falha na migração para Supabase:', err);
    }
}

async function addXP(amount) {
    if (amount <= 0) return;
    _userXP += amount;

    const leveledUp = calculateLevel();
    updateMascotEvolutionUI();

    // Persistência Híbrida
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        localStorage.setItem(`xp_${user.id}`, _userXP);

        // Update Supabase in background
        supabase.from('user_profiles')
            .update({ xp: _userXP, level: _userLevel, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .then(({ error }) => {
                if (error) console.warn('Erro ao persistir XP na nuvem:', error.message);
            });

        checkBadges(user.id);
    }

    if (leveledUp && typeof showToast === 'function') {
        showToast(`Nível UP! C.A.S.H. Unit evoluiu para o Nível ${_userLevel}!`, 'success');
        if (typeof confetti === 'function') confetti();
    }
}

/**
 * Avalia o desempenho financeiro e concede XP/Badges
 */
function evaluateFinancialPerformance(summary) {
    if (!summary) return;

    const allTxs = window._allTransactions || [];
    const transactionCount = allTxs.length;
    const hasExpenses = allTxs.some(t => t.tipo === 'saida');
    const income = summary.receitas || 0;
    const savingsRate = income > 0 ? (summary.saldoMes / income) : 0;

    if (summary.saldoMes > 1000 && transactionCount >= 5 && hasExpenses && savingsRate > 0.1) {
        if (!_badges.economyMaster) {
            unlockBadge('economyMaster');
        }
    }
}

function calculateLevel() {
    const oldLevel = _userLevel;
    _userLevel = Math.floor(Math.sqrt(_userXP / 100)) + 1;
    return _userLevel > oldLevel;
}

async function unlockBadge(badgeId) {
    if (_badges[badgeId]) return;
    _badges[badgeId] = true;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        localStorage.setItem(`badges_${user.id}`, JSON.stringify(_badges));

        // Persistir na nuvem
        supabase.from('user_badges')
            .insert([{ user_id: user.id, badge_id: badgeId }])
            .then(({ error }) => {
                if (error) console.warn('Erro ao salvar conquista na nuvem:', error.message);
            });

        updateBadgesUI();
        showToast(`Conquista Desbloqueada: ${badgeId}!`, 'success');
        if (typeof confetti === 'function') confetti();
    }
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

async function checkBadges(userId) {
    if (_userLevel >= 5 && !_badges.level5) {
        await unlockBadge('level5');
    }

    // Buscar contadores para badges de ação
    let importCount = 0;
    let predictCount = 0;

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('import_count, predict_count')
        .eq('id', userId)
        .maybeSingle();

    if (profile) {
        importCount = profile.import_count;
        predictCount = profile.predict_count;
    } else {
        importCount = parseInt(localStorage.getItem(`import_count_${userId}`) || '0');
        predictCount = parseInt(localStorage.getItem(`predict_count_${userId}`) || '0');
    }

    if (importCount >= 3 && !_badges.serialImporter) {
        await unlockBadge('serialImporter');
    }

    if (predictCount >= 5 && !_badges.oracleApprentice) {
        await unlockBadge('oracleApprentice');
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
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-success);">${typeof formatar === 'function' ? formatar(balance) : balance}</div>
            </div>

            <div style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic; margin-bottom: 2rem;">
                "O Oráculo previu um futuro próspero para mi. E o seu?"
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const item = document.getElementById('predict-item').value;
        const value = parseFloat(document.getElementById('predict-value').value);
        const resultDiv = document.getElementById('predictor-result');

        if (!value || isNaN(value)) return;

        // Incrementar contador de predições
        let count = parseInt(localStorage.getItem(`predict_count_${userId}`) || '0') + 1;
        localStorage.setItem(`predict_count_${userId}`, count);

        // Update Supabase
        supabase.rpc('increment_predict_count', { user_id: userId })
            .catch(() => {
                // Fallback if RPC doesn't exist
                supabase.from('user_profiles').select('predict_count').eq('id', userId).maybeSingle()
                    .then(({ data }) => {
                        const newCount = (data?.predict_count || 0) + 1;
                        supabase.from('user_profiles').update({ predict_count: newCount }).eq('id', userId);
                    });
            });

        checkBadges(userId);

        const balance = window._projectedBalance || calculateGlobalBalance();
        const remaining = balance - value;

        let message = "";
        let type = "info";
        let mood = "neutral";

        const escapedItem = window.escapeHTML ? window.escapeHTML(item) : item;
        if (remaining < 0) {
            message = `Análise crítica: Comprar <strong>${escapedItem}</strong> destruirá sua reserva e te deixará com saldo NEGATIVO de ${typeof formatar === 'function' ? formatar(Math.abs(remaining)) : remaining}. Não recomendo.`;
            type = "danger";
            mood = "angry";
        } else if (value > (balance * 0.3)) {
            message = `Cuidado, humano. <strong>${escapedItem}</strong> consome mais de 30% da sua projeção mensal. Isso pode comprometer suas metas futuras.`;
            type = "warning";
            mood = "alert";
        } else {
            message = `Compra de <strong>${escapedItem}</strong> aprovada. Seu saldo projetado continuará saudável em ${typeof formatar === 'function' ? formatar(remaining) : remaining}.`;
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
    const txs = window._allTransactions || [];
    return _contas.reduce((acc, c) => acc + (parseFloat(c.saldo_inicial) || 0), 0) +
        txs.reduce((acc, t) => acc + (t.tipo === 'entrada' ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
}
