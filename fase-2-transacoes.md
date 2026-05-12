# Plano de Execução — Fase 2: Transações (CRUD)

Este documento detalha o plano e a execução da segunda fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Registrar receitas e despesas vinculadas ao usuário logado, com atualização automática do saldo e interface moderna.

## 🛠️ Arquitetura e Arquivos
- `dashboard.html`: Atualizado com formulário de transações e tabela de histórico.
- `style.css`: Atualizado com estilos para o grid do dashboard, cards de resumo e tabela.
- `main.js`: Atualizado com a lógica de buscar, inserir e deletar transações no Supabase.

## 📋 Lista de Tarefas
- [x] Criar tabela `transacoes` no Supabase com RLS (Row Level Security).
- [x] Atualizar `dashboard.html` com o layout de duas colunas (Resumo/Lista + Formulário).
- [x] Implementar estilos responsivos para o CRUD em `style.css`.
- [x] Desenvolver lógica de inserção de transações vinculadas ao `user_id`.
- [x] Implementar listagem dinâmica de transações do usuário logado.
- [x] Criar função de exclusão de transações.
- [x] Calcular e exibir o saldo total (Receitas - Despesas).

## 🔒 Segurança (RLS)
As seguintes políticas foram aplicadas à tabela `transacoes`:
- `auth.uid() = user_id` para SELECT, INSERT e DELETE.
