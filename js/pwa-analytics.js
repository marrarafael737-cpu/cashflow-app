/* js/pwa-analytics.js - PWA Installation & PostHog Analytics */

let deferredPrompt;

// 1. PWA INSTALLATION LOGIC
window.addEventListener('beforeinstallprompt', (e) => {
    // Impedir que o Chrome mostre o prompt automático
    e.preventDefault();
    // Guardar o evento para disparar depois
    deferredPrompt = e;
    
    // Mostrar nosso botão de instalação personalizado
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            // Mostrar o prompt nativo
            deferredPrompt.prompt();
            
            // Esperar a escolha do usuário
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Usuário escolheu: ${outcome}`);
            
            if (outcome === 'accepted') {
                posthog.capture('pwa_installed');
            }
            
            // Resetar o prompt
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('CashFlow instalado com sucesso!');
    posthog.capture('app_installed_success');
});

// 2. WEB PUSH NOTIFICATIONS (BASIC SETUP)
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações.');
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('Permissão para notificações concedida.');
        posthog.capture('notifications_enabled');
        
        // Exemplo de notificação de boas-vindas
        new Notification('CashFlow Ativado!', {
            body: 'Agora você receberá alertas inteligentes do Oráculo.',
            icon: 'assets/mascot.svg'
        });
    }
}

// 3. ANALYTICS WRAPPER (POSTHOG)
function trackEvent(eventName, properties = {}) {
    if (window.posthog) {
        posthog.capture(eventName, properties);
    }
}

// Interceptar eventos chave para Analytics
document.addEventListener('DOMContentLoaded', () => {
    // Rastrear tempo de sessão ou visualizações de página se necessário
    // (O PostHog já faz autocapture, mas podemos adicionar eventos manuais)
    
    // Se o usuário clicar em exportar PDF
    const oldExportPDF = window.exportToPDF;
    window.exportToPDF = function() {
        trackEvent('report_exported_pdf');
        if (oldExportPDF) oldExportPDF();
    };

    // Se o usuário clicar em exportar Excel
    const oldExportExcel = window.exportToExcel;
    window.exportToExcel = function() {
        trackEvent('report_exported_excel');
        if (oldExportExcel) oldExportExcel();
    };
});

// Exportar para escopo global
window.requestNotificationPermission = requestNotificationPermission;
window.trackEvent = trackEvent;
