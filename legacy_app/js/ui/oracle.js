/* js/ui/oracle.js - Oracle IA Visuals & Advanced Insights */

window.OracleEngine = {
    lastInsight: null,

    /**
     * Gera insights profundos baseados no estado atual
     */
    generateDeepInsight: function(transactions, projection) {
        if (!transactions || transactions.length < 5) return null;

        const now = new Date();
        const curMonth = now.getMonth();
        
        // 1. Detectar categoria com maior aceleração de gasto
        const catAcceleration = this.detectAcceleration(transactions);
        
        // 2. Analisar Liquidez vs Emergência
        const liquidityStatus = this.checkLiquidity(projection);

        // 3. Gerar conselho prático
        let advice = "";
        if (catAcceleration) {
            advice = `Notei que seus gastos em <strong>${catAcceleration.cat}</strong> estão ${catAcceleration.percent.toFixed(0)}% acima do padrão. `;
        }

        if (projection < 0) {
            advice += `Sua projeção está negativa. Recomendo reduzir gastos variáveis em pelo menos R$ ${Math.abs(projection / 4).toFixed(2)} por semana.`;
        } else if (projection < 500) {
            advice += `Sua margem de segurança está apertada. Evite novas compras parceladas este mês.`;
        } else {
            advice += `Você está com uma boa folga. Se poupar ${window.formatar(projection * 0.5)} extras este mês, sua independência financeira chegará 2 meses antes!`;
        }

        return {
            title: "Insight do Oráculo",
            message: advice,
            type: projection < 0 ? "critical" : (projection < 500 ? "warning" : "success")
        };
    },

    detectAcceleration: function(transactions) {
        // Lógica simplificada: comparar média dos últimos 7 dias com média do mês
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recent = transactions.filter(t => parseDate(t.data) >= sevenDaysAgo && t.tipo === 'saida');
        const month = transactions.filter(t => parseDate(t.data).getMonth() === new Date().getMonth() && t.tipo === 'saida');

        if (recent.length === 0 || month.length === 0) return null;

        const cats = {};
        month.forEach(t => {
            cats[t.categoria_nome] = (cats[t.categoria_nome] || 0) + parseFloat(t.valor);
        });

        const recentCats = {};
        recent.forEach(t => {
            recentCats[t.categoria_nome] = (recentCats[t.categoria_nome] || 0) + parseFloat(t.valor);
        });

        let maxDiff = 0;
        let accelCat = null;

        Object.keys(recentCats).forEach(cat => {
            const avgRecent = recentCats[cat] / 7;
            const avgMonth = (cats[cat] || 0) / 30;
            if (avgRecent > avgMonth * 1.5) { // Aumento de 50% na média diária
                const diff = ((avgRecent - avgMonth) / (avgMonth || 1)) * 100;
                if (diff > maxDiff) {
                    maxDiff = diff;
                    accelCat = cat;
                }
            }
        });

        return accelCat ? { cat: accelCat, percent: maxDiff } : null;
    },

    checkLiquidity: function(projection) {
        const balance = window._liquidBalance || 0;
        if (balance === 0) return "critical";
        const ratio = projection / balance;
        if (ratio < 0) return "critical";
        if (ratio < 0.2) return "warning";
        return "healthy";
    },

    updateOracleUI: function(transactions, projection) {
        const insight = this.generateDeepInsight(transactions, projection);
        const container = document.getElementById('projection-insight-text');
        
        if (container && insight) {
            container.innerHTML = insight.message;
            
            // Animacao de brilho se for um novo insight
            if (this.lastInsight !== insight.message) {
                gsap.fromTo(container, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out" });
                this.lastInsight = insight.message;
            }
        }

        // Atualizar o Badge de Saúde Financeira
        const badge = document.getElementById('unlocked-badges-count'); // Usando como proxy por agora ou outro ID
        if (badge) {
            // Lógica de animação
        }
    },

    /**
     * Simula o impacto de uma compra na projeção
     */
    simulatePurchase: function(valor) {
        const projection = window._projectedBalance || 0;
        const liquid = window._liquidBalance || 0;
        const newProjection = projection - valor;
        const reserva = (window._contas || []).filter(c => c.is_reserva_emergencia).reduce((acc, curr) => acc + Number(curr.saldo || 0), 0);
        
        let message = "";
        let mood = "happy";
        let status = "safe"; // safe, warning, danger

        if (newProjection < 0) {
            message = `Cuidado! Se você comprar isso agora, sua projeção de fim de mês ficará negativa em ${window.formatar(Math.abs(newProjection))}. O Oráculo recomenda adiar esta compra.`;
            mood = "sad";
            status = "danger";
        } else if (newProjection < reserva * 0.1) {
            message = `Essa compra de ${window.formatar(valor)} vai consumir quase toda sua margem de segurança. Sobrarão apenas ${window.formatar(newProjection)} no fim do mês.`;
            mood = "neutral";
            status = "warning";
        } else if (valor > liquid * 0.5) {
            message = `O valor de ${window.formatar(valor)} representa mais de 50% do seu saldo atual disponível. Pense se realmente é o momento ideal.`;
            mood = "worried";
            status = "warning";
        } else {
            message = `Veredito: Compra Segura! ✅ Mesmo após gastar ${window.formatar(valor)}, sua saúde financeira permanece excelente com ${window.formatar(newProjection)} de sobra projetada.`;
            mood = "happy";
            status = "safe";
        }

        // Update the Visual Simulation Card
        const simCard = document.getElementById('magic-simulation-card');
        if (simCard) {
            simCard.style.display = 'block';
            
            const valDisplay = document.getElementById('sim-value-display');
            if (valDisplay) valDisplay.textContent = window.formatar ? window.formatar(valor) : `R$ ${valor.toFixed(2)}`;

            const curBalDisplay = document.getElementById('sim-current-balance');
            if (curBalDisplay) curBalDisplay.textContent = window.formatar ? window.formatar(liquid) : `R$ ${liquid.toFixed(2)}`;

            const projBalDisplay = document.getElementById('sim-projected-balance');
            if (projBalDisplay) {
                projBalDisplay.textContent = window.formatar ? window.formatar(newProjection) : `R$ ${newProjection.toFixed(2)}`;
                if (newProjection < 0) {
                    projBalDisplay.style.color = 'var(--color-danger)';
                } else if (status === 'warning') {
                    projBalDisplay.style.color = 'var(--color-warning)';
                } else {
                    projBalDisplay.style.color = 'var(--color-success)';
                }
            }

            const verdictBadge = document.getElementById('sim-verdict-badge');
            const statusIcon = document.getElementById('sim-status-icon');
            const statusIconBg = document.getElementById('sim-status-icon-bg');
            const verdictMsg = document.getElementById('sim-verdict-msg');

            if (verdictMsg) {
                verdictMsg.textContent = message;
            }

            if (status === 'danger') {
                if (verdictBadge) {
                    verdictBadge.textContent = 'Crítico ❌';
                    verdictBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                    verdictBadge.style.color = 'var(--color-danger)';
                }
                if (statusIcon) {
                    statusIcon.className = 'fas fa-exclamation-triangle';
                    statusIcon.style.color = 'var(--color-danger)';
                }
                if (statusIconBg) {
                    statusIconBg.style.background = 'rgba(239, 68, 68, 0.1)';
                }
                if (verdictMsg) {
                    verdictMsg.style.borderLeft = '3px solid var(--color-danger)';
                }
            } else if (status === 'warning') {
                if (verdictBadge) {
                    verdictBadge.textContent = 'Atenção ⚠️';
                    verdictBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                    verdictBadge.style.color = 'var(--color-warning)';
                }
                if (statusIcon) {
                    statusIcon.className = 'fas fa-exclamation-circle';
                    statusIcon.style.color = 'var(--color-warning)';
                }
                if (statusIconBg) {
                    statusIconBg.style.background = 'rgba(245, 158, 11, 0.1)';
                }
                if (verdictMsg) {
                    verdictMsg.style.borderLeft = '3px solid var(--color-warning)';
                }
            } else {
                if (verdictBadge) {
                    verdictBadge.textContent = 'Seguro ✅';
                    verdictBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                    verdictBadge.style.color = 'var(--color-success)';
                }
                if (statusIcon) {
                    statusIcon.className = 'fas fa-check-circle';
                    statusIcon.style.color = 'var(--color-success)';
                }
                if (statusIconBg) {
                    statusIconBg.style.background = 'rgba(16, 185, 129, 0.1)';
                }
                if (verdictMsg) {
                    verdictMsg.style.borderLeft = '3px solid var(--color-success)';
                }
            }

            // Scroll the card into view smoothly
            simCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (typeof showMascotMessage === 'function') {
            console.log('C.A.S.H. Unit: Enviando veredito para o Mascote.');
            showMascotMessage(message, 'eyes', '', mood);
        } else {
            console.warn('C.A.S.H. Unit: showMascotMessage não disponível.');
            if (!simCard) alert(message);
        }
    }
};

window.renderOracle = function(transactions) {
    const projection = window._projectedBalance || 0;
    window.OracleEngine.updateOracleUI(transactions, projection);
};
