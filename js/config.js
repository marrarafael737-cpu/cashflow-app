/* 
   js/config.js - Centralized Configuration
   -----------------------------------------
   AVISO DE SEGURANÇA: Esta chave é pública por design no Supabase (anon key),
   mas ela SÓ é segura se o Row Level Security (RLS) estiver ATIVO no banco de dados.
   
   Para produção: Utilize variáveis de ambiente (.env) via Vite/Webpack.
*/

const CONFIG = {
    SUPABASE_URL: 'https://wecvchpyutwjqxoeilgq.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY3ZjaHB5dXR3anF4b2VpbGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTAyMDMsImV4cCI6MjA5Mjk4NjIwM30.4S21MBDZZbPVhAkJG1pic6VgX2brqO251mN0pXuKvQ4',
    APP_VERSION: '1.2.0',
    ENVIRONMENT: 'production', // Alterar para 'production' antes do deploy
    DEBUG: false
};

// Congelar o objeto para evitar modificações acidentais em runtime
window.CONFIG = Object.freeze(CONFIG);

