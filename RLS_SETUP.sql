-- SUPABASE RLS SETUP - APP FINANCEIRO (CASHFLOW)
-- Este script habilita a Segurança em Nível de Linha (RLS) para todas as tabelas e define as políticas de acesso.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'categorias'
CREATE POLICY "Users can only access their own categories" ON categorias
    FOR ALL USING (auth.uid() = user_id);

-- 3. Políticas para 'subcategorias'
CREATE POLICY "Users can only access their own subcategories" ON subcategorias
    FOR ALL USING (auth.uid() = user_id);

-- 4. Políticas para 'contas'
CREATE POLICY "Users can only access their own accounts" ON contas
    FOR ALL USING (auth.uid() = user_id);

-- 5. Políticas para 'metas'
CREATE POLICY "Users can only access their own goals" ON metas
    FOR ALL USING (auth.uid() = user_id);

-- 6. Políticas para 'orcamentos'
CREATE POLICY "Users can only access their own budgets" ON orcamentos
    FOR ALL USING (auth.uid() = user_id);

-- 7. Políticas para 'recorrencias'
CREATE POLICY "Users can only access their own recurring transactions" ON recorrencias
    FOR ALL USING (auth.uid() = user_id);

-- 8. Políticas para 'transacoes'
CREATE POLICY "Users can only access their own transactions" ON transacoes
    FOR ALL USING (auth.uid() = user_id);

-- NOTA: Certifique-se de que todas as tabelas tenham a coluna 'user_id' do tipo UUID.
-- Caso alguma tabela não possua a coluna, utilize o comando abaixo:
-- ALTER TABLE nome_da_tabela ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
