# Plano de Execução — Fase 3: Categorias e Subcategorias

Este documento detalha o plano e a execução da terceira fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Organizar os dados financeiros através de Categorias e Subcategorias dinâmicas vinculadas ao usuário.

## 🛠️ Arquitetura e Arquivos
- `dashboard.html`: Atualizado com dropdowns de Categoria/Subcategoria no formulário e modal de gerenciamento.
- `style.css`: Atualizado com estilos para o modal e lista de categorias.
- `main.js`: Atualizado com a lógica de sementeira (seed), carregamento e CRUD de categorias.

## 📋 Lista de Tarefas
- [x] Criar tabelas `categorias` e `subcategorias` no Supabase com RLS.
- [x] Alterar tabela `transacoes` para incluir `categoria_id` e `subcategoria_id`.
- [x] Atualizar `dashboard.html` com os novos campos e o modal de gestão.
- [x] Implementar lógica de Categorias Padrão (Seed) para novos usuários.
- [x] Desenvolver dropdowns dinâmicos baseados no tipo de transação.
- [x] Permitir a criação e exclusão de categorias/subcategorias personalizadas.

## 🔒 Segurança (RLS)
Políticas aplicadas às novas tabelas:
- `auth.uid() = user_id` para SELECT, INSERT, UPDATE e DELETE em ambas as tabelas.
