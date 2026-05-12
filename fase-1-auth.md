# Plano de Execução — Fase 1: Autenticação + Estrutura Base

Este documento detalha o plano para implementar a primeira fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Criar um sistema de login/cadastro funcional integrado ao Supabase, com persistência de sessão e proteção de rotas.

## 🛠️ Arquitetura e Arquivos
- `login.html`: Tela de autenticação.
- `cadastro.html`: Tela de registro de novos usuários.
- `dashboard.html`: Tela principal do aplicativo (protegida).
- `style.css`: Estilização global e componentes (Tema: Grafite + Verde Neon).
- `auth.js`: Lógica de integração com o Supabase Auth.
- `main.js`: Lógica de inicialização e proteção de rotas.

## 🎨 Design Commitment
- **Estilo:** Fintech Brutalista / Moderno.
- **Geometria:** Bordas afiadas (0px - 2px) para um visual técnico e premium.
- **Paleta:** Fundo Grafite (#0F0F11), Acentos Verde Neon (#00FF66), Texto Branco/Cinza.
- **Animações:** Micro-interações nos inputs e transições suaves entre estados.

## 📋 Lista de Tarefas
- [x] Criar estrutura base de arquivos.
- [x] Configurar conexão com o Supabase em `auth.js`.
- [x] Implementar `style.css` com o design system.
- [x] Desenvolver `login.html` e `cadastro.html` com validações.
- [x] Implementar lógica de login/cadastro em `auth.js`.
- [x] Criar `dashboard.html` básico com botão de logout.
- [x] Validar persistência de sessão e redirecionamento em `main.js`.
