/* js/ui/navigation.js - Navigation & View Management */

window.switchView = function(target) {
    const mainContent = document.querySelector('.dashboard-main-content');
    if (!target || !mainContent) return;

    const currentViewName = mainContent.getAttribute('data-view') || 'dashboard';
    const currentActiveView = document.querySelector('.view-section.active');
    const targetView = document.getElementById(`view-${target}`) || document.querySelector(`.view-${target}`);

    // Se já estiver na view, não faz nada (evita re-animação desnecessária)
    if (currentViewName === target && currentActiveView?.id === `view-${target}`) {
        return;
    }

    console.log('C.A.S.H. Unit: Navegando para', target);

    if (typeof App !== 'undefined' && App.Utils.triggerHaptic) {
        App.Utils.triggerHaptic(15); // Feedback físico suave ao trocar de tela
    }

    if (!targetView) {
        console.warn('C.A.S.H. Unit: Target view not found:', target);
        return;
    }

    // Atualiza imediatamente o estado visual dos links de navegação para feedback instantâneo
    document.querySelectorAll('.nav-item, .nav-item-mobile, .mobile-nav-item').forEach(nav => {
        const navTarget = nav.getAttribute('data-target') || nav.getAttribute('data-view');
        if (navTarget === target) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    if (window.innerWidth <= 1024 && typeof window.closeSidebar === 'function') {
        window.closeSidebar();
    }

    // Scroll para o topo imediatamente
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Trigger Renders específicos da tela destino
    if (target === 'wallets' && typeof renderContas === 'function') renderContas();
    if (target === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
    if (target === 'goals' && typeof renderMetas === 'function') renderMetas();
    if (target === 'subscriptions' && typeof renderRecurring === 'function') renderRecurring();
    if (target === 'investments' && typeof renderInvestments === 'function') renderInvestments();
    if (target === 'dashboard' && typeof filterAndRenderData === 'function') {
        filterAndRenderData();
    }

    const performSync = () => {
        mainContent.setAttribute('data-view', target);
        document.querySelectorAll('.view-section').forEach(view => {
            if (view === targetView) {
                view.classList.add('active');
                view.style.display = 'block';
                view.style.position = '';
                view.style.top = '';
                view.style.left = '';
                view.style.width = '';
                view.style.transform = '';
                view.style.opacity = '';
            } else {
                view.classList.remove('active');
                view.style.display = 'none';
                view.style.position = '';
                view.style.top = '';
                view.style.left = '';
                view.style.width = '';
                view.style.transform = '';
                view.style.opacity = '';
            }
        });
    };

    // Failsafe: Garantir que o conteúdo volte a aparecer mesmo que o GSAP falhe
    const animationTimeout = setTimeout(() => {
        console.warn('C.A.S.H. Unit: Animation timeout reached. Forcing view switch.');
        performSync();
    }, 1000);

    if (typeof gsap !== 'undefined' && currentActiveView && currentActiveView !== targetView) {
        // Mapeamento ordenado para definir direção do slide (Esq -> Dir ou Dir -> Esq)
        const viewOrder = [
            'dashboard', 'wallets', 'categories', 'goals', 
            'subscriptions', 'transactions', 'investments', 
            'reports', 'calendar', 'security', 'profile'
        ];
        const currentIndex = viewOrder.indexOf(currentViewName);
        const targetIndex = viewOrder.indexOf(target);
        
        // Se targetIndex >= currentIndex, vamos para a direita (slide da direita para esquerda). Caso contrário, esquerda para direita.
        const direction = targetIndex >= currentIndex ? 1 : -1;

        // Configuração dos estilos para animar lado a lado absolute
        targetView.style.position = 'absolute';
        targetView.style.top = '0';
        targetView.style.left = '0';
        targetView.style.width = '100%';
        targetView.style.display = 'block';

        const origOverflow = mainContent.style.overflowX;
        mainContent.style.overflowX = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                clearTimeout(animationTimeout);
                performSync();
                mainContent.style.overflowX = origOverflow;
            }
        });

        // Tela antiga desliza para fora
        tl.to(currentActiveView, {
            xPercent: -100 * direction,
            opacity: 0,
            duration: 0.35,
            ease: "power2.inOut"
        }, 0);

        // Tela nova desliza para dentro
        tl.fromTo(targetView, {
            xPercent: 100 * direction,
            opacity: 0
        }, {
            xPercent: 0,
            opacity: 1,
            duration: 0.35,
            ease: "power2.inOut"
        }, 0);

    } else {
        clearTimeout(animationTimeout);
        performSync();
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

    // --- SMART MOBILE BOTTOM NAV HIDING ON SCROLL ---
    let lastScrollY = window.scrollY;
    const scrollThreshold = 12; // limite de pixels para evitar micro-scrolling acidental
    const mobileNav = document.querySelector('.bottom-nav-mobile');

    if (mobileNav) {
        window.addEventListener('scroll', () => {
            if (window.innerWidth > 1024) return; // Apenas em telas mobile/tablet
            
            const currentScrollY = window.scrollY;
            const deltaY = currentScrollY - lastScrollY;

            // Scroll para baixo: esconde a barra inferior (se passar de 60px do topo para evitar glitch no bounce)
            if (deltaY > scrollThreshold && currentScrollY > 60) {
                mobileNav.classList.add('bottom-nav-hidden');
            } 
            // Scroll para cima: mostra a barra inferior
            else if (deltaY < -scrollThreshold) {
                mobileNav.classList.remove('bottom-nav-hidden');
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }
};
