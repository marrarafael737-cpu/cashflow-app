-- SQL Migration: Módulo de Patrimônio & Investimentos
-- CashFlow App

-- 1. Criar Tabela de Ativos
CREATE TABLE IF NOT EXISTS ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('renda_fixa', 'renda_variavel', 'fii', 'cripto', 'outros')),
    instituicao TEXT,
    valor_atual NUMERIC DEFAULT 0,
    custo_aquisicao NUMERIC DEFAULT 0,
    moeda TEXT DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modificar Tabela de Contas
ALTER TABLE contas ADD COLUMN IF NOT EXISTS categoria_conta TEXT DEFAULT 'corrente';
ALTER TABLE contas ADD COLUMN IF NOT EXISTS is_reserva_emergencia BOOLEAN DEFAULT false;

-- 3. Habilitar RLS para Ativos
ALTER TABLE ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assets"
ON ativos FOR ALL
USING (auth.uid() = user_id);

-- 4. Indexação para Performance
CREATE INDEX IF NOT EXISTS idx_ativos_user_id ON ativos(user_id);
