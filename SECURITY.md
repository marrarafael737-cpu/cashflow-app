# Guia de Segurança CashFlow 🛡️

Este documento descreve as medidas de segurança obrigatórias para garantir a proteção dos dados dos usuários no ambiente de produção.

## 🚨 Configuração de Banco de Dados (Supabase)

Como o CashFlow é uma aplicação client-side (SPA), a chave de API (`anon key`) é tecnicamente pública. Para impedir que um usuário acesse os dados de outro, você **DEVE** ativar o **Row Level Security (RLS)** no seu painel do Supabase.

### 1. Ativar RLS
Execute este comando no SQL Editor do Supabase para todas as tabelas:

```sql
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_acesso ENABLE ROW LEVEL SECURITY;
```

### 2. Criar Políticas de Acesso
Isso garante que o banco de dados só retorne linhas onde o `user_id` seja igual ao ID do usuário autenticado.

```sql
-- Exemplo para Transações
CREATE POLICY "Acesso Individual" ON transacoes
FOR ALL USING (auth.uid() = user_id);

-- Repetir para todas as outras tabelas (categorias, contas, metas, etc.)
```

## 🔐 Criptografia de Ponta a Ponta
O CashFlow já utiliza o **Web Crypto API (AES-GCM)** para criptografar informações sensíveis antes mesmo delas saírem do navegador do usuário. 

- **Onde está:** Veja `js/security-vault.js`.
- **Impacto:** Mesmo que o banco de dados seja comprometido, os dados criptografados permanecem ilegíveis sem a chave do dispositivo do usuário.

## 📱 Biometria & WebAuthn
O sistema está preparado para autenticação biométrica via `WebAuthn`.
- Certifique-se de que o domínio está rodando em **HTTPS**, caso contrário a API de biometria será bloqueada pelo navegador.

---
*Documento gerado automaticamente pela Auditoria de Segurança CashFlow.*
