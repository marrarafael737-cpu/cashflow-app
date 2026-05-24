/* js/ui/modals.js - Modal Management & Loading States */

window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    if (typeof triggerHaptic === 'function') triggerHaptic(20);
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};

window.setupModalLogic = function() {
    const modals = document.querySelectorAll('.modal-overlay, .modal, .modal-premium');
    const closeBtns = document.querySelectorAll('.btn-close, .close-modal, .btn-close-premium, .btn-close-modal');

    const dashModalBtn = document.getElementById('btn-open-modal-orcamento');
    const budgetModal = document.getElementById('modal-budget');
    if (dashModalBtn && budgetModal) {
        dashModalBtn.addEventListener('click', () => window.openModal('modal-budget'));
    }

    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = budgetForm.querySelector('button');
            const originalText = btn.textContent;
            
            try {
                btn.disabled = true;
                btn.textContent = 'Salvando...';
                const categoryId = document.getElementById('budget-category').value;
                const limitValue = parseFloat(document.getElementById('budget-value').value);
                
                if (typeof saveBudget === 'function') {
                    await saveBudget(categoryId, limitValue);
                    window.closeModal('modal-budget');
                    budgetForm.reset();
                }
            } catch (err) {
                if (window.showToast) window.showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay, .modal, .modal-premium');
            if (modal) window.closeModal(modal.id);
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) window.closeModal(modal.id);
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('active')) window.closeModal(modal.id);
            });
        }
    });
};

window.showSkeletons = function(active) {
    const targets = [
        'total-balance', 'liquid-balance', 'credit-debt', 
        'projected-balance-hero', 'chart-mini-forecast',
        'accounts-list', 'insights-list', 'budgets-list'
    ];

    targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (active) el.classList.add('skeleton');
            else el.classList.remove('skeleton');
        }
    });

    const transList = document.getElementById('recent-transactions-list');
    if (transList && active) {
        transList.innerHTML = Array(5).fill(0).map(() => `
            <div class="skeleton" style="height: 60px; margin-bottom: 0.5rem; border-radius: 12px;"></div>
        `).join('');
    }
};
