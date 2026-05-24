/* js/charts.js - Chart.js Renderers & Analysis Charts */

let _chartCategorias = null;
let _chartEvolucao = null;
let _chartRadar = null;
let _chartTendencia = null;
let _chartForecast = null;
let _chartAnnual = null;
let _chartSavings = null;

function updateCharts(transactions) {
    if (typeof Chart === 'undefined') return;

    // 0. Calcular Saúde Financeira primeiro para definir cores globais (Phase 3)
    calculateFinancialHealthScore(transactions);

    // 1. Gastos por Categoria (Doughnut)
    renderCategoryChart(transactions);

    // 2. Receitas vs Despesas (Bar)
    renderEvolutionChart(transactions);

    // 3. Análise de Perfil (Radar)
    renderRadarChart(transactions);

    // 4. Tendência de Saldo (Line)
    renderTrendChart(transactions);

    // 4b. Projeção de Fluxo (Line)
    renderForecastChart(transactions);

    // 5. Relatórios Avançados (Se estiver na view certa)
    renderReportsCharts(transactions);
}

function renderReportsCharts(transactions) {
    const annualCtx = document.getElementById('chart-reports-annual')?.getContext('2d');
    const savingsCtx = document.getElementById('chart-reports-savings')?.getContext('2d');

    if (annualCtx) {
        if (_chartAnnual) _chartAnnual.destroy();
        
        // Calcular gastos reais por categoria (Anual)
        const currentYear = new Date().getFullYear();
        const annualExpenses = transactions.filter(t => {
            const d = parseDate(t.data);
            return t.tipo === 'saida' && d.getFullYear() === currentYear;
        });

        const catTotals = {};
        annualExpenses.forEach(t => {
            const cat = t.categoria_nome || 'Geral';
            catTotals[cat] = (catTotals[cat] || 0) + parseFloat(t.valor);
        });

        const sortedCats = Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5 categorias

        _chartAnnual = new Chart(annualCtx, {
            type: 'bar',
            data: {
                labels: sortedCats.map(c => c[0]),
                datasets: [{
                    label: 'Gasto Total',
                    data: sortedCats.map(c => c[1]),
                    backgroundColor: [
                        'rgba(52, 199, 89, 0.6)', 
                        'rgba(255, 45, 85, 0.6)', 
                        'rgba(90, 200, 250, 0.6)', 
                        'rgba(255, 122, 0, 0.6)', 
                        'rgba(88, 86, 214, 0.6)'
                    ],
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: { 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#A1A1AA' }
                    },
                    y: { 
                        grid: { display: false },
                        ticks: { color: '#FAFAFA', font: { weight: '600' } }
                    }
                }
            }
        });
    }

    if (savingsCtx) {
        if (_chartSavings) _chartSavings.destroy();

        // Calcular economia mensal acumulada real
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const currentYear = new Date().getFullYear();
        const monthlyBalances = new Array(12).fill(0);

        transactions.forEach(t => {
            const d = parseDate(t.data);
            if (d.getFullYear() === currentYear) {
                const m = d.getMonth();
                if (t.tipo === 'entrada') monthlyBalances[m] += parseFloat(t.valor);
                else monthlyBalances[m] -= parseFloat(t.valor);
            }
        });

        const accumulatedSavings = [];
        let runningTotal = 0;
        monthlyBalances.forEach(val => {
            runningTotal += val;
            accumulatedSavings.push(runningTotal);
        });

        _chartSavings = new Chart(savingsCtx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Reserva Acumulada',
                    data: accumulatedSavings,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#4ade80'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    x: { ticks: { color: '#A1A1AA' }, grid: { display: false } },
                    y: { ticks: { color: '#A1A1AA' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }
}

function renderCategoryChart(transactions) {
    const gastos = transactions.filter(t => t.tipo === 'saida');
    const catTotals = {};
    gastos.forEach(g => {
        catTotals[g.categoria_nome] = (catTotals[g.categoria_nome] || 0) + parseFloat(g.valor);
    });

    const ctx = document.getElementById('chart-categorias')?.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(catTotals);
    const backgroundColors = labels.map(name => getCategoryConfig(name).color);

    if (_chartCategorias) _chartCategorias.destroy();
    _chartCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(catTotals),
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#1C1C1E'
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#FAFAFA', 
                        usePointStyle: true,
                        font: {
                            size: window.innerWidth < 600 ? 10 : 12
                        }
                    } 
                } 
            }
        }
    });
}

function renderEvolutionChart(transactions) {
    let totalReceitas = 0;
    let totalDespesas = 0;
    transactions.forEach(t => {
        if (t.tipo === 'entrada') totalReceitas += parseFloat(t.valor);
        else totalDespesas += parseFloat(t.valor);
    });

    const ctx = document.getElementById('chart-evolucao')?.getContext('2d');
    if (!ctx) return;

    if (_chartEvolucao) _chartEvolucao.destroy();
    
    // Phase 3: Dynamic Colors
    const healthScore = typeof window._currentHealthScore !== 'undefined' ? window._currentHealthScore : 70;
    const accentColor = healthScore >= 80 ? '#10B981' : (healthScore >= 50 ? '#FF7A00' : '#EF4444');

    _chartEvolucao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [totalReceitas, totalDespesas],
                backgroundColor: ['#10B981', '#EF4444'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: totalReceitas,
                            yMax: totalReceitas,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: { content: 'Teto de Receita', display: true }
                        }
                    }
                }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#A1A1AA' } },
                x: { grid: { display: false }, ticks: { color: '#A1A1AA' } }
            }
        }
    });
}

function renderRadarChart(transactions) {
    const ctx = document.getElementById('chart-radar')?.getContext('2d');
    if (!ctx) return;

    if (_chartRadar) _chartRadar.destroy();

    // Usa o score já calculado globalmente
    const pillars = window._currentPillars || [0,0,0,0,0];

    _chartRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Poupança', 'Controle', 'Foco', 'Disciplina', 'Liquidez'],
            datasets: [{
                label: 'Perfil Financeiro',
                data: pillars,
                backgroundColor: 'rgba(255, 122, 0, 0.2)',
                borderColor: '#FF7A00',
                pointBackgroundColor: '#FF7A00'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    pointLabels: { color: '#8E8E93' },
                    ticks: { display: false },
                    suggestedMin: 0, suggestedMax: 100
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderTrendChart(transactions) {
    const ctx = document.getElementById('chart-tendencia')?.getContext('2d');
    if (!ctx) return;

    if (_chartTendencia) _chartTendencia.destroy();

    // Calcula tendência real dos últimos 30 dias
    const now = new Date();
    const dailyBalances = [];
    const labels = [];
    
    const initialBalance = (typeof _contas !== 'undefined' && _contas) ? _contas.reduce((acc, c) => acc + parseFloat(c.saldo_inicial || 0), 0) : 0;

    // Optimized calculation: One pass over transactions instead of O(30*N)
    const dailyDelta = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');

    // Total balance today (sum of all transactions + initial balance)
    let currentBalance = initialBalance + transactions.reduce((acc, t) => 
        acc + (t.tipo === 'entrada' ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);

    // Group transactions by date for the last 30 days
    transactions.forEach(t => {
        if (t.data > thirtyDaysAgoStr) {
            dailyDelta[t.data] = (dailyDelta[t.data] || 0) + (t.tipo === 'entrada' ? parseFloat(t.valor) : -parseFloat(t.valor));
        }
    });

    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');
        
        dailyBalances.unshift(currentBalance);
        labels.unshift(d.getDate());

        // Move one day back: subtract the delta of the day we just processed
        currentBalance -= (dailyDelta[dateStr] || 0);
    }

    // Phase 3: Dynamic Colors
    const healthScore = typeof window._currentHealthScore !== 'undefined' ? window._currentHealthScore : 70;
    const accentColor = healthScore >= 80 ? '#10B981' : (healthScore >= 50 ? '#FF7A00' : '#EF4444');

    _chartTendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo',
                data: dailyBalances,
                borderColor: accentColor,
                backgroundColor: `${accentColor}10`,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#A1A1AA' } },
                x: { grid: { display: false }, ticks: { color: '#A1A1AA' } }
            }
        }
    });
}

async function initializeDashboardCharts(userId) {
    try {
        const { data, error } = await supabase
            .from('transacoes')
            .select('*')
            .eq('user_id', userId)
            .order('data', { ascending: false })
            .limit(100);

        if (error) throw error;
        updateCharts(data || []);
    } catch (error) {
        console.error('C.A.S.H. Unit: Erro ao inicializar gráficos.', error);
    }
}

// Escuta redimensionamento para ajustar gráficos (mobile orientation change)
let _resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimeout);
    _resizeTimeout = setTimeout(() => {
        if (_chartCategorias) _chartCategorias.resize();
        if (_chartEvolucao) _chartEvolucao.resize();
        if (_chartRadar) _chartRadar.resize();
        if (_chartTendencia) _chartTendencia.resize();
        if (_chartForecast) _chartForecast.resize();
        if (_chartMiniForecast) _chartMiniForecast.resize();
    }, 250);
});

function renderForecastChart(transactions) {
    const ctx = document.getElementById('chart-forecast')?.getContext('2d');
    if (!ctx) return;

    if (_chartForecast) _chartForecast.destroy();

    const forecastData = typeof calculateFutureForecast === 'function' ? calculateFutureForecast() : [];
    
    _chartForecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastData.map(d => d.day),
            datasets: [{
                label: 'Saldo Projetado',
                data: forecastData.map(d => d.balance),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                    ticks: { color: '#A1A1AA' } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#A1A1AA' } 
                }
            }
        }
    });
}

let _chartMiniForecast = null;
let _chartInvoiceEvolution = null;

function renderInvoiceEvolutionChart(invoiceTransactions) {
    const ctx = document.getElementById('chart-invoice-evolution')?.getContext('2d');
    if (!ctx) return;

    if (_chartInvoiceEvolution) _chartInvoiceEvolution.destroy();

    // Agrupar por dia e calcular acumulado
    const dailyData = {};
    invoiceTransactions.forEach(t => {
        const d = new Date(t.data + 'T00:00:00').getDate();
        const val = t.tipo === 'entrada' ? -parseFloat(t.valor) : parseFloat(t.valor);
        dailyData[d] = (dailyData[d] || 0) + val;
    });

    const days = Object.keys(dailyData).map(Number).sort((a, b) => a - b);
    let runningTotal = 0;
    const labels = [];
    const dataPoints = [];

    if (days.length === 0) {
        labels.push(1);
        dataPoints.push(0);
    } else {
        const lastDay = Math.max(...days);
        for (let i = 1; i <= lastDay; i++) {
            runningTotal += (dailyData[i] || 0);
            labels.push(i);
            dataPoints.push(runningTotal);
        }
    }

    _chartInvoiceEvolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gasto Acumulado',
                data: dataPoints,
                borderColor: '#FF7A00',
                backgroundColor: 'rgba(255, 122, 0, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: days.length > 1 ? 0 : 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            return 'Acumulado: R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        },
                        title: function(context) {
                            return 'Dia ' + context[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8E8E93', font: { size: 10 }, maxRotation: 0 }
                },
                y: {
                    display: false,
                    beginAtZero: true
                }
            }
        }
    });
}

function renderMiniForecast(forecastData) {
    const ctx = document.getElementById('chart-mini-forecast')?.getContext('2d');
    if (!ctx || !forecastData) return;

    if (_chartMiniForecast) _chartMiniForecast.destroy();

    _chartMiniForecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastData.map(d => d.day),
            datasets: [{
                data: forecastData.map(d => d.balance),
                borderColor: '#FF7A00',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            animation: { duration: 1000 }
        }
    });
}

function calculateFinancialHealthScore(transactions = (typeof _allTransactions !== 'undefined' ? _allTransactions : [])) {
    if (!transactions || transactions.length === 0) {
        const fallback = { score: 0, pillars: [0, 0, 0, 0, 0] };
        window._currentHealthScore = fallback.score;
        window._currentPillars = fallback.pillars;
        return fallback;
    }

    const balance = typeof calculateGlobalBalance === 'function' ? calculateGlobalBalance() : 0;
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

    // Persistir globalmente para uso em outros gráficos
    window._currentHealthScore = finalScore;
    window._currentPillars = pillars;

    // Update UI
    const badge = document.getElementById('health-score-badge');
    if (badge) {
        badge.textContent = finalScore;
        badge.className = `score-badge ${finalScore > 80 ? 'success' : finalScore > 50 ? 'warning' : 'danger'}`;
    }

    return { score: finalScore, pillars };
}
