# Plano de Execução — Fase 6: Planejamento Orçamentário

Este documento detalha o plano para implementar a sexta fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Permitir que os usuários definam metas de gastos (orçamentos) por categoria para o mês atual e visualizem o progresso de consumo em tempo real.

## 🛠️ Arquitetura e Alterações
- **Banco de Dados (Supabase):**
  - Nova tabela `orcamentos`:
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key para users)
    - `categoria_id` (uuid, foreign key para categorias)
    - `valor_limite` (numeric)
    - `mes` (int)
    - `ano` (int)
- **Dashboard (`dashboard.html`):**
  - Nova seção "Orçamentos Mensais" acima dos gráficos.
  - Modal para definir/editar orçamentos por categoria.
- **Lógica (`main.js`):**
  - Funções para carregar orçamentos do Supabase.
  - Lógica para calcular o total gasto no mês atual por categoria.
  - Renderização de barras de progresso comparativas.

## 📋 Lista de Tarefas
- [x] Criar a tabela `orcamentos` no banco de dados.
- [x] Adicionar container de orçamentos no `dashboard.html`.
- [x] Criar modal de configuração de orçamento.
- [x] Implementar lógica `loadOrcamentos()` e `renderOrcamentos()` em `main.js`.
- [x] Desenvolver sistema de alertas visuais (Verde < 80%, Amarelo 80-99%, Vermelho >= 100%).
- [x] Garantir que os orçamentos se atualizem ao adicionar novas transações.

## 🧪 Critérios de Aceite
- O usuário deve conseguir definir um limite para qualquer categoria existente.
- O dashboard deve exibir claramente quanto do orçamento já foi consumido.
- Se o gasto ultrapassar o limite, o indicador deve ficar vermelho.
