/* js/finance.js - Financial Logic, Calculations & Insights */

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function parseDate(dateStr) {
    // Garante que a data seja interpretada no fuso local sem deslocamento
    if (!dateStr) return new Date();
    return new Date(dateStr + 'T00:00:00');
}

function calculateGlobalBalance() {
    const initialSum = (typeof _contas !== 'undefined' && _contas) ? _contas.reduce((acc, c) => acc + parseFloat(c.saldo_inicial || 0), 0) : 0;
    let income = 0;
    let expenses = 0;
    if (typeof _allTransactions !== 'undefined' && _allTransactions) {
        _allTransactions.forEach(t => {
            if (t.tipo === 'entrada') income += parseFloat(t.valor || 0);
            else expenses += parseFloat(t.valor || 0);
        });
    }
    return initialSum + income - expenses;
}

function calculateSummary(transactions) {
    let receitas = 0;
    let despesas = 0;

    transactions.forEach(t => {
        if (t.tipo === 'entrada') {
            receitas += parseFloat(t.valor);
        } else {
            despesas += parseFloat(t.valor);
        }
    });

    const initialSum = (typeof _contas !== 'undefined') ? _contas.reduce((acc, c) => acc + parseFloat(c.saldo_inicial), 0) : 0;
    const saldoTotal = initialSum + receitas - despesas;

    const recReceitas = document.getElementById('total-income');
    const recDespesas = document.getElementById('total-expense');
    if (recReceitas) recReceitas.textContent = formatCurrency(receitas);
    if (recDespesas) recDespesas.textContent = formatCurrency(despesas);
    
    const saldoEl = document.getElementById('total-balance');
    if (saldoEl) {
        saldoEl.textContent = formatCurrency(saldoTotal);
        if (saldoTotal > 0) {
            saldoEl.style.color = 'var(--color-success)';
        } else if (saldoTotal < 0) {
            saldoEl.style.color = 'var(--color-danger)';
        } else {
            saldoEl.style.color = 'white';
        }
    }

    // --- Upcoming (Próximos 7 dias) ---
    const upcomingRange = 7;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const today = now.getDate();

    const upcomingSum = (typeof _recorrencias !== 'undefined' && _recorrencias) ? _recorrencias.reduce((acc, r) => {
        if (r.tipo === 'saida') {
            const dia = parseInt(r.dia_vencimento);
            let isUpcoming = false;
            if (dia >= today && dia <= (today + upcomingRange)) isUpcoming = true;
            if (today + upcomingRange > 31 && dia <= (today + upcomingRange - 31)) isUpcoming = true;

            if (isUpcoming) {
                const lastPaid = r.ultimo_pagamento ? new Date(r.ultimo_pagamento + 'T00:00:00') : null;
                const isPaidThisMonth = lastPaid && lastPaid.getMonth() === curMonth && lastPaid.getFullYear() === curYear;
                if (!isPaidThisMonth) return acc + parseFloat(r.valor);
            }
        }
        return acc;
    }, 0) : 0;

    const pendingEl = document.getElementById('valor-pendente');
    if (pendingEl) {
        pendingEl.textContent = formatCurrency(upcomingSum);
        pendingEl.className = upcomingSum > 0 ? 'stat-value warning' : 'stat-value success';
    }

    if (typeof renderContas === 'function') renderContas();
}

function renderOrcamentos() {
    const list = document.getElementById('budgets-list');
    if (!list || typeof _budgets === 'undefined') return;

    if (_budgets.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon-wrapper">
                    <i class="fas fa-piggy-bank"></i>
                </div>
                <h4>Nenhum orçamento definido</h4>
                <p>O segredo da riqueza é o planejamento. Defina limites para suas categorias.</p>
                <button class="btn-primary-action" style="width: auto; padding: 0.75rem 2rem;" onclick="document.getElementById('btn-open-modal-orcamento').click()">Definir Orçamento</button>
            </div>
        `;
        return;
    }

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    list.innerHTML = _budgets
        .filter(o => o.mes === curMonth && o.ano === curYear)
        .map(o => {
            const nomeCat = o.categorias?.nome || 'Categoria Excluída';
            const spent = _allTransactions
                .filter(t => t.categoria_id === o.categoria_id && t.tipo === 'saida')
                .filter(t => {
                    const d = parseDate(t.data);
                    return (d.getMonth() + 1) === o.mes && d.getFullYear() === o.ano;
                })
                .reduce((acc, t) => acc + parseFloat(t.valor), 0);

            const percent = Math.min((spent / o.valor_limite) * 100, 100) || 0;
            const remaining = o.valor_limite - spent;
            
            let statusClass = '';
            if (percent >= 100) statusClass = 'danger';
            else if (percent >= 80) statusClass = 'warning';

            const config = getCategoryConfig(nomeCat);
            const escapedCatName = escapeHTML(nomeCat);

            return `
                <div class="budget-card" style="border-top: 4px solid ${config.color};">
                    <div class="budget-header">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                                <i class="fas ${config.icon}"></i>
                            </div>
                            <div class="budget-info">
                                <h4>${escapedCatName}</h4>
                                <p>${o.mes}/${o.ano}</p>
                            </div>
                        </div>
                        <button class="btn-icon-plain" onclick="handleDeleteOrcamento('${o.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                    <div class="budget-progress-container">
                        <div class="budget-stats">
                            <span class="budget-spent privacy-blur">${formatCurrency(spent)}</span>
                            <span class="budget-limit privacy-blur">${formatCurrency(o.valor_limite)}</span>
                        </div>
                        <div class="budget-bar-bg" style="background: ${config.color}15;">
                            <div class="budget-bar-fill ${statusClass}" style="width: ${percent}%; background: ${statusClass === 'danger' ? '#EF4444' : (statusClass === 'warning' ? '#F59E0B' : config.color)};"></div>
                        </div>
                    </div>
                    <div class="budget-card-footer">
                        <span class="budget-remaining ${remaining < 0 ? 'negative' : ''} privacy-blur">
                            ${remaining < 0 ? 'Excedido em ' : 'Restam '}${formatCurrency(Math.abs(remaining))}
                        </span>
                        <span class="budget-percent" style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 700;">
                            ${percent.toFixed(0)}%
                        </span>
                    </div>
                </div>
            `;

        }).join('');
    
    // Check for critical alerts
    updateBudgetAlerts();
}

function updateBudgetAlerts() {
    const container = document.getElementById('budget-alerts-container');
    if (!container) return;

    const criticalBudgets = _budgets.filter(o => {
        const spent = _allTransactions
            .filter(t => t.categoria_id === o.categoria_id && t.tipo === 'saida')
            .filter(t => {
                const d = parseDate(t.data);
                const now = new Date();
                return (d.getMonth() + 1) === (now.getMonth() + 1) && d.getFullYear() === now.getFullYear();
            })
            .reduce((acc, t) => acc + parseFloat(t.valor), 0);
        
        return (spent / o.valor_limite) >= 0.8;
    });

    if (criticalBudgets.length > 0) {
        container.innerHTML = criticalBudgets.map(o => {
            const nomeCat = o.categorias?.nome || 'Categoria';
            const spent = _allTransactions
                .filter(t => t.categoria_id === o.categoria_id && t.tipo === 'saida')
                .filter(t => {
                    const d = parseDate(t.data);
                    const now = new Date();
                    return (d.getMonth() + 1) === (now.getMonth() + 1) && d.getFullYear() === now.getFullYear();
                })
                .reduce((acc, t) => acc + parseFloat(t.valor), 0);
            const percent = Math.min((spent / o.valor_limite) * 100, 100);
            const isDanger = percent >= 100;

            return `
                <div class="alert-banner ${isDanger ? 'danger' : 'warning'}" style="padding: 0.8rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid ${isDanger ? '#EF4444' : '#F59E0B'}; background: ${isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'};">
                    <i class="fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-bell'}" style="color: ${isDanger ? '#EF4444' : '#F59E0B'};"></i>
                    <div style="flex: 1;">
                        <p style="font-size: 0.8rem; margin: 0; font-weight: 600;">Limite Crítico: ${escapeHTML(nomeCat)}</p>
                        <p style="font-size: 0.7rem; margin: 0; color: var(--color-text-muted);">Você já usou ${percent.toFixed(0)}% do orçamento planejado.</p>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = '';
    }
}

function parseNotificationText(text) {
    if (!text) return null;
    const cleanText = text.toLowerCase();
    
    // Regex for values (R$ 12,34 or 12.34)
    const amountMatch = text.match(/(?:R\$|r\$|\$)?\s?(\d+(?:[.,]\d{1,2})?)/);
    const valor = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;

    // Infer description (Look for "em", "no", "na" followed by capitalized words or uppercase)
    // Example: "Compra aprovada em PADARIA SAO JOSE"
    let descricao = "Nova Transação";
    const descMatch = text.match(/(?:em|no|na|no estabelecimento)\s+([^,.:;]+)/i);
    if (descMatch) {
        descricao = descMatch[1].trim();
    }

    // Infer Category
    let categoryId = null;
    const catMappings = {
        'alimentação': ['comi', 'almoço', 'jantar', 'café', 'restaurante', 'ifood', 'lanche', 'padaria', 'confeitaria', 'mcdonalds', 'burger king'],
        'transporte': ['uber', 'gasolina', 'combustível', 'ônibus', 'metrô', '99app', 'posto'],
        'lazer': ['cinema', 'show', 'festa', 'viagem', 'steam', 'netflix', 'spotify'],
        'saúde': ['farmácia', 'médico', 'remédio', 'hospital', 'droga'],
        'mercado': ['mercado', 'supermercado', 'carrefour', 'extra', 'pao de acucar', 'atacadao']
    };

    for (const [catName, keywords] of Object.entries(catMappings)) {
        if (keywords.some(k => cleanText.includes(k))) {
            const cat = _categories.find(c => c.nome.toLowerCase().includes(catName));
            if (cat) categoryId = cat.id;
            break;
        }
    }

    if (!categoryId) {
        const fallbackCat = _categories.find(c => c.tipo === 'saida');
        categoryId = fallbackCat ? fallbackCat.id : null;
    }

    return { valor, descricao, categoryId, data: new Date().toISOString().split('T')[0] };
}

function calculateFutureForecast() {
    const now = new Date();
    const balance = calculateGlobalBalance();
    const days = 30;
    const forecast = [];
    
    // Calcular média de gastos diários (saídas não recorrentes nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const historicalExpenses = _allTransactions.filter(t => {
        const d = new Date(t.data + 'T00:00:00');
        return t.tipo === 'saida' && d >= thirtyDaysAgo;
    });

    // Se houver recorrências, tentamos removê-las da média para não contar duas vezes
    const dailyAverageSpending = historicalExpenses.length > 0 
        ? (historicalExpenses.reduce((acc, t) => acc + parseFloat(t.valor), 0) / 30)
        : 0;

    let currentPredictedBalance = balance;

    for (let i = 0; i <= days; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const dayOfMonth = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear();

        // 1. Aplicar média de gastos diários (exceto se for hoje)
        if (i > 0) {
            currentPredictedBalance -= dailyAverageSpending;
        }

        // 2. Aplicar transações recorrentes específicas deste dia
        if (typeof _recorrencias !== 'undefined') {
            _recorrencias.forEach(r => {
                if (parseInt(r.dia_vencimento) === dayOfMonth) {
                    const lastPaid = r.ultimo_pagamento ? new Date(r.ultimo_pagamento + 'T00:00:00') : null;
                    const isAlreadyPaid = lastPaid && lastPaid.getMonth() === month && lastPaid.getFullYear() === year;
                    
                    if (!isAlreadyPaid) {
                        if (r.tipo === 'entrada') currentPredictedBalance += parseFloat(r.valor);
                        else currentPredictedBalance -= parseFloat(r.valor);
                    }
                }
            });
        }

        forecast.push({
            day: dayOfMonth,
            balance: Math.max(0, currentPredictedBalance) // Evitar visual negativo extremo no gráfico se não houver dados
        });
    }

    return forecast;
}

function calculateInsights(currentTransactions = _allTransactions) {
    const insightsContainer = document.getElementById('insights-list');
    if (!insightsContainer) return;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    
    const prevDate = new Date(curYear, curMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    const getMonthData = (m, y) => {
        const filtered = currentTransactions.filter(t => {
            const d = parseDate(t.data);
            return d.getMonth() === m && d.getFullYear() === y && t.tipo === 'saida';
        });
        
        const totals = {};
        filtered.forEach(t => {
            totals[t.categoria_nome] = (totals[t.categoria_nome] || 0) + parseFloat(t.valor);
        });
        return totals;
    };

    const currentTotals = getMonthData(curMonth, curYear);
    const previousTotals = getMonthData(prevMonth, prevYear);
    const insights = [];

    if (Object.keys(currentTotals).length === 0 && Object.keys(previousTotals).length === 0) {
        insights.push({
            title: 'Início de Jornada',
            desc: 'Ainda não tenho dados suficientes para comparar meses. Comece a lançar suas despesas!',
            icon: '🌱', type: 'neutral', tag: 'Novo'
        });
    }

    Object.keys(currentTotals).forEach(cat => {
        const cur = currentTotals[cat];
        const prev = previousTotals[cat] || 0;
        if (prev > 0) {
            const diff = ((cur - prev) / prev) * 100;
            if (diff > 10) {
                insights.push({
                    title: `Aumento em ${cat}`,
                    desc: `Seus gastos em <strong>${cat}</strong> subiram ${diff.toFixed(0)}% em relação ao mês passado.`,
                    icon: '⚠️', type: 'negative', tag: 'Atenção'
                });
            } else if (diff < -10) {
                insights.push({
                    title: `Economia em ${cat}`,
                    desc: `Parabéns! Você reduziu seus gastos em <strong>${cat}</strong> em ${Math.abs(diff).toFixed(0)}%.`,
                    icon: '✨', type: 'positive', tag: 'Bom Trabalho'
                });
            }
        }
    });

    const curTotal = Object.values(currentTotals).reduce((a, b) => a + b, 0);
    const prevTotal = Object.values(previousTotals).reduce((a, b) => a + b, 0);

    if (prevTotal > 0) {
        const totalDiff = ((curTotal - prevTotal) / prevTotal) * 100;
        if (totalDiff > 5) {
            insights.push({
                title: 'Gasto Geral Elevado',
                desc: `Seu gasto total este mês está ${totalDiff.toFixed(0)}% acima da média do mês anterior.`,
                icon: '📈', type: 'negative', tag: 'Risco'
            });
        }
    }

    if (insights.length === 0) {
        insights.push({
            title: 'Análise de Estabilidade',
            desc: 'Seu padrão de consumo está estável em relação ao mês anterior. Continue monitorando!',
            icon: '🛡️', type: 'neutral', tag: 'Estável'
        });
    }

    insightsContainer.innerHTML = insights.map(ins => {
        const escapedTitle = escapeHTML(ins.title);
        // Note: ins.desc contains <strong> tags, so we should be careful. 
        // But the content is generated by our logic, not directly from user input.
        // Still, let's escape the dynamic parts if they come from user data.
        return `
        <div class="insight-card">
            <div class="insight-icon">${ins.icon}</div>
            <div class="insight-info">
                <h4>${escapedTitle}</h4>
                <p>${ins.desc}</p>
                <span class="insight-tag tag-${ins.type}">${ins.tag}</span>
            </div>
        </div>
    `}).join('');

    /*
    const critical = insights.find(i => i.type === 'negative');
    if (critical && typeof showMascotMessage === 'function') {
        setTimeout(() => {
            showMascotMessage(`Atenção detectada! ${critical.title}. Recomendo auditoria imediata.`, 'alert', '', 'angry');
        }, 5000);
    }
    */
}

function calculateProjection(transactions) {
    const projectionEl = document.getElementById('projected-balance');
    const projectionTextEl = document.getElementById('projection-insight-text');
    if (!projectionEl) return;

    const balance = calculateGlobalBalance();
    let projected = balance;

    const now = new Date();
    const today = now.getDate();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - today;

    // 1. Considerar Recorrências Pendentes
    if (typeof _recorrencias !== 'undefined') {
        _recorrencias.forEach(r => {
            const dia = parseInt(r.dia_vencimento);
            const lastPaid = r.ultimo_pagamento ? new Date(r.ultimo_pagamento + 'T00:00:00') : null;
            const isPaidThisMonth = lastPaid && lastPaid.getMonth() === curMonth && lastPaid.getFullYear() === curYear;

            if (dia > today && !isPaidThisMonth) {
                if (r.tipo === 'entrada') projected += parseFloat(r.valor);
                else projected -= parseFloat(r.valor);
            }
        });
    }

    // 2. Considerar Média de Gastos Variáveis (Ritmo)
    // Pegamos transações não recorrentes deste mês para ver o ritmo
    const monthTransactions = _allTransactions.filter(t => {
        const d = parseDate(t.data);
        return d.getMonth() === curMonth && d.getFullYear() === curYear && t.tipo === 'saida';
    });
    
    // Filtrar apenas as que NÃO são recorrências conhecidas (simplificado: ignoramos as que batem valor exato de recorrências ou marcamos no DB futuramente)
    // Por enquanto, pegamos todos os gastos do mês e dividimos pelos dias transcorridos
    const totalSpentSoFar = monthTransactions.reduce((acc, t) => acc + parseFloat(t.valor), 0);
    const dailyPace = today > 0 ? (totalSpentSoFar / today) : 0;
    
    // Projeção baseada no ritmo: Gastos Variáveis Estimados = Ritmo Diário * Dias Restantes
    const estimatedFutureSpending = dailyPace * daysRemaining;
    projected -= estimatedFutureSpending;

    // 3. Atualizar UI e Estado Global
    window._projectedBalance = projected;
    projectionEl.textContent = formatCurrency(projected);
    
    if (projectionTextEl) {
        if (projected < 0) {
            projectionTextEl.innerHTML = `⚠️ <span style="color: var(--color-danger); font-weight: 700;">Risco de saldo negativo!</span> Seu ritmo atual indica que faltarão ${formatCurrency(Math.abs(projected))} no final do mês.`;
            if (typeof showMascotMessage === 'function' && Math.random() > 0.7) {
                showMascotMessage(`Humano, se continuar gastando nesse ritmo, seu saldo ficará negativo em ${formatCurrency(Math.abs(projected))}!`, 'alert', '', 'angry');
            }
        } else {
            projectionTextEl.innerHTML = `✨ <span style="color: var(--color-success); font-weight: 700;">Tudo sob controle.</span> Projeção de sobra de ${formatCurrency(projected)} até dia ${daysInMonth}.`;
        }
    }

    projectionEl.className = projected >= 0 ? 'stat-value success' : 'stat-value danger';
}


function calculateFinancialHealthScore(transactions = _allTransactions) {
    if (!transactions || transactions.length === 0) return { score: 0, pillars: [0, 0, 0, 0, 0] };

    const balance = calculateGlobalBalance();
    const income = transactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + parseFloat(t.valor), 0);
    const expenses = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + parseFloat(t.valor), 0);

    // 1. Poupança: % da renda não gasta
    const savingsRate = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0;
    const scorePoupanca = Math.min(savingsRate * 2, 100); 

    // 2. Controle: Aderência aos orçamentos
    let scoreControle = 100;
    if (typeof _budgets !== 'undefined' && _budgets.length > 0) {
        let overBudgetCount = 0;
        _budgets.forEach(b => {
            const spent = transactions.filter(t => t.categoria_id === b.categoria_id && t.tipo === 'saida').reduce((acc, t) => acc + parseFloat(t.valor), 0);
            if (spent > b.valor_limite) overBudgetCount++;
        });
        scoreControle = Math.max(0, 100 - (overBudgetCount * 25));
    }

    // 3. Foco: Progresso em metas (Mocked for now)
    const scoreFoco = 75; 

    // 4. Disciplina: Frequência de uso (Baseado no número de transações no mês)
    const now = new Date();
    const currentMonthTrans = transactions.filter(t => {
        const d = parseDate(t.data);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const scoreDisciplina = Math.min(currentMonthTrans * 5, 100);

    // 5. Liquidez: Saldo / Gastos Mensais
    const avgMonthlyExpense = expenses || 1;
    const monthsOfRunway = balance / avgMonthlyExpense;
    const scoreLiquidez = Math.min(monthsOfRunway * 20, 100);

    const pillars = [scorePoupanca, scoreControle, scoreFoco, scoreDisciplina, scoreLiquidez];
    const finalScore = Math.round(pillars.reduce((a, b) => a + b, 0) / 5);

    // Update UI
    const badge = document.getElementById('health-score-badge');
    if (badge) {
        badge.textContent = finalScore;
        badge.className = `score-badge ${finalScore > 80 ? 'success' : finalScore > 50 ? 'warning' : 'danger'}`;
    }

    return { score: finalScore, pillars };
}

function calculateFinancialFreedom() {
    const aporteInput = document.getElementById('sim-aporte');
    const rentabilidadeInput = document.getElementById('sim-rentabilidade');
    const resultYears = document.getElementById('sim-result-years');
    const resultText = document.getElementById('sim-result-text');

    if (!aporteInput || !rentabilidadeInput || !resultYears) return;

    const aporteMensal = parseFloat(aporteInput.value) || 0;
    const rentabilidadeAnual = (parseFloat(rentabilidadeInput.value) || 0) / 100;
    const rentabilidadeMensal = Math.pow(1 + rentabilidadeAnual, 1/12) - 1;

    // Regra dos 4%: Patrimônio Necessário = Gastos Anuais / 0.04
    const expenses = _allTransactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + parseFloat(t.valor), 0);
    const monthsData = new Set(_allTransactions.map(t => t.data.substring(0, 7))).size || 1;
    const mediaGastoMensal = expenses / monthsData;
    const patrimonioMeta = (mediaGastoMensal * 12) / 0.04;

    const saldoAtual = calculateGlobalBalance();
    
    if (aporteMensal <= 0 || mediaGastoMensal === 0) {
        resultYears.textContent = "∞ Anos";
        return;
    }

    // Cálculo simplificado de juros compostos: FV = P * (1 + r)^n + A * (((1 + r)^n - 1) / r)
    // Queremos achar n tal que FV = patrimonioMeta
    let meses = 0;
    if (rentabilidadeMensal > 0) {
        meses = Math.log((patrimonioMeta * rentabilidadeMensal + aporteMensal) / (saldoAtual * rentabilidadeMensal + aporteMensal)) / Math.log(1 + rentabilidadeMensal);
    } else {
        meses = (patrimonioMeta - saldoAtual) / aporteMensal;
    }

    const anos = Math.max(0, Math.ceil(meses / 12));
    resultYears.textContent = anos === 0 ? "HOJE!" : `${anos} Anos`;
    resultYears.classList.add('privacy-blur');
    if (resultText) {
        resultText.textContent = anos === 0 ? "Você já atingiu sua independência!" : `Com um aporte de ${formatCurrency(aporteMensal)}/mês.`;
        resultText.classList.add('privacy-blur');
    }
}

function initSimulatorEvents() {
    ['sim-aporte', 'sim-rentabilidade'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateFinancialFreedom);
    });
}

function processPiggyBank(transactionValue) {
    // Se o arredondamento estiver ativo (simulado via localStorage por enquanto)
    const isPiggyActive = localStorage.getItem('piggy_bank_active') === 'true';
    if (!isPiggyActive) return 0;

    const valor = parseFloat(transactionValue);
    const proximoInteiro = Math.ceil(valor);
    const diferenca = proximoInteiro - valor;

    return (diferenca > 0 && diferenca < 1) ? diferenca : 0;
}
