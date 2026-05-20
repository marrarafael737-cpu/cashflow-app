/* js/events.js - Event Listeners & Interactive Handlers */

function setupCategoryFormEvents(userId) {
    const handleCategorySubmit = async (e, formElement, isView) => {
        e.preventDefault();
        if (typeof triggerHaptic === 'function') triggerHaptic(50);

        const btn = formElement.querySelector('button[type="submit"]');
        if (btn && (btn.disabled || btn.classList.contains('loading'))) return;
        if (btn) { btn.classList.add('loading'); btn.disabled = true; }

        const nome = document.getElementById(isView ? 'cat-nome-view' : 'cat-nome').value;
        const tipo = document.getElementById(isView ? 'cat-tipo-view' : 'cat-tipo').value;

        const { error } = await supabase.from('categorias').insert([{
            nome, tipo, user_id: userId
        }]);

        if (!error) {
            showToast('Categoria criada com sucesso!', 'success');
            formElement.reset();
            if (typeof initializeCategories === 'function') await initializeCategories(userId);
            if (typeof renderCategories === 'function') renderCategories();
            if (typeof addXP === 'function') addXP(5); // XP por organizar categorias
        } else {
            showToast('Erro ao criar categoria.', 'error');
        }
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    };

    const form = document.getElementById('category-form');
    if (form) {
        form.addEventListener('submit', (e) => handleCategorySubmit(e, form, false));
    }

    const formView = document.getElementById('category-form-view');
    if (formView) {
        formView.addEventListener('submit', (e) => handleCategorySubmit(e, formView, true));
    }
}

async function renderCategories() {
    const renderHtml = (!_categories || _categories.length === 0) ? 
        '<p style="text-align:center; color:var(--color-text-muted); padding: 1rem; font-size: 0.8rem;">Nenhuma categoria personalizada.</p>' 
        : _categories.map(c => {
        const config = getCategoryConfig(c.nome);
        return `
            <div class="mini-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--color-border);">
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 500;">${escapeHTML(c.nome)}</div>
                        <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">${c.tipo === 'entrada' ? 'Receita' : 'Despesa'}</div>
                    </div>
                </span>
                <button class="btn-icon-danger" onclick="handleDeleteCategory('${c.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');

    const list = document.getElementById('categorias-list');
    if (list) list.innerHTML = renderHtml;

    const listView = document.getElementById('categorias-list-view');
    if (listView) listView.innerHTML = renderHtml;
}

async function handleDeleteCategory(id) {
    const confirmed = await confirmPremium('Excluir esta categoria? TransaÃ§Ãµes vinculadas serÃ£o preservadas (ficarÃ£o sem categoria).', {
        title: 'Excluir Categoria',
        type: 'danger'
    });
    if (!confirmed) return;
    try {
        const { error: moveError } = await supabase.from('transacoes').update({ categoria_id: null }).eq('categoria_id', id);
        if (moveError) console.warn('Falha ao desvincular transaÃ§Ãµes, mas prosseguindo...', moveError);

        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (!error) {
            showToast('Categoria excluÃ­da.', 'info');
            const user = await getCurrentUser();
            if (user) {
                if (typeof initializeCategories === 'function') await initializeCategories(user.id);
                if (typeof renderCategories === 'function') renderCategories();
            }
        } else {
            showToast('Erro ao excluir categoria.', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

function setupAccountFormEvents(userId) {
    const form = document.getElementById('account-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof triggerHaptic === 'function') triggerHaptic(50);

            const editId = document.getElementById('edit-account-id').value;
            const nome = document.getElementById('account-nome').value;
            const saldo_inicial = parseFloat(document.getElementById('account-saldo').value.replace(',', '.')) || 0;
            const tipo = document.getElementById('account-tipo').value;
            const limiteRaw = document.getElementById('account-limite') ? document.getElementById('account-limite').value.replace(',', '.') : null;
            const limite = limiteRaw ? parseFloat(limiteRaw) : null;
            const dia_vencimento = parseInt(document.getElementById('account-vencimento').value) || null;
            const dia_fechamento = parseInt(document.getElementById('account-fechamento').value) || null;
            const is_reserva_emergencia = document.getElementById('account-is-reserva').checked;

            if (!nome) {
                showToast('O nome da conta Ã© obrigatÃ³rio.', 'alert');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            if (btn && (btn.disabled || btn.classList.contains('loading'))) return;
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }

            let result;
            if (editId) {
                // Atualizar conta existente
                result = await supabase.from('contas').update({
                    nome, saldo_inicial, tipo, limite, dia_vencimento, dia_fechamento, is_reserva_emergencia
                }).eq('id', editId);
            } else {
                // Criar nova conta
                const cor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                result = await supabase.from('contas').insert([{
                    nome, saldo_inicial, tipo, cor, user_id: userId, limite, dia_vencimento, dia_fechamento, is_reserva_emergencia
                }]);
            }

            const { error } = result;

            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

            if (!error) {
                showToast(editId ? 'Conta atualizada!' : 'Conta criada com sucesso!', 'success');
                form.reset();
                document.getElementById('edit-account-id').value = '';
                if (typeof loadContas === 'function') await loadContas(userId);
                document.getElementById('modal-account').classList.remove('active');
                if (typeof addXP === 'function' && !editId) addXP(10); // XP por nova conta
            } else {
                console.error('Erro Supabase Contas:', error);
                showToast('Erro ao salvar conta: ' + error.message, 'error');
            }
        });
    }
}

async function handleEditAccount(id) {
    const account = _contas.find(c => c.id === id);
    if (!account) return;

    // Abrir modal
    const modal = document.getElementById('modal-account');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);

        // Preencher formulÃ¡rio
        document.getElementById('edit-account-id').value = account.id;
        document.getElementById('account-nome').value = account.nome;
        document.getElementById('account-saldo').value = account.saldo_inicial;
        document.getElementById('account-tipo').value = account.tipo;

        document.getElementById('account-limite').value = account.limite || '';
        document.getElementById('account-vencimento').value = account.dia_vencimento || '';
        document.getElementById('account-fechamento').value = account.dia_fechamento || '';
        document.getElementById('account-is-reserva').checked = account.is_reserva_emergencia || false;
        document.getElementById('credit-card-settings').style.display = account.tipo === 'credito' ? 'block' : 'none';

        // Configurar botÃµes do modal
        const deleteBtn = document.getElementById('btn-delete-account');
        if (deleteBtn) deleteBtn.style.display = 'block';

        const submitBtn = document.getElementById('btn-account-submit');
        if (submitBtn) submitBtn.textContent = 'Salvar AlteraÃ§Ãµes';

        const modalTitle = modal.querySelector('h2');
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-wallet"></i> Editar Conta';

        // Trigger change event for credit card settings
        document.getElementById('account-tipo').dispatchEvent(new Event('change'));
    }
}

async function handleDeleteAccount() {
    const id = document.getElementById('edit-account-id').value;
    if (!id) return;

    const account = _contas.find(c => c.id === id);
    if (!account) return;

    const confirmed = await confirmPremium(`Deseja realmente excluir a conta "${account.nome}"? Esta aÃ§Ã£o removerÃ¡ a conta, mas as transaÃ§Ãµes vinculadas serÃ£o preservadas.`, {
        title: 'Excluir Conta',
        type: 'danger'
    });
    if (!confirmed) return;

    try {
        const btn = document.getElementById('btn-delete-account');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
        }

        const { error } = await supabase.from('contas').delete().eq('id', id);

        if (!error) {
            showToast('Conta excluÃ­da com sucesso!', 'info');
            document.getElementById('modal-account').classList.remove('active');
            setTimeout(() => {
                document.getElementById('modal-account').style.display = 'none';
            }, 300);

            const user = await getCurrentUser();
            if (user && typeof loadContas === 'function') {
                await loadContas(user.id);
                if (typeof loadTransactions === 'function') await loadTransactions(user.id);
            }
        } else {
            showToast('Erro ao excluir conta: ' + error.message, 'error');
        }
    } catch (err) {
        console.error('Erro ao excluir conta:', err);
        showToast('Erro inesperado ao excluir conta.', 'error');
    } finally {
        const btn = document.getElementById('btn-delete-account');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Excluir';
        }
    }
}

window.handleDeleteAccount = handleDeleteAccount;





function setupGoalsLogic(userId) {
    const form = document.getElementById('goal-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof triggerHaptic === 'function') triggerHaptic(50);

            const editId = document.getElementById('edit-goal-id').value;
            const nome = document.getElementById('goal-name').value;
            const valor_objetivo = parseFloat(document.getElementById('goal-target').value) || 0;
            const valor_atual = parseFloat(document.getElementById('goal-current').value) || 0;
            let prazo = document.getElementById('goal-deadline') ? document.getElementById('goal-deadline').value : null;
            if (prazo === "") prazo = null;

            if (!nome || valor_objetivo <= 0) {
                showToast('A meta deve ter um nome e um valor alvo maior que zero.', 'alert');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            if (btn && (btn.disabled || btn.classList.contains('loading'))) return;
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }

            let result;
            if (editId) {
                result = await supabase.from('metas').update({
                    nome, valor_objetivo, valor_atual, prazo
                }).eq('id', editId);
            } else {
                result = await supabase.from('metas').insert([{
                    nome, valor_objetivo, valor_atual, prazo, user_id: userId
                }]);
            }

            const { error } = result;

            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

            if (!error) {
                showToast('Meta definida com sucesso!', 'success');
                form.reset();
                if (typeof loadMetas === 'function') await loadMetas(userId);
                document.getElementById('modal-goal').classList.remove('active');
                if (typeof addXP === 'function') addXP(15); // XP por definir objetivos
            } else {
                console.error('Erro Supabase Metas:', error);
                showToast('Erro ao salvar meta: ' + (error.message || 'Verifique os dados.'), 'error');
            }
        });
    }
}

function initBudgetEvents(userId) {
    const form = document.getElementById('budget-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof triggerHaptic === 'function') triggerHaptic(50);
            const catId = document.getElementById('budget-category').value;
            const valorRaw = document.getElementById('budget-value').value.replace(',', '.');
            const valor = parseFloat(valorRaw);
            const now = new Date();

            if (!catId || isNaN(valor) || valor <= 0) {
                showToast('Selecione uma categoria e um valor limite vÃ¡lido.', 'alert');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            if (btn && (btn.disabled || btn.classList.contains('loading'))) return;
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }

            const { error } = await supabase.from('orcamentos').insert([{
                categoria_id: catId, valor_limite: valor, mes: now.getMonth() + 1, ano: now.getFullYear(), user_id: userId
            }]);

            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

            if (!error) {
                showToast('OrÃ§amento salvo!', 'success');
                await loadOrcamentos(userId);
                document.getElementById('modal-budget').classList.remove('active');
                if (typeof addXP === 'function') addXP(10); // XP por planejamento
            }
        });
    }
}

// FunÃ§Ãµes de ExclusÃ£o (Handlers Globais)
// handleDeleteAccount (legacy/grid) redireciona para a versÃ£o consolidada
async function handleDeleteAccountGrid(id, name) {
    const confirmed = await confirmPremium(`Deseja excluir a conta "${name}"?`, {
        title: 'Confirmar ExclusÃ£o',
        type: 'danger'
    });
    if (!confirmed) return;

    try {
        const { error } = await supabase.from('contas').delete().eq('id', id);
        if (!error) {
            showToast('Conta excluÃ­da.', 'info');
            const user = await getCurrentUser();
            if (user) {
                if (typeof loadContas === 'function') await loadContas(user.id);
                if (typeof loadTransactions === 'function') await loadTransactions(user.id);
            }
        } else {
            showToast('Erro ao excluir conta.', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleDeleteMeta(id) {
    const confirmed = await confirmPremium('Excluir esta meta?', { type: 'danger', title: 'Excluir Meta' });
    if (!confirmed) return;
    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (!error) {
        showToast('Meta removida.', 'info');
        const user = await getCurrentUser();
        if (user && typeof loadMetas === 'function') await loadMetas(user.id);
    }
}

async function handleDeleteOrcamento(id) {
    const confirmed = await confirmPremium('Excluir este orÃ§amento?', { type: 'danger', title: 'Excluir OrÃ§amento' });
    if (!confirmed) return;
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (!error) {
        showToast('OrÃ§amento excluÃ­do.', 'info');
        const user = await getCurrentUser();
        if (user && typeof loadOrcamentos === 'function') await loadOrcamentos(user.id);
    }
}

async function handleDeleteTransaction(id) {
    const confirmed = await confirmPremium('Deseja realmente excluir esta transaÃ§Ã£o?', { type: 'danger', title: 'Excluir TransaÃ§Ã£o' });
    if (!confirmed) return;
    
    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic([30, 50, 30]);

    // Caso seja uma transaÃ§Ã£o offline (ainda nÃ£o sincronizada)
    if (id && id.toString().startsWith('offline_')) {
        if (window.OfflineSync && typeof window.OfflineSync.removeFromQueueByTxId === 'function') {
            const removed = window.OfflineSync.removeFromQueueByTxId(id);
            if (removed) {
                showToast('TransaÃ§Ã£o pendente removida.', 'info');
                // Remover da memÃ³ria local e re-renderizar
                if (typeof _allTransactions !== 'undefined') {
                    window._allTransactions = _allTransactions.filter(t => t.id !== id);
                    if (typeof filterAndRenderData === 'function') filterAndRenderData();
                }
                return;
            }
        }
    }

    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (!error) {
        showToast('TransaÃ§Ã£o excluÃ­da com sucesso.', 'success');
        const user = await getCurrentUser();
        if (user) await loadTransactions(user.id);
    } else {
        showToast('Erro ao excluir transaÃ§Ã£o.', 'error');
    }
}

function setupCalendarLogic(userId) {
    // ImplementaÃ§Ã£o bÃ¡sica de navegaÃ§Ã£o de calendÃ¡rio se necessÃ¡rio
    console.log('CalendÃ¡rio operacional.');
}

// Novos listeners para Faturas, Parcelamentos e OCR
function setupEnhancementListeners(userId) {
    // Toggle Parcelas no Form de TransaÃ§Ã£o
    const formaPagamento = document.getElementById('forma-pagamento');
    const fieldParcelas = document.getElementById('field-parcelas');
    if (formaPagamento && fieldParcelas) {
        formaPagamento.addEventListener('change', (e) => {
            fieldParcelas.style.display = e.target.value === 'credito' ? 'block' : 'none';
        });
    }

    // Toggle ConfiguraÃ§Ãµes de CartÃ£o no Modal de Conta
    const accountTipo = document.getElementById('account-tipo');
    const creditSettings = document.getElementById('credit-card-settings');
    if (accountTipo && creditSettings) {
        accountTipo.addEventListener('change', (e) => {
            creditSettings.style.display = e.target.value === 'credito' ? 'block' : 'none';
        });
    }

    // OCR Trigger
    const btnOcr = document.getElementById('btn-ocr-trigger');
    const inputOcr = document.getElementById('input-ocr-file');
    if (btnOcr && inputOcr) {
        btnOcr.addEventListener('click', () => inputOcr.click());
        inputOcr.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && typeof handleOCR === 'function') {
                handleOCR(file, 'modal');
            }
        });
    }
}

async function handleDeleteRecurrence(id) {
    const confirmed = await confirmPremium('Deseja realmente cancelar esta recorrÃªncia?', { type: 'danger', title: 'Cancelar RecorrÃªncia' });
    if (!confirmed) return;

    try {
        const { error } = await supabase.from('recorrencias').delete().eq('id', id);
        if (!error) {
            showToast('RecorrÃªncia removida.', 'info');
            const user = await getCurrentUser();
            if (user) await loadRecorrencias(user.id);
        } else {
            showToast('Erro ao remover recorrÃªncia.', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

function setupRecurringEvents(userId) {
    console.log('Configurando eventos de recorrÃªncia para usuÃ¡rio:', userId);
    const form = document.getElementById('recurring-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('FormulÃ¡rio de recorrÃªncia enviado!');
            if (typeof triggerHaptic === 'function') triggerHaptic(50);

            const btn = form.querySelector('button[type="submit"]');
            if (btn && (btn.disabled || btn.classList.contains('loading'))) return;

            if (userId) {
                if (typeof handleAddRecurrence === 'function') {
                    await handleAddRecurrence(userId);
                } else {
                    console.error('FunÃ§Ã£o handleAddRecurrence nÃ£o encontrada!');
                }
            } else {
                console.error('userId nÃ£o fornecido para setupRecurringEvents!');
                showToast('Erro de autenticaÃ§Ã£o ao salvar.', 'error');
            }
        });
    } else {
        console.warn('FormulÃ¡rio recurring-form nÃ£o encontrado no DOM.');
    }
}

function setupParserEvents(userId) {
    const btnOpen = document.getElementById('btn-open-parser');
    const modal = document.getElementById('modal-parser');
    const textarea = document.getElementById('parser-text');
    const preview = document.getElementById('parser-preview');
    const btnConfirm = document.getElementById('btn-parser-confirm');

    if (!btnOpen || !modal || !textarea) return;

      textarea.addEventListener('input', () => {
        const text = textarea.value.trim();
        if (text.length > 5) {
            const parsed = SmartParser.parse(text);
            if (parsed && parsed.valor > 0) {
                document.getElementById('parser-preview-desc').textContent = parsed.descricao;
                document.getElementById('parser-preview-valor').textContent = formatCurrency(parsed.valor);

                // Colorir valor conforme o tipo
                const valorEl = document.getElementById('parser-preview-valor');
                if (parsed.tipo === 'entrada') {
                    valorEl.style.color = 'var(--color-success)';
                } else if (parsed.tipo === 'transferencia') {
                    valorEl.style.color = 'var(--color-primary)';
                } else {
                    valorEl.style.color = 'var(--color-danger)';
                }

                // UI Preview Telemetry Overlay
                const catEl = document.getElementById('parser-preview-cat');
                const accSelect = document.getElementById('parser-account-select');
                const accRow = accSelect ? accSelect.closest('div') : null;

                if (accRow) {
                    if (parsed.tipo_comando === 'transferencia') {
                        accRow.style.display = 'none';
                    } else {
                        accRow.style.display = 'flex';
                    }
                }

                if (parsed.tipo_comando === 'transferencia') {
                    catEl.innerHTML = `<strong>Comando:</strong> 🔄 Transferência | De ${parsed.conta_origem_nome || 'Origem'} para ${parsed.conta_destino_nome || 'Destino'}`;
                } else if (parsed.tipo_comando === 'parcelamento') {
                    catEl.innerHTML = `<strong>Comando:</strong> 💳 Parcelamento | ${parsed.parcelas_total}x de ${formatCurrency(parsed.valor)}<br><span style="font-size:0.7rem;color:var(--color-text-muted);">Categoria: ${parsed.categoria_nome || 'Geral'}</span>`;
                } else if (parsed.tipo_comando === 'recorrencia') {
                    catEl.innerHTML = `<strong>Comando:</strong> 📅 Recorrência | Todo mês dia ${parsed.dia_vencimento}<br><span style="font-size:0.7rem;color:var(--color-text-muted);">Categoria: ${parsed.categoria_nome || 'Geral'}</span>`;
                } else if (parsed.tipo_comando === 'meta') {
                    catEl.innerHTML = `<strong>Comando:</strong> 🎯 Meta | Aporte para ${parsed.meta_nome}<br><span style="font-size:0.7rem;color:var(--color-text-muted);">Categoria: ${parsed.categoria_nome || 'Geral'}</span>`;
                } else {
                    catEl.innerHTML = `Categoria: ${parsed.categoria_nome || 'Geral'}`;
                }

                // Atualizar o seletor de contas no preview
                if (accSelect && typeof _contas !== 'undefined') {
                    accSelect.innerHTML = _contas.map(c => `<option value="${c.id}" ${c.id === parsed.conta_id ? 'selected' : ''}>${c.nome}</option>`).join('');
                }

                // Update Confidence UI
                const confTag = document.getElementById('parser-confidence-tag');
                const confVal = document.getElementById('parser-confidence-value');
                if (confTag && confVal) {
                    const score = parsed.confidence || 0;
                    if (score >= 25) {
                        confVal.textContent = 'Confiança Alta';
                        confTag.style.background = 'rgba(16, 185, 129, 0.1)';
                        confTag.style.color = '#10B981';
                    } else if (score >= 10) {
                        confVal.textContent = 'Confiança Média';
                        confTag.style.background = 'rgba(245, 158, 11, 0.1)';
                        confTag.style.color = '#F59E0B';
                    } else {
                        confVal.textContent = 'Confiança Baixa (Revisão Sugerida)';
                        confTag.style.background = 'rgba(239, 68, 68, 0.1)';
                        confTag.style.color = '#EF4444';
                    }
                }

                preview.style.display = 'block';
                btnConfirm.disabled = false;
            } else {
                preview.style.display = 'none';
                btnConfirm.disabled = true;
            }
        } else {
            preview.style.display = 'none';
            btnConfirm.disabled = true;
        }
    });

    btnConfirm.addEventListener('click', async () => {
        if (btnConfirm.disabled || btnConfirm.classList.contains('loading')) return;

        const text = textarea.value.trim();
        const parsed = SmartParser.parse(text);
        if (!parsed || !parsed.valor) {
            showToast('Não foi possível identificar dados nesta mensagem.', 'alert');
            return;
        }

        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lançando...';
        btnConfirm.disabled = true;
        btnConfirm.classList.add('loading');

        // Usar a conta selecionada pelo usuário no dropdown (ou a detectada)
        const accSelect = document.getElementById('parser-account-select');
        let final_conta_id = accSelect ? accSelect.value : parsed.conta_id;
        let isCredit = false;

        if (!final_conta_id && typeof _contas !== 'undefined' && _contas.length > 0) {
            final_conta_id = _contas[0].id;
        }

        // Detectar se é crédito para setar forma_pagamento
        const selectedAcc = (typeof _contas !== 'undefined') ? _contas.find(c => c.id === final_conta_id) : null;
        if (selectedAcc && selectedAcc.tipo === 'credito') isCredit = true;

        try {
            // ROUTE 1: TRANSFERENCIA
            if (parsed.tipo_comando === 'transferencia') {
                if (!parsed.conta_origem_id || !parsed.conta_destino_id) {
                    showToast('Erro: Contas de origem e destino da transferência são obrigatórias.', 'alert');
                    throw new Error('Contas de transferência não definidas');
                }

                // Check offline
                if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
                    const transactionDebit = {
                        descricao: `${parsed.descricao} (Saída)`,
                        valor: parsed.valor,
                        tipo: 'saida',
                        categoria_id: parsed.categoria_id,
                        conta_id: parsed.conta_origem_id,
                        data: parsed.data,
                        forma_pagamento: 'dinheiro',
                        user_id: userId
                    };
                    const transactionCredit = {
                        descricao: `${parsed.descricao} (Entrada)`,
                        valor: parsed.valor,
                        tipo: 'entrada',
                        categoria_id: parsed.categoria_id,
                        conta_id: parsed.conta_destino_id,
                        data: parsed.data,
                        forma_pagamento: 'dinheiro',
                        user_id: userId
                    };

                    OfflineSync.addToQueue(transactionDebit);
                    OfflineSync.addToQueue(transactionCredit);

                    showToast('Lançamento de transferência em fila offline! 🔄', 'info');
                } else {
                    const { error } = await supabase.from('transacoes').insert([
                        {
                            user_id: userId,
                            descricao: `${parsed.descricao} (Saída)`,
                            valor: parsed.valor,
                            tipo: 'saida',
                            categoria_id: parsed.categoria_id,
                            conta_id: parsed.conta_origem_id,
                            data: parsed.data,
                            forma_pagamento: 'dinheiro'
                        },
                        {
                            user_id: userId,
                            descricao: `${parsed.descricao} (Entrada)`,
                            valor: parsed.valor,
                            tipo: 'entrada',
                            categoria_id: parsed.categoria_id,
                            conta_id: parsed.conta_destino_id,
                            data: parsed.data,
                            forma_pagamento: 'dinheiro'
                        }
                    ]);

                    if (error) throw error;
                    showToast('Transferência registrada com sucesso! 🔄', 'success');
                }

            // ROUTE 2: PARCELAMENTO
            } else if (parsed.tipo_comando === 'parcelamento') {
                const transactionsToInsert = [];
                for (let i = 1; i <= parsed.parcelas_total; i++) {
                    const dateObj = new Date(parsed.data + 'T00:00:00');
                    dateObj.setMonth(dateObj.getMonth() + (i - 1));
                    const shiftedDate = dateObj.toLocaleDateString('en-CA');

                    transactionsToInsert.push({
                        user_id: userId,
                        descricao: `${parsed.descricao} (${i}/${parsed.parcelas_total})`,
                        valor: parsed.valor,
                        tipo: parsed.tipo,
                        categoria_id: parsed.categoria_id,
                        conta_id: final_conta_id,
                        data: shiftedDate,
                        forma_pagamento: isCredit ? 'credito' : 'dinheiro',
                        parcelas_total: parsed.parcelas_total,
                        parcela_atual: i
                    });
                }

                if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
                    for (const tx of transactionsToInsert) {
                        OfflineSync.addToQueue(tx);
                    }
                    showToast('Lançamento parcelado em fila offline! 💳', 'info');
                } else {
                    const { error } = await supabase.from('transacoes').insert(transactionsToInsert);
                    if (error) throw error;
                    showToast(`Lançamento parcelado registrado com sucesso (${parsed.parcelas_total}x)! 💳`, 'success');
                }

            // ROUTE 3: RECORRENCIA
            } else if (parsed.tipo_comando === 'recorrencia') {
                if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
                    showToast('Erro: Comando de recorrência exige conexão ativa com a internet.', 'alert');
                    throw new Error('Sem internet para recorrência');
                }

                const { error } = await supabase.from('recorrencias').insert([{
                    descricao: parsed.descricao,
                    valor: parsed.valor,
                    tipo: parsed.tipo,
                    dia_vencimento: parsed.dia_vencimento,
                    categoria_id: parsed.categoria_id,
                    conta_id: final_conta_id,
                    user_id: userId,
                    status: 'ativo'
                }]);

                if (error) throw error;
                showToast('Regra de recorrência salva com sucesso! 📅', 'success');
                if (typeof loadRecorrencias === 'function') await loadRecorrencias(userId);

            // ROUTE 4: META
            } else if (parsed.tipo_comando === 'meta') {
                if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
                    showToast('Erro: Comando de aporte para meta exige conexão ativa com a internet.', 'alert');
                    throw new Error('Sem internet para meta');
                }

                if (!parsed.meta_id) {
                    showToast('Erro: Meta não encontrada para o aporte.', 'alert');
                    throw new Error('Meta ID indefinida');
                }

                // Increment meta
                const targetMeta = typeof _metas !== 'undefined' ? _metas.find(m => m.id === parsed.meta_id) : null;
                if (!targetMeta) {
                    showToast('Erro: Meta de destino não encontrada.', 'alert');
                    throw new Error('Meta não localizada na memória');
                }

                const novoValor = (parseFloat(targetMeta.valor_atual) || 0) + parsed.valor;
                const { error: metaErr } = await supabase.from('metas').update({
                    valor_atual: novoValor
                }).eq('id', parsed.meta_id);

                if (metaErr) throw metaErr;

                // Log outgoing transaction
                const { error: txErr } = await supabase.from('transacoes').insert([{
                    user_id: userId,
                    descricao: parsed.descricao,
                    valor: parsed.valor,
                    tipo: 'saida',
                    categoria_id: parsed.categoria_id,
                    conta_id: final_conta_id,
                    data: parsed.data,
                    forma_pagamento: isCredit ? 'credito' : 'dinheiro',
                    is_piggy: true
                }]);

                if (txErr) throw txErr;

                showToast(`Aporte na meta "${parsed.meta_nome}" registrado! 🎯`, 'success');
                if (typeof loadMetas === 'function') await loadMetas(userId);

            // DEFAULT: TRANSACAO PADRAO
            } else {
                if (typeof OfflineSync !== 'undefined' && !OfflineSync.isOnline()) {
                    const transactionData = {
                        descricao: parsed.descricao,
                        valor: parsed.valor,
                        tipo: parsed.tipo,
                        categoria_id: parsed.categoria_id,
                        conta_id: final_conta_id,
                        data: parsed.data,
                        forma_pagamento: isCredit ? 'credito' : 'dinheiro',
                        user_id: userId
                    };
                    OfflineSync.addToQueue(transactionData);
                    showToast('Lançamento via Oráculo em fila offline! 🧠', 'info');
                } else {
                    const { error } = await supabase.from('transacoes').insert([{
                        user_id: userId,
                        descricao: parsed.descricao,
                        valor: parsed.valor,
                        tipo: parsed.tipo,
                        categoria_id: parsed.categoria_id,
                        conta_id: final_conta_id,
                        data: parsed.data,
                        forma_pagamento: isCredit ? 'credito' : 'dinheiro'
                    }]);

                    if (error) throw error;
                    showToast('Lançamento via Oráculo realizado com sucesso! 🧠', 'success');
                }
            }

            // Clean & Close modal
            textarea.value = '';
            preview.style.display = 'none';
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);

            if (typeof loadTransactions === 'function') await loadTransactions(userId);
            if (typeof filterAndRenderData === 'function') filterAndRenderData();

        } catch (error) {
            console.error('Erro na execução do comando:', error);
            showToast('Erro ao processar: ' + error.message, 'error');
        } finally {
            btnConfirm.innerHTML = 'Confirmar Lançamento';
            btnConfirm.disabled = false;
            btnConfirm.classList.remove('loading');
        }
    });
}

// Tornar globais para uso no onclick do HTML renderizado
window.handleDeleteAccount = handleDeleteAccount;
window.handleEditAccount = handleEditAccount;
window.handleDeleteRecurrence = handleDeleteRecurrence;
window.handleDeleteCategory = handleDeleteCategory;
window.handleDeleteMeta = handleDeleteMeta;
window.handleDeleteOrcamento = handleDeleteOrcamento;
window.handleDeleteTransaction = handleDeleteTransaction;
window.setupRecurringEvents = setupRecurringEvents;
window.setupParserEvents = setupParserEvents;

async function handlePayRecurrenceEarly(id) {
    const r = _recorrencias.find(item => item.id === id);
    if (!r) return;

    const confirmed = await confirmPremium(`Deseja registrar o pagamento de "${r.descricao}" para este mÃªs agora?`, {
        title: 'Pagamento Antecipado',
        type: 'info',
        confirmText: 'Registrar Agora'
    });
    if (!confirmed) return;

    try {
        const todayStr = new Date().toLocaleDateString('en-CA');

        // 1. Criar a transaÃ§Ã£o
        const { error: transError } = await supabase.from('transacoes').insert([{
            user_id: r.user_id,
            descricao: `[MANUAL] ${r.descricao}`,
            valor: r.valor,
            tipo: r.tipo,
            categoria_id: r.categoria_id,
            conta_id: r.conta_id,
            data: todayStr,
            is_recurring_origin: true
        }]);

        if (transError) throw transError;

        // 2. Atualizar data do Ãºltimo pagamento
        const { error: updateError } = await supabase.from('recorrencias')
            .update({ ultimo_pagamento: todayStr })
            .eq('id', id);

        if (updateError) throw updateError;

        showToast(`Pagamento de ${r.descricao} registrado!`, 'success');

        const user = await getCurrentUser();
        if (user) {
            await loadRecorrencias(user.id);
            await loadTransactions(user.id);
            if (typeof renderRecurring === 'function') renderRecurring();
            if (typeof filterAndRenderData === 'function') filterAndRenderData();
        }
    } catch (err) {
        console.error(err);
        showToast('Erro ao processar pagamento antecipado.', 'error');
    }
}

window.handlePayRecurrenceEarly = handlePayRecurrenceEarly;

let _injectingDefaults = false; // Guard flag to prevent double-click duplicates

window.injectDefaultCategories = async function() {
    // Prevent concurrent calls (double-tap on mobile or fast double-click)
    if (_injectingDefaults) return;
    _injectingDefaults = true;

    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Pre-check: fetch existing categories to avoid duplicating names
        const { data: existing } = await supabase
            .from('categorias')
            .select('nome')
            .eq('user_id', user.id);

        const existingNames = new Set((existing || []).map(c => c.nome.toLowerCase()));

        const allDefaults = [
            { nome: 'Alimentação', tipo: 'saida', user_id: user.id },
            { nome: 'Moradia', tipo: 'saida', user_id: user.id },
            { nome: 'Lazer', tipo: 'saida', user_id: user.id },
            { nome: 'Saúde', tipo: 'saida', user_id: user.id },
            { nome: 'Transporte', tipo: 'saida', user_id: user.id },
            { nome: 'Salário', tipo: 'entrada', user_id: user.id }
        ];

        // Only insert categories that don't already exist
        const toInsert = allDefaults.filter(c => !existingNames.has(c.nome.toLowerCase()));

        if (toInsert.length === 0) {
            showToast('As categorias padrão já existem!', 'info');
            return;
        }

        const { error } = await supabase.from('categorias').insert(toInsert);
        if (!error) {
            showToast(`${toInsert.length} categoria(s) padrão adicionada(s)!`, 'success');
            if (typeof initializeCategories === 'function') await initializeCategories(user.id);
            if (typeof renderCategories === 'function') renderCategories();
        } else {
            showToast('Erro ao inserir padrões.', 'error');
        }
    } finally {
        // Always release the guard, even if an error occurs
        _injectingDefaults = false;
    }
};

