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
        const newProjection = projection - valor;
        
        let message = "";
        let mood = "happy";

        if (newProjection < 0) {
            message = `Se você comprar isso agora, sua projeção de fim de mês ficará negativa em R$ ${Math.abs(newProjection).toFixed(2)}. Recomendo esperar.`;
            mood = "sad";
        } else if (newProjection < 500) {
            message = `Você pode comprar, mas sua margem de segurança será de apenas R$ ${newProjection.toFixed(2)}. Cuidado com imprevistos!`;
            mood = "neutral";
        } else {
            message = `Compra segura! Mesmo após os R$ ${valor.toFixed(2)}, você ainda terá R$ ${newProjection.toFixed(2)} de sobra no fim do mês.`;
            mood = "happy";
        }

        if (typeof showMascotMessage === 'function') {
            console.log('C.A.S.H. Unit: Enviando veredito para o Mascote.');
            showMascotMessage(message, 'eyes', '', mood);
        } else {
            console.warn('C.A.S.H. Unit: showMascotMessage não disponível para exibir veredito.');
            alert(message); // Fallback extremo
        }
    }
};

window.renderOracle = function(transactions) {
    const projection = window._projectedBalance || 0;
    window.OracleEngine.updateOracleUI(transactions, projection);
};
