
const SUPABASE_URL = 'https://wecvchpyutwjqxoeilgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY3ZjaHB5dXR3anF4b2VpbGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTAyMDMsImV4cCI6MjA5Mjk4NjIwM30.4S21MBDZZbPVhAkJG1pic6VgX2brqO251mN0pXuKvQ4';

async function testSchema() {
    try {
        console.log('Verificando existência das colunas "limite" e "dia_vencimento"...');
        // Tentar selecionar as colunas específicas. Se elas não existirem, o PostgREST retornará erro 400.
        const response = await fetch(`${SUPABASE_URL}/rest/v1/contas?select=id,nome,limite,dia_vencimento&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            console.log('✅ TESTE PASSOU: As colunas existem e a tabela respondeu corretamente!');
        } else {
            const error = await response.json();
            console.error('❌ TESTE FALHOU: Erro ao tentar acessar as colunas.', error);
        }
    } catch (err) {
        console.error('Erro no script de teste:', err);
    }
}

testSchema();
