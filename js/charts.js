/* js/charts.js - Chart.js Renderers & Analysis Charts */

let _chartCategorias = null;
let _chartEvolucao = null;
let _chartRadar = null;
let _chartTendencia = null;
let _chartForecast = null;

function updateCharts(transactions) {
    if (typeof Chart === 'undefined') return;

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
        // Mocked annual data for demonstration
        new Chart(annualCtx, {
            type: 'bar',
            data: {
                labels: ['Moradia', 'Alimentação', 'Educação', 'Lazer', 'Saúde'],
                datasets: [{
                    label: 'Gasto Total',
                    data: [5000, 3500, 1500, 1200, 800],
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
        new Chart(savingsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Reserva Acumulada',
                    data: [500, 1200, 1800, 2400, 3100, 4000],
                    borderColor: '#4ade80',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
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
            plugins: { legend: { display: false } },
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

    // Calcula scores reais
    const health = typeof calculateFinancialHealthScore === 'function' ? calculateFinancialHealthScore(transactions) : { pillars: [0,0,0,0,0] };
    const scores = health.pillars; 

    _chartRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Poupança', 'Controle', 'Foco', 'Disciplina', 'Liquidez'],
            datasets: [{
                label: 'Perfil Financeiro',
                data: scores,
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
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Saldo até aquele dia
        const balanceAtDay = _contas.reduce((acc, c) => acc + parseFloat(c.saldo_inicial || 0), 0) + 
            transactions.filter(t => t.data <= dateStr).reduce((acc, t) => acc + (t.tipo === 'entrada' ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
        
        dailyBalances.push(balanceAtDay);
        labels.push(d.getDate());
    }

    _chartTendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo',
                data: dailyBalances,
                borderColor: '#FF7A00',
                backgroundColor: 'rgba(255, 122, 0, 0.1)',
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
