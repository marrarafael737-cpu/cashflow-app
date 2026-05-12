# Plano de Execução — Fase 9: Segurança e Privacidade (Fort Knox)

Este documento detalha o plano para implementar recursos avançados de segurança e privacidade no aplicativo.

## 🎯 Objetivo
Proteger os dados sensíveis do usuário contra olhares curiosos e fornecer transparência sobre o uso da conta.

## 🛠️ Arquitetura e Alterações
- **Banco de Dados (Supabase):**
  - Tabela `historico_acesso`:
    - `id` (uuid)
    - `user_id` (uuid)
    - `data_hora` (timestamp)
    - `ip_origem` (text)
    - `user_agent` (text)
- **Interface (`dashboard.html`):**
  - Adicionar botão **Eye-Hide** (Olho) no cabeçalho.
  - Criar Modal de **Bloqueio por PIN**.
  - Criar aba ou seção de **Segurança** nas configurações para listar o histórico de acessos.
- **Lógica (`main.js`):**
  - Função `togglePrivacy()`: Gerencia a classe `.privacy-active` no body.
  - Função `recordAccess()`: Registra o acesso ao carregar o dashboard.
  - Lógica de **Auto-Lock**: Bloqueia a tela com o PIN após X minutos de inatividade.

## 📋 Lista de Tarefas
- [ ] Implementar o botão de privacidade no Header do Dashboard.
- [ ] Criar a lógica de toggle que persiste a preferência no `localStorage`.
- [ ] Desenvolver o modal de PIN Overlay para "bloqueio rápido".
- [ ] Integrar a captura de informações de acesso (UserAgent) via Supabase.
- [ ] Estilizar o "Modo Borrado" para ser esteticamente agradável (Glassmorphism).

## 🔒 Regras de Negócio
- O **Modo Privacidade** deve ocultar: Saldo Total, Receitas/Despesas, Valores no Calendário e Valores de Metas.
- O **PIN** deve ser configurável pelo usuário (padrão 0000 para teste inicial).
