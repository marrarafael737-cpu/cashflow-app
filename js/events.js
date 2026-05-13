/* js/events.js - Event Listeners & Interactive Handlers */

function setupCategoryFormEvents(userId) {
    const form = document.getElementById('category-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof triggerHaptic === 'function') triggerHaptic(50);
            
            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }
            
            const nome = document.getElementById('cat-nome').value;
            const tipo = document.getElementById('cat-tipo').value;

            const { error } = await supabase.from('categorias').insert([{
                nome, tipo, user_id: userId
            }]);

            if (!error) {
                showToast('Categoria criada com sucesso!', 'success');
                form.reset();
                if (typeof initializeCategories === 'function') await initializeCategories(userId);
                if (typeof renderCategories === 'function') renderCategories();
                if (typeof addXP === 'function') addXP(5); // XP por organizar categorias
            } else {
                showToast('Erro ao criar categoria.', 'error');
            }
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        });
    }
}

async function renderCategories() {
    const list = document.getElementById('categorias-list');
    if (!list) return;

    if (!_categories || _categories.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding: 1rem; font-size: 0.8rem;">Nenhuma categoria personalizada.</p>';
        return;
    }

    list.innerHTML = _categories.map(c => {
        const config = getCategoryConfig(c.nome);
        return `
            <div class="mini-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--color-border);">
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${config.color}20; color: ${config.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    ${escapeHTML(c.nome)}
                </span>
                <button class="btn-icon-plain" onclick="handleDeleteCategory('${c.id}')">
                    <i class="fas fa-trash" style="font-size: 0.8rem;"></i>
                </button>
            </div>
        `;
    }).join('');
}

async function handleDeleteCategory(id) {
    if (!confirm('Excluir esta categoria? Transações vinculadas poderão ficar sem categoria.')) return;
    try {
        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (!error) {
            showToast('Categoria excluída.', 'info');
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

            if (!nome) {
                showToast('O nome da conta é obrigatório.', 'alert');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }

            let result;
            if (editId) {
                // Atualizar conta existente
                result = await supabase.from('contas').update({
                    nome, saldo_inicial, tipo, limite, dia_vencimento
                }).eq('id', editId);
            } else {
                // Criar nova conta
                const cor = '#' + Math.floor(Math.random()*16777215).toString(16);
                result = await supabase.from('contas').insert([{
                    nome, saldo_inicial, tipo, cor, user_id: userId, limite, dia_vencimento
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
        
        // Preencher formulário
        document.getElementById('edit-account-id').value = account.id;
        document.getElementById('account-nome').value = account.nome;
        document.getElementById('account-saldo').value = account.saldo_inicial;
        document.getElementById('account-tipo').value = account.tipo;
        if (document.getElementById('account-limite')) document.getElementById('account-limite').value = account.limite || '';
        if (document.getElementById('account-vencimento')) document.getElementById('account-vencimento').value = account.dia_vencimento || '';
        
        // Trigger change event for credit card settings
        document.getElementById('account-tipo').dispatchEvent(new Event('change'));
    }
}




function setupGoalsLogic(userId) {
    const form = document.getElementById('goal-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof triggerHaptic === 'function') triggerHaptic(50);
            
            const nome = document.getElementById('goal-name').value;
            const valor_objetivo = parseFloat(document.getElementById('goal-target').value.replace(',', '.')) || 0;
            const valor_atual = parseFloat(document.getElementById('goal-current').value.replace(',', '.')) || 0;
            let prazo = document.getElementById('goal-deadline') ? document.getElementById('goal-deadline').value : null;
            if (prazo === "") prazo = null;

            if (!nome || valor_objetivo <= 0) {
                showToast('A meta deve ter um nome e um valor alvo maior que zero.', 'alert');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.classList.add('loading'); btn.disabled = true; }

            const { error } = await supabase.from('metas').insert([{
                nome, 
                valor_objetivo, 
                valor_atual, 
                prazo,
                user_id: userId
            }]);

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
                showToast('Selecione uma categoria e um valor limite válido.', 'alert');
                return;
            }

            const { error } = await supabase.from('orcamentos').insert([{
                categoria_id: catId, valor_limite: valor, mes: now.getMonth() + 1, ano: now.getFullYear(), user_id: userId
            }]);

            if (!error) {
                showToast('Orçamento salvo!', 'success');
                await loadOrcamentos(userId);
                document.getElementById('modal-budget').classList.remove('active');
                if (typeof addXP === 'function') addXP(10); // XP por planejamento
            }
        });
    }
}

// Funções de Exclusão (Handlers Globais)
async function handleDeleteAccount(id, name) {
    const displayName = name || 'esta conta';
    if (!confirm(`ATENÇÃO: Deseja realmente excluir "${displayName}"? Todas as transações vinculadas a esta conta também serão excluídas.`)) return;
    
    try {
        const { error } = await supabase.from('contas').delete().eq('id', id);
        if (!error) {
            showToast('Conta excluída.', 'info');
            const user = await getCurrentUser();
            if (user) {
                if (typeof loadContas === 'function') await loadContas(user.id);
                if (typeof loadTransactions === 'function') await loadTransactions(user.id);
                if (typeof renderWallets === 'function') renderWallets();
            }
        } else {
            showToast('Erro ao excluir conta: ' + error.message, 'error');
        }
    } catch (err) {
        console.error('Erro ao deletar conta:', err);
    }
}

async function handleDeleteMeta(id) {
    if (!confirm('Excluir esta meta?')) return;
    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (!error) {
        showToast('Meta removida.', 'info');
        const user = await getCurrentUser();
        if (user && typeof loadMetas === 'function') await loadMetas(user.id);
    }
}

async function handleDeleteOrcamento(id) {
    if (!confirm('Excluir este orçamento?')) return;
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (!error) {
        showToast('Orçamento excluído.', 'info');
        const user = await getCurrentUser();
        if (user && typeof loadOrcamentos === 'function') await loadOrcamentos(user.id);
    }
}

async function handleDeleteTransaction(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    if (typeof triggerHaptic === 'function') triggerHaptic([30, 50, 30]); // Pattern de erro/exclusão
    
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (!error) {
        showToast('Transação excluída com sucesso.', 'success');
        const user = await getCurrentUser();
        if (user) await loadTransactions(user.id);
    } else {
        showToast('Erro ao excluir transação.', 'error');
    }
}

function setupCalendarLogic(userId) {
    // Implementação básica de navegação de calendário se necessário
    console.log('Calendário operacional.');
}

// Novos listeners para Faturas, Parcelamentos e OCR
function setupEnhancementListeners(userId) {
    // Toggle Parcelas no Form de Transação
    const formaPagamento = document.getElementById('forma-pagamento');
    const fieldParcelas = document.getElementById('field-parcelas');
    if (formaPagamento && fieldParcelas) {
        formaPagamento.addEventListener('change', (e) => {
            fieldParcelas.style.display = e.target.value === 'credito' ? 'block' : 'none';
        });
    }

    // Toggle Configurações de Cartão no Modal de Conta
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
                handleOCR(file);
            }
        });
    }
}

async function handleDeleteRecurrence(id) {
    if (!confirm('Deseja realmente cancelar esta recorrência?')) return;
    
    try {
        const { error } = await supabase.from('recorrencias').delete().eq('id', id);
        if (!error) {
            showToast('Recorrência removida.', 'info');
            const user = await getCurrentUser();
            if (user) await loadRecorrencias(user.id);
        } else {
            showToast('Erro ao remover recorrência.', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

function setupRecurringEvents(userId) {
    console.log('Configurando eventos de recorrência para usuário:', userId);
    const form = document.getElementById('recurring-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulário de recorrência enviado!');
            if (typeof triggerHaptic === 'function') triggerHaptic(50);
            
            if (userId) {
                if (typeof handleAddRecurrence === 'function') {
                    await handleAddRecurrence(userId);
                } else {
                    console.error('Função handleAddRecurrence não encontrada!');
                }
            } else {
                console.error('userId não fornecido para setupRecurringEvents!');
                showToast('Erro de autenticação ao salvar.', 'error');
            }
        });
    } else {
        console.warn('Formulário recurring-form não encontrado no DOM.');
    }
}

function setupParserEvents(userId) {
    const btnOpen = document.getElementById('btn-open-parser');
    const modal = document.getElementById('modal-parser');
    const textarea = document.getElementById('parser-text');
    const preview = document.getElementById('parser-preview');
    const btnConfirm = document.getElementById('btn-parser-confirm');

    if (!btnOpen || !modal || !textarea) return;

    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    });

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

                document.getElementById('parser-preview-cat').textContent = 'Categoria: ' + (parsed.categoria_nome || 'Geral');
                document.getElementById('parser-preview-cat').innerHTML += `<br><span style="color: var(--color-text-muted); font-size: 0.65rem;">Conta: ${parsed.conta_nome || 'Padrão (1ª da lista)'}</span>`;
                
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
        const text = textarea.value.trim();
        const parsed = SmartParser.parse(text);
        if (!parsed || !parsed.valor) {
            showToast('Não foi possível identificar dados nesta mensagem.', 'alert');
            return;
        }

        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lançando...';
        btnConfirm.disabled = true;

        const conta_id = parsed.conta_id || (_contas.length > 0 ? _contas[0].id : null);

        const { error } = await supabase.from('transacoes').insert([{
            user_id: userId,
            descricao: parsed.descricao,
            valor: parsed.valor,
            tipo: parsed.tipo,
            categoria_id: parsed.categoria_id,
            conta_id: conta_id,
            data: parsed.data
        }]);

        if (!error) {
            showToast('Lançamento via Parser realizado!', 'success');
            textarea.value = '';
            preview.style.display = 'none';
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
            
            if (typeof loadTransactions === 'function') await loadTransactions(userId);
            if (typeof updateSummary === 'function') updateSummary();
        } else {
            showToast('Erro ao lançar: ' + error.message, 'error');
        }
        
        btnConfirm.innerHTML = 'Confirmar Lançamento';
        btnConfirm.disabled = false;
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
