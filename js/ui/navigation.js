/* js/ui/navigation.js - Navigation & View Management */

window.switchView = function(target) {
    const mainContent = document.querySelector('.dashboard-main-content');
    if (!target || !mainContent) return;

    // Se já estiver na view, não faz nada (evita re-animação desnecessária)
    if (mainContent.getAttribute('data-view') === target && document.querySelector('.view-section.active')?.id === `view-${target}`) {
        return;
    }

    console.log('C.A.S.H. Unit: Navegando para', target);

    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) {
        App.Utils.triggerHaptic(30);
    }

    const performSwitch = () => {
        mainContent.setAttribute('data-view', target);
        
        document.querySelectorAll('.view-section').forEach(view => {
            if (view.id === `view-${target}` || view.classList.contains(`view-${target}`)) {
                view.classList.add('active');
                view.style.display = 'block';
            } else {
                view.classList.remove('active');
                view.style.display = 'none';
            }
        });

        document.querySelectorAll('.nav-item, .nav-item-mobile, .mobile-nav-item').forEach(nav => {
            const navTarget = nav.getAttribute('data-target') || nav.getAttribute('data-view');
            if (navTarget === target) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'auto' });
        
        if (window.innerWidth <= 1024 && typeof window.closeSidebar === 'function') {
            window.closeSidebar();
        }

        // Trigger Renders específicos
        if (target === 'wallets' && typeof renderContas === 'function') renderContas();
        if (target === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
        if (target === 'goals' && typeof renderMetas === 'function') renderMetas();
        if (target === 'subscriptions' && typeof renderRecurring === 'function') renderRecurring();
        if (target === 'investments' && typeof renderInvestments === 'function') renderInvestments();
        if (target === 'dashboard' && typeof filterAndRenderData === 'function') {
            filterAndRenderData();
        }
    };

    // Failsafe: Garantir que o conteúdo volte a aparecer mesmo que o GSAP falhe ou demore
    const animationTimeout = setTimeout(() => {
        console.warn('C.A.S.H. Unit: Animation timeout reached. Forcing view switch.');
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'none';
        performSwitch();
    }, 1000);

    if (typeof gsap !== 'undefined') {
        gsap.to(mainContent, {
            opacity: 0, y: 5, duration: 0.1, ease: "power1.in",
            onComplete: () => {
                clearTimeout(animationTimeout);
                performSwitch();
                gsap.fromTo(mainContent, 
                    { opacity: 0, y: 5 }, 
                    { opacity: 1, y: 0, duration: 0.2, ease: "power1.out" }
                );
            }
        });
    } else {
        clearTimeout(animationTimeout);
        performSwitch();
    }
};

window.setupNavigation = function() {
    // Usar Event Delegation para evitar múltiplos bindings e lidar com elementos dinâmicos
    document.removeEventListener('click', handleNavigationClick);
    document.addEventListener('click', handleNavigationClick);
};

function handleNavigationClick(e) {
    const navItem = e.target.closest('.nav-item, .nav-item-mobile, .mobile-nav-item');
    if (navItem) {
        const target = navItem.getAttribute('data-target') || navItem.getAttribute('data-view');
        if (target) {
            e.preventDefault();
            window.switchView(target);
        }
    }
}

window.setupMobileInteractions = function() {
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar-mobile');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar-mobile');
    const sidebar = document.querySelector('.sidebar-desktop');
    const overlay = document.getElementById('sidebar-backdrop');

    if (!sidebar || !overlay) return;
    
    sidebar.classList.remove('mobile-active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    overlay.addEventListener('click', () => window.closeSidebar());

    if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', (e) => { e.preventDefault(); window.openSidebar(); });
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', (e) => { e.preventDefault(); window.closeSidebar(); });

    window.openSidebar = () => {
        sidebar.classList.add('mobile-active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeSidebar = () => {
        sidebar.classList.remove('mobile-active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const actionsColumn = document.querySelector('.actions-column');
    const btnCloseActions = document.getElementById('btn-close-actions-mobile');
    if (btnCloseActions && actionsColumn) {
        btnCloseActions.addEventListener('click', () => actionsColumn.classList.remove('mobile-active'));
    }

    const navItemsList = sidebar.querySelectorAll('.nav-item');
    navItemsList.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) window.closeSidebar();
        });
    });
};
