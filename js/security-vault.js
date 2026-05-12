/* js/security-vault.js - The Fort Knox Module */

const SecurityVault = {
    // 1. Biometria (WebAuthn)
    async supportsBiometrics() {
        return window.PublicKeyCredential && 
               await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    },

    async registerBiometrics(userId) {
        if (!(await this.supportsBiometrics())) {
            throw new Error('Biometria não suportada neste dispositivo.');
        }

        // Nota: Em um ambiente de produção real com Supabase, isso envolveria 
        // salvar o 'credentialId' no banco. Aqui vamos simular o desafio local.
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const createCredentialOptions = {
            challenge,
            rp: { name: "CashFlow App", id: window.location.hostname },
            user: {
                id: Uint8Array.from(userId, c => c.charCodeAt(0)),
                name: "user@cashflow.com",
                displayName: "Usuário CashFlow"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000
        };

        const credential = await navigator.credentials.create({ publicKey: createCredentialOptions });
        localStorage.setItem(`biometrics_enabled_${userId}`, 'true');
        return credential;
    },

    async authenticateBiometrics(userId) {
        if (!localStorage.getItem(`biometrics_enabled_${userId}`)) return false;

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const getCredentialOptions = {
            challenge,
            allowCredentials: [], // Permitir qualquer credencial registrada no dispositivo
            userVerification: "required"
        };

        try {
            await navigator.credentials.get({ publicKey: getCredentialOptions });
            return true;
        } catch (e) {
            console.error('Falha na biometria:', e);
            return false;
        }
    },

    // 2. Criptografia de Campos (AES-GCM)
    async generateKey(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        
        return await window.crypto.subtle.importKey(
            'raw',
            hash,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    },

    async encryptData(text, pin) {
        const key = await this.generateKey(pin);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(text)
        );

        return {
            cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    },

    async decryptData(cipherText, ivText, pin) {
        try {
            const key = await this.generateKey(pin);
            const iv = Uint8Array.from(atob(ivText), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            return "[Erro de Decriptação - PIN Incorreto]";
        }
    },

    // 3. Gestão de Sessões (Supabase Bridge)
    async getActiveSessions(supabase) {
        // Nota: O Supabase Client JS não tem um método direto para listar sessões de outros dispositivos
        // por razões de segurança. Mas podemos simular via sua tabela 'historico_acesso'.
        const { data, error } = await supabase
            .from('historico_acesso')
            .select('*')
            .order('data_hora', { ascending: false })
            .limit(10);
        
        if (error) {
            console.warn('C.A.S.H. Unit: Tabela historico_acesso não encontrada ou erro de acesso.', error);
            return []; // Retorna lista vazia para não quebrar a UI
        }
        return data;
    },

    async logoutAllOtherSessions(supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'others' });
        if (error) throw error;
        return true;
    },

    async logAccess(supabase, userId) {
        try {
            await supabase.from('historico_acesso').insert([{
                user_id: userId,
                user_agent: navigator.userAgent,
                ip_origem: 'N/A', // IP real requer backend; aqui registramos o UA
                data_hora: new Date().toISOString()
            }]);
        } catch (e) {
            // Silencioso: não bloquear login se o log falhar
            console.warn('C.A.S.H. Unit: Não foi possível registrar log de acesso.', e);
        }
    }
};

window.SecurityVault = SecurityVault;

// Função global chamada pelo main.js ao inicializar
async function logSecurityAccess(userId) {
    if (window.SecurityVault && typeof window.SecurityVault.logAccess === 'function') {
        await SecurityVault.logAccess(supabase, userId);
    }
}
