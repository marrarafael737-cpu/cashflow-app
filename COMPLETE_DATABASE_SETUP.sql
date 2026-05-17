-- CASHFLOW COMPLETE DATABASE SETUP (v1.0)
-- Este script cria todas as tabelas necessárias, adiciona colunas ausentes e configura o RLS.
-- Copie e cole este código no SQL Editor do seu projeto no Supabase.

-- 1. TABELA: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
    cor TEXT DEFAULT '#8395A7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA: subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA: contas
CREATE TABLE IF NOT EXISTS contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT 'corrente',
    saldo_inicial NUMERIC DEFAULT 0,
    cor TEXT DEFAULT '#FF7A00',
    limite NUMERIC DEFAULT 0,
    dia_vencimento INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA: transacoes
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    conta_id UUID REFERENCES contas(id) ON DELETE CASCADE,
    data DATE DEFAULT CURRENT_DATE,
    forma_pagamento TEXT,
    parcelas_total INTEGER DEFAULT 1,
    parcela_atual INTEGER DEFAULT 1,
    is_recurring_origin BOOLEAN DEFAULT FALSE,
    is_piggy BOOLEAN DEFAULT FALSE,
    is_split_loan BOOLEAN DEFAULT FALSE,
    split_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA: metas
CREATE TABLE IF NOT EXISTS metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    valor_objetivo NUMERIC NOT NULL,
    valor_atual NUMERIC DEFAULT 0,
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. TABELA: orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    valor_limite NUMERIC NOT NULL,
    mes INTEGER,
    ano INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA: recorrencias
CREATE TABLE IF NOT EXISTS recorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
    dia_vencimento INTEGER NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    conta_id UUID REFERENCES contas(id) ON DELETE CASCADE,
    ultimo_pagamento DATE,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABELA: historico_acesso
CREATE TABLE IF NOT EXISTS historico_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    user_agent TEXT,
    ip_origem TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8.5. TABELA: user_profiles (Gamificação)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    import_count INTEGER DEFAULT 0,
    predict_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8.6. TABELA: user_badges (Conquistas da Gamificação)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. HABILITAR RLS EM TUDO
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE ACESSO (POLICIES)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own categories') THEN
        CREATE POLICY "Users can only access their own categories" ON categorias FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own accounts') THEN
        CREATE POLICY "Users can only access their own accounts" ON contas FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own transactions') THEN
        CREATE POLICY "Users can only access their own transactions" ON transacoes FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own goals') THEN
        CREATE POLICY "Users can only access their own goals" ON metas FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own budgets') THEN
        CREATE POLICY "Users can only access their own budgets" ON orcamentos FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own recurring') THEN
        CREATE POLICY "Users can only access their own recurring" ON recorrencias FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own history') THEN
        CREATE POLICY "Users can only access their own history" ON historico_acesso FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own profile') THEN
        CREATE POLICY "Users can only access their own profile" ON user_profiles FOR ALL USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own badges') THEN
        CREATE POLICY "Users can only access their own badges" ON user_badges FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
