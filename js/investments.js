/**
 * js/investments.js - Módulo de Gestão de Patrimônio e Investimentos
 * Gerencia ativos, alocação e reserva de emergência.
 */

const Investments = {
    State: {
        ativos: [],
        chart: null
    },

    /**
     * Inicializa o módulo, configurando listeners de UI e carregando dados.
     */
    init: async function() {
        console.log('C.A.S.H. Unit: Inicializando módulo de Patrimônio...');
        this.setupEventListeners();
        await this.loadAssets();
    },

    setupEventListeners: function() {
        const btnOpenModal = document.getElementById('btn-open-modal-asset');
        if (btnOpenModal) {
            btnOpenModal.addEventListener('click', () => {
                this.openModal();
            });
        }

        const assetForm = document.getElementById('asset-form');
        if (assetForm) {
            assetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSaveAsset();
            });

            // Listener para mudança de tipo de ativo
            const selectTipo = document.getElementById('asset-tipo');
            if (selectTipo) {
                selectTipo.addEventListener('change', () => this.updateModalLabels());
            }

            // Listener para feedback de valor total em tempo real
            const inputs = ['asset-custo', 'asset-valor-atual'];
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => this.updateTotalPreview());
            });
        }

        // Delegar eventos para botões de ação nos cards (Edit/Delete)
        const grid = document.getElementById('assets-grid');
        if (grid) {
            grid.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = btn.dataset.id;
                if (btn.classList.contains('btn-edit-asset')) {
                    this.openModal(id);
                } else if (btn.classList.contains('btn-delete-asset')) {
                    await this.handleDeleteAsset(id);
                }
            });
        }
    },

    /**
     * Carrega ativos do Supabase
     */
    loadAssets: async function() {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const { data, error } = await window.supabase
                .from('ativos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.State.ativos = data || [];
            console.log(`C.A.S.H. Unit: ${this.State.ativos.length} ativos carregados.`);
            
            if (document.querySelector('.dashboard-main-content').getAttribute('data-view') === 'investments') {
                this.render();
            }
        } catch (err) {
            console.error('Erro ao carregar ativos:', err);
            showToast('Erro ao carregar seus investimentos.', 'error');
        }
    },

    /**
     * Renderiza toda a view de patrimônio
     */
    render: function() {
        this.renderAssetCards();
        this.calculateSummary();
        this.updateSummaryCards();
        this.renderAllocationChart();
    },

    renderAssetCards: function() {
        const grid = document.getElementById('assets-grid');
        if (!grid) return;

        if (this.State.ativos.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; padding: 3rem;">
                    <i class="fas fa-seedling" style="font-size: 3rem; color: var(--color-primary); opacity: 0.5; margin-bottom: 1rem;"></i>
                    <h4>Comece sua jornada</h4>
                    <p>Você ainda não cadastrou nenhum ativo. Adicione seus investimentos para ver o crescimento!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.State.ativos.map(asset => {
            const typeIcon = {
                renda_fixa: 'fa-piggy-bank',
                renda_variavel: 'fa-chart-line',
                fii: 'fa-building',
                cripto: 'fa-coins',
                bens: 'fa-cow', // Ícone sugestivo para gado/bens
                outros: 'fa-box'
            }[asset.tipo] || 'fa-gem';

            const typeLabel = {
                renda_fixa: 'Renda Fixa',
                renda_variavel: 'Ações/ETFs',
                fii: 'FIIs',
                cripto: 'Cripto',
                bens: 'Ativos Reais',
                outros: 'Outros'
            }[asset.tipo] || asset.tipo;

            return `
                <div class="card-glass asset-card" style="padding: 1.25rem; transition: transform 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div style="width: 40px; height: 40px; background: rgba(0, 210, 255, 0.1); color: #00D2FF; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${typeIcon}"></i>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-ghost-small btn-edit-asset" data-id="${asset.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-ghost-small btn-delete-asset danger" data-id="${asset.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div style="margin-bottom: 0.5rem;">
                        <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-text-muted);">${typeLabel}</span>
                        <h4 style="margin: 0; font-size: 1rem;">${window.escapeHTML ? window.escapeHTML(asset.nome) : asset.nome}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <small style="color: var(--color-text-muted);">${window.escapeHTML ? window.escapeHTML(asset.instituicao || '-') : (asset.instituicao || '-')}</small>
                            ${asset.tipo === 'bens' && asset.quantidade ? `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px; color: var(--color-text-main);">Qtd: ${asset.quantidade}</span>` : ''}
                        </div>
                    </div>
                    <div style="border-top: 1px solid var(--color-border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <span style="display: block; font-size: 0.65rem; color: var(--color-text-muted);">Valor Atual</span>
                            <span class="privacy-blur" style="font-weight: 700; color: #00D2FF;">${formatCurrency(asset.valor_atual)}</span>
                        </div>
                        ${asset.custo_aquisicao > 0 ? `
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.65rem; color: var(--color-text-muted);">Rentabilidade</span>
                            <span class="${asset.valor_atual >= asset.custo_aquisicao ? 'text-success' : 'text-danger'}" style="font-size: 0.8rem; font-weight: 600;">
                                ${(((asset.valor_atual / asset.custo_aquisicao) - 1) * 100).toFixed(2)}%
                            </span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    calculateSummary: async function() {
        console.log('C.A.S.H. Unit: Calculando resumo de patrimônio...');
        const assets = this.State.ativos;
        
        // Elementos para Skeletons
        const heroTotalEl = document.getElementById('total-balance');
        const costEl = document.getElementById('invested-cost-value');
        const marketEl = document.getElementById('market-price-value');

        if (heroTotalEl) heroTotalEl.classList.add('skeleton');
        if (costEl) costEl.classList.add('skeleton');
        if (marketEl) marketEl.classList.add('skeleton');

        let totalInvestedCost = 0;
        let totalMarketValue = 0;
        
        assets.forEach(curr => {
            totalMarketValue += Number(curr.valor_atual);
            const cost = curr.tipo === 'bens' ? (Number(curr.quantidade) * Number(curr.preco_unitario)) : Number(curr.custo_aquisicao);
            totalInvestedCost += (cost || Number(curr.valor_atual));
        });
        
        const totalContas = (window._contas || []).filter(c => c.tipo !== 'credito').reduce((acc, curr) => acc + Number(curr.saldo_atual || 0), 0);
        const patrimonioTotal = totalMarketValue + totalContas;

        const totalEl = document.getElementById('total-investments-value');
        if (totalEl) totalEl.textContent = formatCurrency(patrimonioTotal);

        // Remover Skeletons e atualizar valores
        if (costEl) {
            costEl.classList.remove('skeleton');
            costEl.textContent = formatCurrency(totalInvestedCost);
        }
        if (marketEl) {
            marketEl.classList.remove('skeleton');
            marketEl.textContent = formatCurrency(totalMarketValue);
        }

        // Atualizar rentabilidade global de ativos
        const deltaEl = document.getElementById('investments-delta');
        if (deltaEl && totalInvestedCost > 0) {
            const yieldPercent = ((totalMarketValue / totalInvestedCost) - 1) * 100;
            deltaEl.textContent = `${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}%`;
            deltaEl.className = yieldPercent >= 0 ? 'badge-success' : 'badge-danger';
        }

        // Atualizar também o saldo no Hero (Dashboard Home) se existir com animação GSAP
        if (heroTotalEl) {
            heroTotalEl.classList.remove('skeleton');
            const currentVal = parseFloat(heroTotalEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            
            const counter = { val: currentVal };
            gsap.to(counter, {
                val: patrimonioTotal,
                duration: 1.2,
                ease: "power2.out",
                onUpdate: () => {
                    heroTotalEl.textContent = formatCurrency(counter.val);
                }
            });
        }
    },

    updateSummaryCards: async function() {
        const targetEl = document.getElementById('emergency-fund-progress-container');
        const valReservaEl = document.getElementById('emergency-fund-value');
        const percentEl = document.getElementById('emergency-fund-percent');

        // Estado inicial de Skeleton
        if (valReservaEl) valReservaEl.classList.add('skeleton');
        if (percentEl) percentEl.classList.add('skeleton');

        const metas = window._metas || [];
        const reservaContas = (window._contas || []).filter(c => !!c.is_reserva_emergencia).reduce((acc, curr) => acc + Number(curr.saldo_atual || 0), 0);
        
        // Busca a meta que contém "reserva" no nome
        const metaReservaObj = metas.find(m => m.nome.toLowerCase().includes('reserva'));
        
        // Se houver uma meta, usamos o valor_atual dela como base, 
        // e SOMAMOS o saldo das contas marcadas como reserva.
        const valorMetaAtual = metaReservaObj ? Number(metaReservaObj.valor_atual || 0) : 0;
        const valorExibidoReserva = reservaContas + valorMetaAtual;

        // Remover Skeleton
        if (valReservaEl) {
            valReservaEl.classList.remove('skeleton');
            valReservaEl.textContent = formatCurrency(valorExibidoReserva);
        }

        let metaReservaObjetivo = 10000; // Valor padrão caso não exista meta
        if (metaReservaObj) {
            metaReservaObjetivo = Number(metaReservaObj.valor_objetivo || 10000);
        }

        const percent = Math.min(Math.round((valorExibidoReserva / metaReservaObjetivo) * 100), 100);
        const faltante = Math.max(metaReservaObjetivo - valorExibidoReserva, 0);

        if (percentEl) {
            percentEl.classList.remove('skeleton');
            percentEl.textContent = `${percent}%`;
        }

        // Renderização do progresso com animação GSAP
        if (targetEl) {
            targetEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted);">Meta: ${formatCurrency(metaReservaObjetivo)}</span>
                    <span style="font-size: 0.8rem; font-weight: 700; color: ${faltante > 0 ? 'var(--color-warning)' : 'var(--color-success)'};">
                        ${faltante > 0 ? `Faltam ${formatCurrency(faltante)}` : 'Meta Atingida! 🎉'}
                    </span>
                </div>
                <div class="progress-bar-bg" style="width: 100%; height: 12px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.05);">
                    <div id="reserva-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--color-primary), #FFB800); border-radius: 10px; position: relative;">
                        <div style="position: absolute; top: 0; right: 0; width: 20px; height: 100%; background: white; opacity: 0.2; filter: blur(5px);"></div>
                    </div>
                </div>
            `;

            // Animação suave com GSAP
            setTimeout(() => {
                const fill = document.getElementById('reserva-progress-fill');
                if (fill) {
                    gsap.to(fill, {
                        width: `${percent}%`,
                        duration: 1.5,
                        ease: "expo.out"
                    });
                }
            }, 100);
        }
    },

    renderAllocationChart: function() {
        const ctx = document.getElementById('chart-allocation');
        if (!ctx) return;

        const allocation = this.State.ativos.reduce((acc, curr) => {
            acc[curr.tipo] = (acc[curr.tipo] || 0) + Number(curr.valor_atual);
            return acc;
        }, {});

        const labels = Object.keys(allocation).map(k => ({
            renda_fixa: 'Renda Fixa',
            renda_variavel: 'Ações/ETFs',
            fii: 'FIIs',
            cripto: 'Cripto',
            bens: 'Ativos Reais',
            outros: 'Outros'
        }[k] || k));
        
        const data = Object.values(allocation);
        const colors = ['#00D2FF', '#007AFF', '#FFD700', '#FF2D55', '#10B981', '#A259FF'];

        if (this.State.chart) this.State.chart.destroy();

        if (data.length === 0) {
            // Renderizar algo vazio ou placeholder
            return;
        }

        this.State.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                cutout: '75%'
            }
        });

        // Renderizar Legenda Customizada
        const legend = document.getElementById('allocation-legend');
        if (legend) {
            legend.innerHTML = labels.map((label, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[i % colors.length]};"></div>
                        <span>${label}</span>
                    </div>
                    <span style="font-weight: 600;">${((data[i] / data.reduce((a,b)=>a+b,0)) * 100).toFixed(1)}%</span>
                </div>
            `).join('');
        }
    },

    /**
     * Modal e CRUD
     */
    openModal: function(id = null) {
        const modal = document.getElementById('modal-asset');
        const form = document.getElementById('asset-form');
        form.reset();
        document.getElementById('asset-id').value = id || '';
        
        // Limpar preview de total
        const preview = document.getElementById('asset-total-preview');
        if (preview) preview.textContent = '';

        if (id) {
            const asset = this.State.ativos.find(a => a.id === id);
            if (asset) {
                document.getElementById('asset-nome').value = asset.nome;
                document.getElementById('asset-tipo').value = asset.tipo;
                document.getElementById('asset-instituicao').value = asset.instituicao || '';
                
                if (asset.tipo === 'bens') {
                    document.getElementById('asset-custo').value = asset.quantidade || 1;
                    document.getElementById('asset-valor-atual').value = asset.preco_unitario || asset.valor_atual;
                } else {
                    document.getElementById('asset-custo').value = asset.custo_aquisicao || '';
                    document.getElementById('asset-valor-atual').value = asset.valor_atual;
                }
            }
        }

        this.updateModalLabels();
        openModal('modal-asset');
    },

    updateModalLabels: function() {
        const tipo = document.getElementById('asset-tipo').value;
        const labelCusto = document.getElementById('label-asset-custo');
        const labelValor = document.getElementById('label-asset-valor-atual');
        
        if (tipo === 'bens') {
            if (labelCusto) labelCusto.textContent = 'Quantidade';
            if (labelValor) labelValor.textContent = 'Preço Unitário (R$)';
            document.getElementById('asset-custo').placeholder = 'Ex: 10';
            document.getElementById('asset-valor-atual').placeholder = 'Ex: 2500,00';
        } else {
            if (labelCusto) labelCusto.textContent = 'Custo Médio / Aporte';
            if (labelValor) labelValor.textContent = 'Valor Atual Total';
            document.getElementById('asset-custo').placeholder = '0,00';
            document.getElementById('asset-valor-atual').placeholder = '0,00';
        }
        this.updateTotalPreview();
    },

    updateTotalPreview: function() {
        const tipo = document.getElementById('asset-tipo').value;
        if (tipo !== 'bens') return;

        const qty = parseFloat(document.getElementById('asset-custo').value) || 0;
        const unit = parseFloat(document.getElementById('asset-valor-atual').value) || 0;
        const total = qty * unit;

        let preview = document.getElementById('asset-total-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'asset-total-preview';
            preview.style.cssText = 'grid-column: 1/-1; font-size: 0.85rem; color: #00D2FF; margin-top: -0.5rem; font-weight: 600;';
            const row = document.getElementById('asset-valor-atual').closest('.form-row');
            if (row) row.parentNode.insertBefore(preview, row.nextSibling);
        }

        if (total > 0) {
            preview.textContent = `Valor Total Estimado: ${formatCurrency(total)}`;
        } else {
            preview.textContent = '';
        }
    },

    handleSaveAsset: async function() {
        const form = document.getElementById('asset-form');
        const id = document.getElementById('asset-id').value;
        const tipo = document.getElementById('asset-tipo').value;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        try {
            btn.disabled = true;
            btn.textContent = 'Salvando...';

            const user = await getCurrentUser();
            
            let custo_aquisicao = parseFloat(document.getElementById('asset-custo').value) || 0;
            let valor_atual = parseFloat(document.getElementById('asset-valor-atual').value) || 0;

            let quantidade = 1;
            let preco_unitario = valor_atual;

            // Se for bem/ativo real, o valor atual digitado é unitário, então multiplicamos pela qtd
            if (tipo === 'bens') {
                quantidade = parseFloat(document.getElementById('asset-custo').value) || 1;
                preco_unitario = parseFloat(document.getElementById('asset-valor-atual').value) || 0;
                valor_atual = quantidade * preco_unitario;
                custo_aquisicao = 0; 
            }

            const payload = {
                user_id: user.id,
                nome: document.getElementById('asset-nome').value,
                tipo: tipo,
                instituicao: document.getElementById('asset-instituicao').value,
                custo_aquisicao: custo_aquisicao,
                valor_atual: valor_atual,
                quantidade: quantidade,
                preco_unitario: preco_unitario
            };

            let error;
            if (id) {
                const { error: err } = await window.supabase.from('ativos').update(payload).eq('id', id);
                error = err;
            } else {
                const { error: err } = await window.supabase.from('ativos').insert([payload]);
                error = err;
            }

            if (error) throw error;

            showToast(`Ativo ${id ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
            closeModal('modal-asset');
            await this.loadAssets();
        } catch (err) {
            console.error('Erro ao salvar ativo:', err);
            showToast('Erro ao salvar investimento.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    handleDeleteAsset: async function(id) {
        const confirmed = await confirmPremium(
            'Esta ação removerá este investimento permanentemente do seu patrimônio.',
            {
                title: 'Excluir Ativo?',
                type: 'danger',
                confirmText: 'Excluir'
            }
        );

        if (!confirmed) return;

        try {
            const { error } = await window.supabase.from('ativos').delete().eq('id', id);
            if (error) throw error;

            showToast('Ativo removido.', 'success');
            await this.loadAssets();
        } catch (err) {
            console.error('Erro ao deletar ativo:', err);
            showToast('Erro ao remover ativo.', 'error');
        }
    }
};

// Tornar Global
window.Investments = Investments;
window.renderInvestments = () => Investments.render();

