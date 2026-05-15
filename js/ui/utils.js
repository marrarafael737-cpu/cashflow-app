/* js/ui/utils.js - Basic UI Utilities */

window.formatar = function(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
};

window.escapeHTML = function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

window.triggerConfetti = function() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff7a00', '#00ff88', '#ffffff']
        });
    }
};

window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (type === 'error' || type === 'alert') {
        if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(50);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        alert: '⚠️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '🔔'}</span>
        <span class="toast-message">${window.escapeHTML(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 10);

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

window.confirmPremium = function(message, options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        if (!modal) {
            resolve(confirm(message));
            return;
        }

        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconContainer = document.getElementById('confirm-icon');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');

        if (titleEl) titleEl.textContent = options.title || 'Confirmar Ação';
        if (messageEl) messageEl.textContent = message;
        
        if (iconContainer) {
            iconContainer.className = `confirm-icon ${options.type || 'warning'}`;
            const iconMap = { warning: 'fa-exclamation-triangle', danger: 'fa-trash-alt', info: 'fa-info-circle' };
            const iconClass = iconMap[options.type] || iconMap.warning;
            iconContainer.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }

        if (btnYes) {
            btnYes.textContent = options.confirmText || 'Confirmar';
            btnYes.style.background = options.type === 'danger' ? 'var(--color-danger)' : '';
        }
        if (btnNo) btnNo.textContent = options.cancelText || 'Cancelar';

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        if (typeof App !== 'undefined' && App.Utils.triggerHaptic) App.Utils.triggerHaptic(15);

        const onYes = () => cleanup(true);
        const onNo = () => cleanup(false);

        const cleanup = (value) => {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            btnYes.removeEventListener('click', onYes);
            btnNo.removeEventListener('click', onNo);
            resolve(value);
        };

        btnYes.addEventListener('click', onYes);
        btnNo.addEventListener('click', onNo);
        
        const onOutsideClick = (e) => {
            if (e.target === modal) {
                modal.removeEventListener('click', onOutsideClick);
                onNo();
            }
        };
        modal.addEventListener('click', onOutsideClick);
    });
};
