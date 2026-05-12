# Plano de Execução — Fase 4: Relatórios e Gráficos

Este documento detalha o plano e a execução da quarta fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Proporcionar visualização de dados clara e dinâmica através de gráficos e filtros de período.

## 🛠️ Arquitetura e Arquivos
- `dashboard.html`: Atualizado com elementos `<canvas>` para o Chart.js e select de período.
- `style.css`: Atualizado com suporte a grids de gráficos responsivos.
- `main.js`: Atualizado com integração ao Chart.js e lógica de agrupamento de dados.

## 📋 Lista de Tarefas
- [x] Incluir biblioteca `Chart.js` via CDN no `dashboard.html`.
- [x] Adicionar componentes visuais para os gráficos no Dashboard.
- [x] Implementar filtro de período (Mês Atual, 3 Meses, Ano Atual, Tudo).
- [x] Desenvolver Gráfico de Pizza (Gastos por Categoria).
- [x] Desenvolver Gráfico de Barras (Comparativo Receitas vs Despesas).
- [x] Garantir atualização dinâmica dos gráficos ao inserir/deletar transações ou mudar o período.
