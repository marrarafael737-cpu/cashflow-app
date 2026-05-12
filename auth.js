/* auth.js - Supabase Authentication Logic */

const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
let supabaseClientInstance;
try {
    const clientCreator = window.supabase?.createClient || window.createClient;
    if (clientCreator) {
        supabaseClientInstance = clientCreator(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Expor como 'supabase' global para compatibilidade com os outros scripts
        window.supabase = supabaseClientInstance;
    } else {
        console.error('Supabase library not found. Please check the CDN link.');
    }
} catch (e) {
    console.error('Error initializing Supabase:', e);
}

window.supabaseClient = supabaseClientInstance; // Exposição adicional


// Helper to show messages - Integrated with Premium Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Se o container não existir, cria um dinamicamente
        const newContainer = document.createElement('div');
        newContainer.id = 'toast-container';
        document.body.appendChild(newContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 10);
    
    // Auto remove
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
    setLoading('btn-submit', true);
    try {
        const { data, error } = await supabaseClientInstance.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        showMessage('success', 'Cadastro realizado! Verifique seu e-mail para confirmar (se necessário) ou faça login.');
        
        // Auto redirect after short delay if session is active
        if (data?.session) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    } catch (error) {
        showMessage('error', error.message || 'Erro ao cadastrar.');
        setLoading('btn-submit', false);
    }
}

// Login Logic
async function handleLogin(email, password) {
    setLoading('btn-submit', true);
    try {
        const { data, error } = await supabaseClientInstance.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        // Registrar acesso na nova tabela
        if (data.user) {
            await recordAccessHistory(data.user.id);
        }
        
        showMessage('success', 'Login realizado com sucesso! Redirecionando...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showMessage('error', error.message || 'Erro ao fazer login.');
        setLoading('btn-submit', false);
    }
}

// Logout Logic
async function handleLogout() {
    try {
        const { error } = await supabaseClientInstance.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error.message);
    }
}

// Record Access History in Supabase
async function recordAccessHistory(userId) {
    try {
        const userAgent = navigator.userAgent;
        const { error } = await supabaseClientInstance
            .from('historico_acesso')
            .insert({
                user_id: userId,
                user_agent: userAgent,
                ip_origem: 'Browser Client',
                localizacao: 'Acesso via Web App'
            });
        if (error) console.warn('C.A.S.H. Unit: Erro ao gravar histórico de acesso:', error);
    } catch (e) {
        console.error('Falha ao registrar acesso:', e);
    }
}

// Get Current User
async function getCurrentUser() {
    if (!supabaseClientInstance || !supabaseClientInstance.auth) {
        console.error('Supabase client not initialized properly.');
        return null;
    }
    try {
        const { data: { user } } = await supabaseClientInstance.auth.getUser();
        return user;
    } catch (e) {
        console.error('Error fetching user:', e);
        return null;
    }
}

// Expose functions to window
window.handleSignUp = handleSignUp;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.getCurrentUser = getCurrentUser;

// Mascot Auth Interactions
function initMascotAuthInteractions() {
    const msgEl = document.getElementById('auth-mascot-msg');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const confirmPassInput = document.getElementById('confirm-password');

    if (!msgEl) return;

    const messages = {
        email: "Interessante... Esse e-mail parece válido.",
        password: "Não se preocupe, sua senha está encriptada.",
        confirm: "Quase lá! As senhas precisam coincidir.",
        success: "Acesso concedido! Bem-vindo de volta.",
        error: "Ocorreu uma falha na autenticação. Tente novamente."
    };

    emailInput?.addEventListener('focus', () => msgEl.textContent = "Estou verificando seu registro...");
    passInput?.addEventListener('focus', () => msgEl.textContent = messages.password);
    confirmPassInput?.addEventListener('focus', () => msgEl.textContent = messages.confirm);

    passInput?.addEventListener('input', (e) => {
        if (e.target.value.length > 0 && e.target.value.length < 6) {
            msgEl.textContent = "Essa senha parece curta demais...";
        } else if (e.target.value.length >= 6) {
            msgEl.textContent = "Excelente! Senha forte detectada.";
        }
    });
}

// Auth UI Listeners
function setupAuthUI() {
    console.log('C.A.S.H. Unit: Inicializando ouvintes de autenticação...');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('cadastro-form');

    if (loginForm) {
        console.log('C.A.S.H. Unit: Formulário de login detectado.');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('C.A.S.H. Unit: Tentativa de login iniciada.');
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            handleLogin(email, pass);
        });
    }

    if (signupForm) {
        console.log('C.A.S.H. Unit: Formulário de cadastro detectado.');
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('C.A.S.H. Unit: Tentativa de cadastro iniciada.');
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;

            if (pass !== confirm) {
                showMessage('error', 'As senhas não coincidem!');
                return;
            }
            handleSignUp(email, pass);
        });
    }
}

// Expose to window
window.setupAuthUI = setupAuthUI;

document.addEventListener('DOMContentLoaded', () => {
    initMascotAuthInteractions();
    setupAuthUI();
});
