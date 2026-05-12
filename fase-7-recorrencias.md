# Plano de Execução — Fase 7: Transações Recorrentes

Este documento detalha o plano para implementar a sétima fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Automatizar a gestão de gastos e receitas fixas (aluguel, mensalidades, salários) que ocorrem todos os meses, economizando tempo do usuário.

## 🛠️ Arquitetura e Alterações
- **Banco de Dados (Supabase):**
  - Nova tabela `transacoes_recorrentes`:
    - `id` (uuid)
    - `user_id` (uuid)
    - `descricao` (text)
    - `valor` (numeric)
    - `categoria_id` (uuid)
    - `dia_vencimento` (int, 1-31)
    - `tipo` (text: 'entrada' ou 'saida')
    - `proximo_lancamento` (date)
- **Interface (`dashboard.html`):**
  - Aba ou seção de "Gastos Fixos" na gestão de transações.
  - Modal de cadastro de recorrência.
- **Lógica (`main.js`):**
  - Sistema de verificação: ao carregar o dashboard, o app verifica se há transações recorrentes pendentes para o mês atual.
  - Botão de "Lançar Tudo" ou lançamento automático.

## 📋 Lista de Tarefas
- [x] Criar a tabela `transacoes_recorrentes` no Supabase.
- [x] Adicionar seção de gestão de recorrências na UI.
- [x] Implementar lógica de detecção de pendências.
- [x] Criar função para converter recorrência em transação real.
- [x] Adicionar indicadores de "Próximos Vencimentos" no resumo.

## 🧪 Critérios de Aceite
- O usuário cadastra uma conta (ex: Netflix) uma única vez.
- Todo mês, o sistema alerta ou lança automaticamente o gasto na data correta.
- O resumo mensal considera os gastos fixos previstos mesmo antes de serem lançados.
