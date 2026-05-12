# Plano de Execução — Fase 8: Planejamento Avançado (Metas e Calendário)

Este documento detalha o plano para implementar a oitava fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Ativar e refinar os sistemas de **Metas de Economia** e **Calendário Financeiro**, permitindo que o usuário planeje o futuro e visualize seus gastos de forma temporal.

## 🛠️ Arquitetura e Alterações
- **Banco de Dados (Supabase):**
  - Tabela `metas`:
    - `id` (uuid)
    - `user_id` (uuid)
    - `nome` (text)
    - `valor_objetivo` (numeric)
    - `valor_atual` (numeric)
    - `prazo` (date)
- **Interface (`dashboard.html`):**
  - Ativar as seções de Metas e Calendário.
- **Lógica (`main.js`):**
  - Inicializar `setupGoalsLogic(user.id)` e `setupCalendarLogic(user.id)`.
  - Garantir que as funções de renderização operem com os dados reais do Supabase.

## 📋 Lista de Tarefas
- [ ] Ativar a inicialização no `DOMContentLoaded` do `main.js`.
- [ ] Implementar o modal de criação de metas.
- [ ] Implementar a lógica de adição de fundos a uma meta existente.
- [ ] Finalizar o heatmap de gastos no calendário.
- [ ] Garantir que o calendário atualize ao trocar de mês.

## 🧪 Critérios de Aceite
- O usuário visualiza o calendário com indicadores de gastos diários.
- O usuário cria e gerencia metas de economia com progresso visual.
