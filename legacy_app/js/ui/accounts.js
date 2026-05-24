/* js/ui/accounts.js - Wallet & Account Cards Rendering */

window.getAccountIcon = function(tipo) {
    const icons = {
        corrente: "fas fa-university",
        poupanca: "fas fa-piggy-bank",
        investimento: "fas fa-chart-line",
        dinheiro: "fas fa-wallet",
        credito: "fas fa-credit-card"
    };
    return icons[tipo] || "fas fa-wallet";
};

window.renderContas = function() {
    const grid = document.getElementById("wallets-grid");
    const dashList = document.getElementById("accounts-list");
    
    if (!grid && !dashList) return;

    if (typeof _contas === 'undefined' || !_contas || _contas.length === 0) {
        const emptyHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon-wrapper">
                    <i class="fas fa-wallet"></i>
                </div>
                <h4>Nenhuma conta cadastrada</h4>
                <p>Você precisa de pelo menos uma conta ou carteira para começar a organizar seus fluxos.</p>
                <button class="btn-primary-action" style="width: auto; padding: 0.75rem 2rem;" onclick="document.getElementById('btn-open-modal-conta').click()">Cadastrar Carteira</button>
            </div>
        `;
        if (grid) grid.innerHTML = emptyHTML;
        if (dashList) dashList.innerHTML = emptyHTML;
        
        const radarPanel = document.getElementById("radar-allocation-panel");
        if (radarPanel) radarPanel.style.display = "none";
        return;
    }

    // Calculate total assets (positive balances only, excluding credit cards)
    const assetAccounts = _contas.filter(c => c.tipo !== 'credito' && (c.saldo_atual || 0) > 0);
    const totalAssets = assetAccounts.reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

    const cardsHTML = _contas.map(c => {
        const saldoFinal = c.saldo_atual || 0;
        const color = c.cor || "var(--color-primary)";
        const typeLabels = { corrente: 'Conta Corrente', poupanca: 'Poupança', investimento: 'Investimento', dinheiro: 'Dinheiro', credito: 'Cartão de Crédito' };
        const typeLabel = typeLabels[c.tipo] || 'Conta';

        if (c.tipo === 'credito') {
            const limit = parseFloat(c.limite) || 0;
            const totalSpent = Math.abs(Math.min(0, saldoFinal));
            const availableLimit = Math.max(0, limit - totalSpent);
            const usagePercent = limit > 0 ? Math.min((totalSpent / limit) * 100, 100) : 0;
            
            return `
                <div class="account-card type-credito" data-type="${c.tipo}" style="--card-color: ${color}">
                    <div class="card-chip"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="color: white; margin: 0; font-size: 1rem;">${window.escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${typeLabel}</span>
                        </div>
                        <div class="digital-core-node" style="--node-color: ${color}">
                            <div class="node-border-scanner"></div>
                            <div class="node-corner-led animate-pulse-slow"></div>
                            <div class="node-icon-wrapper">
                                <i class="fas ${c.icone || 'fa-credit-card'} node-icon-glow"></i>
                            </div>
                            <span class="node-tech-tag">CHIP</span>
                        </div>
                    </div>
                    <div style="margin: 1rem 0;">
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Fatura Atual</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: white; margin-top: 2px;" class="privacy-blur">${window.formatar(totalSpent)}</div>
                    </div>
                    <div class="limit-bar-container">
                        <div class="limit-info">
                            <span>Limite Disponível</span>
                            <span class="privacy-blur">${window.formatar(availableLimit)}</span>
                        </div>
                        <div class="limit-bar-bg">
                            <div class="limit-bar-fill" style="width: ${usagePercent}%;"></div>
                        </div>
                    </div>
                    <div class="card-footer-info">
                        <div>
                            <span style="display: block; font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase;">Fechamento</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: white;">Dia ${c.dia_fechamento || '—'}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase;">Vencimento</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-warning);">Dia ${c.dia_vencimento || '—'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn-ghost-small" style="flex: 1; border-color: rgba(255,255,255,0.1); color: white;" onclick="handleEditAccount('${c.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-ghost-small" style="flex: 1; border-color: ${color}; background: ${color}20; color: white;" onclick="handleOpenFaturas('${c.id}')">
                            <i class="fas fa-file-invoice-dollar"></i> Detalhes
                        </button>
                    </div>
                </div>`;
        } else {
            // Calculate proportional share in total assets
            const assetPercent = (totalAssets > 0 && saldoFinal > 0) ? ((saldoFinal / totalAssets) * 100).toFixed(1) : "0.0";
            
            return `
                <div class="account-card" data-type="${c.tipo}" style="--card-color: ${color}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="digital-core-node" style="--node-color: ${color}">
                            <div class="node-border-scanner"></div>
                            <div class="node-corner-led animate-pulse-slow"></div>
                            <div class="node-icon-wrapper">
                                <i class="fas ${c.icone || 'fa-wallet'} node-icon-glow"></i>
                            </div>
                            <span class="node-tech-tag">CORE</span>
                        </div>
                        <div style="text-align: right;">
                            <h4 style="margin: 0; font-size: 0.9rem;">${window.escapeHTML(c.nome)}</h4>
                            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${typeLabel}</span>
                        </div>
                    </div>
                    <div style="margin: 1.5rem 0;">
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">Saldo Disponível</span>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${saldoFinal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};" class="privacy-blur">${window.formatar(saldoFinal)}</div>
                        ${c.is_reserva_emergencia ? '<span class="badge-premium-blue" style="font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: rgba(0, 210, 255, 0.1); color: #00D2FF; margin-top: 5px; display: inline-block;"><i class="fas fa-shield-alt"></i> Reserva de Emergência</span>' : ''}
                    </div>
                    <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
                        <button class="btn-icon-premium" onclick="handleEditAccount('${c.id}')">
                            <i class="fas fa-cog"></i>
                        </button>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted);">Patrimônio: ${assetPercent}%</span>
                    </div>
                </div>`;
        }
    }).join("");

    if (grid) grid.innerHTML = cardsHTML;
    if (dashList) dashList.innerHTML = cardsHTML;
    if (typeof checkInvoiceDueDates === 'function') window.checkInvoiceDueDates();

    // Dynamically render asset allocation radar
    if (typeof window.renderRadarPatrimonio === 'function') {
        window.renderRadarPatrimonio();
    }
};

/* ==========================================================================
   RADAR DE ALOCAÇÃO DE PATRIMÔNIO (Fase 13 - Análise Pro)
   ========================================================================== */

window.renderRadarPatrimonio = function() {
    const radarPanel = document.getElementById("radar-allocation-panel");
    const radarSvg = document.getElementById("radar-svg");
    const legendList = document.getElementById("radar-legend-list");
    const readoutVal = document.getElementById("radar-readout-value");
    const readoutPct = document.getElementById("radar-readout-percent");

    if (!radarPanel || !radarSvg || !legendList) return;

    if (typeof _contas === 'undefined' || !_contas || _contas.length === 0) {
        radarPanel.style.display = "none";
        return;
    }

    // Filter accounts with positive balances that are not credit cards
    const assetAccounts = _contas.filter(c => c.tipo !== 'credito' && (c.saldo_atual || 0) > 0);
    
    if (assetAccounts.length === 0) {
        radarPanel.style.display = "none";
        return;
    }

    radarPanel.style.display = "block";

    // Consolidate balances by type
    const totals = {
        corrente: 0,
        poupanca: 0,
        investimento: 0,
        dinheiro: 0
    };

    assetAccounts.forEach(c => {
        if (totals[c.tipo] !== undefined) {
            totals[c.tipo] += (c.saldo_atual || 0);
        }
    });

    const totalAssets = Object.values(totals).reduce((a, b) => a + b, 0);
    
    if (totalAssets <= 0) {
        radarPanel.style.display = "none";
        return;
    }

    // Default readout displays total assets
    const defaultTextVal = window.formatar(totalAssets);
    readoutVal.textContent = defaultTextVal;
    readoutPct.textContent = "100%";

    const typeConfig = {
        corrente: { label: "Conta Corrente", color: "#00E5FF", icon: "fa-university" },
        poupanca: { label: "Poupança / Reserva", color: "#00D2FF", icon: "fa-piggy-bank" },
        investimento: { label: "Investimentos", color: "#FF9100", icon: "fa-chart-line" },
        dinheiro: { label: "Dinheiro Físico", color: "#00E676", icon: "fa-wallet" }
    };

    // Calculate angles and percentage
    const segments = [];
    Object.keys(totals).forEach(type => {
        const val = totals[type];
        if (val > 0) {
            segments.push({
                type: type,
                value: val,
                percent: (val / totalAssets) * 100,
                color: typeConfig[type].color,
                label: typeConfig[type].label,
                icon: typeConfig[type].icon
            });
        }
    });

    // Draw SVG Donut
    // Circumference = 2 * PI * 70 = ~439.823
    const R = 70;
    const C = 2 * Math.PI * R;
    let accumulatedPercent = 0;
    let svgContent = "";

    // Add a background glowing track circle
    svgContent += `<circle cx="110" cy="110" r="${R}" fill="transparent" stroke="rgba(255,255,255,0.03)" stroke-width="14" />`;

    segments.forEach((seg, index) => {
        const strokeDashArray = `${C}`;
        const strokeDashOffset = C - (seg.percent / 100) * C;
        // The rotation angle starts from -90deg (12 o'clock)
        const rotationAngle = (accumulatedPercent / 100) * 360 - 90;
        
        svgContent += `
            <circle class="radar-slice" 
                    cx="110" 
                    cy="110" 
                    r="${R}" 
                    fill="transparent" 
                    stroke="${seg.color}" 
                    stroke-width="14" 
                    stroke-dasharray="${strokeDashArray}" 
                    stroke-dashoffset="${strokeDashOffset}" 
                    transform="rotate(${rotationAngle} 110 110)"
                    stroke-linecap="round"
                    data-type="${seg.type}"
                    data-value="${window.formatar(seg.value)}"
                    data-percent="${seg.percent.toFixed(1)}%"
                    data-label="${seg.label}"
                    style="transition: stroke-width 0.3s ease, filter 0.3s ease; cursor: pointer;"
            />
        `;
        
        accumulatedPercent += seg.percent;
    });

    radarSvg.innerHTML = svgContent;

    // Render legend items
    legendList.innerHTML = segments.map(seg => {
        return `
            <div class="radar-legend-item" data-type="${seg.type}" style="--item-color: ${seg.color}">
                <div class="legend-color-indicator">
                    <i class="fas ${seg.icon}"></i>
                </div>
                <div class="legend-text-details">
                    <span class="legend-item-label">${seg.label}</span>
                    <span class="legend-item-value privacy-blur">${window.formatar(seg.value)}</span>
                </div>
                <div class="legend-item-badge">${seg.percent.toFixed(1)}%</div>
            </div>
        `;
    }).join("");

    // Attach Event Listeners for Slice Hover & Click
    const slices = radarSvg.querySelectorAll(".radar-slice");
    const legendItems = legendList.querySelectorAll(".radar-legend-item");

    const setReadout = (label, val, pct) => {
        const rLabel = radarPanel.querySelector(".readout-label");
        if (rLabel) rLabel.textContent = label;
        readoutVal.textContent = val;
        readoutPct.textContent = pct;
    };

    const resetReadout = () => {
        const rLabel = radarPanel.querySelector(".readout-label");
        if (rLabel) rLabel.textContent = "Patrimônio";
        readoutVal.textContent = defaultTextVal;
        readoutPct.textContent = "100%";
    };

    // Slices Hover & Click handlers
    slices.forEach(slice => {
        slice.addEventListener("mouseenter", () => {
            const label = slice.getAttribute("data-label");
            const val = slice.getAttribute("data-value");
            const pct = slice.getAttribute("data-percent");
            setReadout(label, val, pct);
            
            // Subtle highlight on this slice
            slice.style.strokeWidth = "18px";
            slice.style.filter = "drop-shadow(0 0 8px " + slice.getAttribute("stroke") + ")";
            
            // Highlight legend item
            const matchingLegend = legendList.querySelector(`.radar-legend-item[data-type="${slice.getAttribute("data-type")}"]`);
            if (matchingLegend) matchingLegend.classList.add("active-hover");
        });

        slice.addEventListener("mouseleave", () => {
            resetReadout();
            slice.style.strokeWidth = "14px";
            slice.style.filter = "none";
            
            const matchingLegend = legendList.querySelector(`.radar-legend-item[data-type="${slice.getAttribute("data-type")}"]`);
            if (matchingLegend) matchingLegend.classList.remove("active-hover");
        });

        slice.addEventListener("click", () => {
            const type = slice.getAttribute("data-type");
            window.handleRadarFilter(type);
        });
    });

    // Legend items Hover & Click handlers
    legendItems.forEach(item => {
        const type = item.getAttribute("data-type");
        const matchingSlice = radarSvg.querySelector(`.radar-slice[data-type="${type}"]`);

        item.addEventListener("mouseenter", () => {
            if (matchingSlice) {
                const label = matchingSlice.getAttribute("data-label");
                const val = matchingSlice.getAttribute("data-value");
                const pct = matchingSlice.getAttribute("data-percent");
                setReadout(label, val, pct);
                
                matchingSlice.style.strokeWidth = "18px";
                matchingSlice.style.filter = "drop-shadow(0 0 8px " + matchingSlice.getAttribute("stroke") + ")";
            }
            item.classList.add("active-hover");
        });

        item.addEventListener("mouseleave", () => {
            resetReadout();
            if (matchingSlice) {
                matchingSlice.style.strokeWidth = "14px";
                matchingSlice.style.filter = "none";
            }
            item.classList.remove("active-hover");
        });

        item.addEventListener("click", () => {
            window.handleRadarFilter(type);
        });
    });
};

window.handleRadarFilter = function(type) {
    const grid = document.getElementById("wallets-grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".account-card");
    const clearBtn = document.getElementById("btn-clear-radar-filter");
    
    // Toggle active state in legend list
    const legendList = document.getElementById("radar-legend-list");
    if (legendList) {
        const items = legendList.querySelectorAll(".radar-legend-item");
        items.forEach(item => {
            if (item.getAttribute("data-type") === type) {
                item.classList.add("filter-active");
            } else {
                item.classList.remove("filter-active");
            }
        });
    }

    cards.forEach(card => {
        if (card.getAttribute("data-type") === type) {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
            card.style.pointerEvents = "auto";
        } else {
            card.style.opacity = "0.15";
            card.style.transform = "scale(0.96)";
            card.style.pointerEvents = "none";
        }
    });

    if (clearBtn) clearBtn.style.display = "inline-flex";
};

window.clearRadarFilter = function() {
    const grid = document.getElementById("wallets-grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".account-card");
    const clearBtn = document.getElementById("btn-clear-radar-filter");

    // Reset legend active states
    const legendList = document.getElementById("radar-legend-list");
    if (legendList) {
        const items = legendList.querySelectorAll(".radar-legend-item");
        items.forEach(item => {
            item.classList.remove("filter-active");
        });
    }

    cards.forEach(card => {
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
        card.style.pointerEvents = "auto";
    });

    if (clearBtn) clearBtn.style.display = "none";
};
