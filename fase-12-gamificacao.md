# Plano de Execução — Fase 12: Gamificação e Cyber-Evolution

Este documento detalha o plano para implementar o sistema de gamificação e evolução visual do mascote C.A.S.H. Unit.

## 🎯 Objetivo
Aumentar o engajamento do usuário através de mecânicas de jogo, recompensando o bom comportamento financeiro com evoluções visuais e conquistas.

## 🛠️ Arquitetura e Alterações
- **Banco de Dados (Supabase):**
  - Tabela `gamificacao`:
    - `user_id` (uuid, PK)
    - `xp` (integer) - Pontos de experiência.
    - `nivel` (integer) - Nível atual (1 a 4).
    - `streak_dias` (integer) - Dias consecutivos de acesso.
    - `ultimo_acesso` (date)
    - `conquistas` (text[], array de slugs de conquistas)
- **Interface (`dashboard.html`):**
  - Adicionar seção de **Conquistas (Badges)** abaixo das Metas.
  - Adicionar barra de progresso de Nível ao lado do Mascote.
  - Criar estados visuais no SVG do mascote para cada nível.
- **Lógica (`main.js`):**
  - Função `updateXP(userId, action)`: Adiciona XP por ações (cadastrar transação, bater meta, acesso diário).
  - Função `checkLevelUp(userId)`: Verifica se o XP atingiu o próximo nível e dispara a animação de evolução.
  - Função `calculateStreak(userId)`: Gerencia o contador de dias seguidos.

## 📋 Lista de Tarefas
- [ ] Criar a tabela `gamificacao` no Supabase (via SQL manual se necessário).
- [ ] Implementar a lógica de evolução visual do SVG via CSS (classes `lvl-2`, `lvl-3`, `lvl-4`).
- [ ] Adicionar a seção de Badges na barra lateral ou em um novo card.
- [ ] Criar lógica para detectar "Investidor Iniciante" (Primeira meta criada/poupada).
- [ ] Criar lógica para "Mestre da Economia" (30 dias sem ultrapassar orçamentos).
- [ ] Adicionar animações GSAP para a evolução do mascote.

## 🎭 Níveis de Evolução
1. **Nível 1 (Recruta):** Visual padrão âmbar.
2. **Nível 2 (Sincronizado):** Adição de Aura Pulsante e olhos mais expressivos.
3. **Nível 3 (Cibernético):** Armadura lateral no SVG e cores em degradê degradê azul/roxo.
4. **Nível 4 (Lendário):** Asas de luz neon e coroa digital.
