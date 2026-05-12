# Fase 17: Onboarding Interativo com C.A.S.H. Unit

## Objetivo
Transformar o aprendizado do app em uma experiência imersiva e guiada pelo mascote.

## Componentes
1. **Onboarding Controller**: Lógica central para gerenciar os passos do tour.
2. **Mascot Touring Mode**: Estilos CSS para permitir que o mascote se desloque livremente pela tela e aponte para elementos.
3. **Step Definition**: Lista de mensagens e seletores para cada funcionalidade principal.
4. **Trigger System**: Início automático para novos usuários e manual via botão "Ajuda".

## Fluxo do Tour:
1. **Início**: Centro da tela (Visão Geral).
2. **Saldo Hero**: Foco no cabeçalho.
3. **Barra de Busca**: Foco nos novos filtros da Fase 15.
4. **Contas**: Foco na gestão de carteiras.
5. **Metas**: Foco na gamificação de economia.
6. **Insights (Radar)**: Foco na análise comportamental.
7. **Lançamento**: Foco no formulário de transações.

## Arquivos Afetados:
- `dashboard.html`: Adição do botão de ajuda e container de onboarding se necessário.
- `main.js`: Implementação da engine do tour.
- `style.css`: Estilos de destaque (highlight) e animações de deslocamento do mascote.
