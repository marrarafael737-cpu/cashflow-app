/* auth.js - Supabase Authentication Logic */

// Initialize Supabase client lazily
let supabaseClientInstance = null;

function getSupabaseClient() {
    if (supabaseClientInstance) return supabaseClientInstance;
    
    const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('C.A.S.H. Unit: Supabase configuration missing in window.CONFIG');
        return null;
    }

    try {
        const clientCreator = window.supabase?.createClient || window.createClient;
        if (clientCreator) {
            supabaseClientInstance = clientCreator(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabase = supabaseClientInstance;
            return supabaseClientInstance;
        } else {
            console.error('C.A.S.H. Unit: Supabase library not found.');
            return null;
        }
    } catch (e) {
        console.error('C.A.S.H. Unit: Error initializing Supabase:', e);
        return null;
    }
}

// Helper to show messages - Integrated with Premium Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toast-container';
        document.body.appendChild(newContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const escapedMessage = window.escapeHTML ? window.escapeHTML(message) : message;
    toast.innerHTML = `
        <div class="toast-content" style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas ${icon}"></i>
            <span>${escapedMessage}</span>
        </div>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => toast.classList.add('active'), 10);
    
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function showMessage(type, text) {
    showToast(text, type);
}

// Set loading state on button
function setLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Signup Logic
async function handleSignUp(email, password) {
    const client = getSupabaseClient();
    if (!client) {
        showMessage('error', 'Erro de configuração do sistema.');
        return;
    }

    setLoading('btn-submit', true);
    try {
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        if (data && data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error('Este e-mail já está cadastrado.');
        }
        
        showMessage('success', 'Cadastro realizado! Redirecionando...');
        
        if (data?.session) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            setLoading('btn-submit', false);
            showMessage('success', 'Verifique seu e-mail para confirmar a conta.');
        }
    } catch (error) {
        showMessage('error', error.message || 'Erro ao cadastrar.');
        setLoading('btn-submit', false);
    }
}

// Login Logic
async function handleLogin(email, password) {
    const client = getSupabaseClient();
    if (!client) {
        showMessage('error', 'Erro de configuração. Tente recarregar a página.');
        return;
    }

    setLoading('btn-submit', true);
    try {
        console.log('C.A.S.H. Unit: Tentando autenticação...');
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        // Log access in background - DON'T AWAIT THIS
        if (data.user) {
            recordAccessHistory(data.user.id).catch(e => console.warn('Access log failed:', e));
        }
        
        showMessage('success', 'Bem-vindo de volta! Sincronizando núcleo...');
        
        // Redirect faster but keep loading state
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);

    } catch (error) {
        console.error('C.A.S.H. Unit: Erro no login:', error.message);
        showMessage('error', error.message || 'Credenciais inválidas.');
        setLoading('btn-submit', false);
    }
}

// Logout Logic
async function handleLogout() {
    const client = getSupabaseClient();
    if (!client) return;
    try {
        await client.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error.message);
    }
}

// Record Access History - Now fully decoupled and non-blocking
async function recordAccessHistory(userId) {
    const client = getSupabaseClient();
    if (!client) return;
    
    try {
        const { error } = await client
            .from('historico_acesso')
            .insert({
                user_id: userId,
                user_agent: navigator.userAgent,
                ip_origem: 'Browser Client',
                localizacao: 'Web App'
            });
        if (error) console.warn('C.A.S.H. Unit: Log de acesso não gravado (RLS ou Tabela ausente).');
    } catch (e) {
        // Silently fail as this is not critical for the user login flow
    }
}

// Get Current User
async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
        const { data: { user } } = await client.auth.getUser();
        return user;
    } catch (e) {
        return null;
    }
}

// Expose functions
window.handleSignUp = handleSignUp;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = getCurrentUser;

// Mascot Auth Interactions
function initMascotAuthInteractions() {
    const msgEl = document.getElementById('auth-mascot-msg');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    if (!msgEl) return;

    const messages = {
        idle: "Identifique-se para acessar o núcleo.",
        email: "Estou verificando seu registro...",
        password: "Não se preocupe, sua senha está encriptada.",
        typing: "Excelente! Senha forte detectada."
    };

    emailInput?.addEventListener('focus', () => {
        msgEl.textContent = messages.email;
        gsap.to(".auth-mascot-svg", { scale: 1.05, duration: 0.3 });
    });
    
    passInput?.addEventListener('focus', () => {
        msgEl.textContent = messages.password;
        gsap.to(".auth-mascot-svg", { scale: 1.05, duration: 0.3 });
    });

    [emailInput, passInput].forEach(input => {
        input?.addEventListener('blur', () => {
            msgEl.textContent = messages.idle;
            gsap.to(".auth-mascot-svg", { scale: 1, duration: 0.3 });
        });
    });
}

// Auth UI Listeners
function setupAuthUI() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('cadastro-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const newPassForm = document.getElementById('new-password-form');
    const btnForgot = document.getElementById('btn-forgot-password');
    const btnCloseForgot = document.querySelector('.btn-close-forgot');

    // Link "Esqueci minha chave"
    if (btnForgot) {
        btnForgot.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('modal-forgot').style.display = 'flex';
        });
    }

    if (btnCloseForgot) {
        btnCloseForgot.addEventListener('click', () => {
            document.getElementById('modal-forgot').style.display = 'none';
        });
    }

    // Solicitar Reset de Senha
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const client = getSupabaseClient();
            
            setLoading('btn-forgot-submit', true);
            try {
                const { error } = await client.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + window.location.pathname,
                });
                if (error) throw error;
                showMessage('success', 'Link enviado! Verifique seu e-mail.');
                setTimeout(() => document.getElementById('modal-forgot').style.display = 'none', 2000);
            } catch (err) {
                showMessage('error', err.message);
            } finally {
                setLoading('btn-forgot-submit', false);
            }
        });
    }

    // Atualizar Senha (após clicar no link)
    if (newPassForm) {
        newPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-pass').value;
            const client = getSupabaseClient();

            if (newPassword.length < 6) {
                showMessage('error', 'A senha deve ter pelo menos 6 caracteres.');
                return;
            }

            setLoading('btn-new-pass-submit', true);
            try {
                const { error } = await client.auth.updateUser({ password: newPassword });
                if (error) throw error;
                showMessage('success', 'Senha atualizada com sucesso! Acessando...');
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
            } catch (err) {
                showMessage('error', err.message);
            } finally {
                setLoading('btn-new-pass-submit', false);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value;

            // Validação proativa de formato de e-mail
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('error', 'E-mail inválido. Certifique-se de incluir o @ e o domínio (ex: usuario@email.com).');
                return;
            }

            handleLogin(email, pass);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;

            // Validação proativa de formato de e-mail
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('error', 'E-mail inválido. Use o formato: usuario@email.com');
                return;
            }

            if (pass !== confirm) {
                showMessage('error', 'As senhas não coincidem!');
                return;
            }
            handleSignUp(email, pass);
        });
    }

    // Detecção de Recovery Token (Supabase coloca no Hash)
    const checkRecovery = () => {
        const hash = window.location.hash;
        if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
            const modalNew = document.getElementById('modal-new-password');
            if (modalNew) modalNew.style.display = 'flex';
        }
    };
    checkRecovery();
}

document.addEventListener('DOMContentLoaded', () => {
    initMascotAuthInteractions();
    setupAuthUI();
});
