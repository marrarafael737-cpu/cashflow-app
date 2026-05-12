# Plano de Execução — Fase 5: Insights Inteligentes

Este documento detalha o plano e a execução da quinta fase do aplicativo de controle financeiro.

## 🎯 Objetivo
Proporcionar inteligência financeira automática através da comparação de gastos entre meses e detecção de variações críticas.

## 🛠️ Arquitetura e Arquivos
- `dashboard.html`: Adição de seção dedicada aos "Insights da Inteligência Financeira".
- `style.css`: Estilização dos cards de insights e indicadores de variação.
- `main.js`: Lógica de processamento de dados históricos e cálculo de percentuais.

## 📋 Lista de Tarefas
- [x] Criar container de Insights no `dashboard.html`.
- [x] Implementar função `calculateInsights()` no `main.js`.
- [x] Desenvolver lógica para comparar o mês atual com o mês anterior.
- [x] Calcular variação percentual por categoria.
- [x] Destacar categorias com aumento de gastos superior a 10%.
- [x] Gerar mensagens amigáveis (ex: "Você economizou 15% em Transporte este mês!").
- [x] Exibir cards de insights dinâmicos no dashboard.

## 🧪 Critérios de Aceite
- O usuário deve ver uma lista de insights baseada nos dados reais.
- As variações positivas (economia) devem ser verdes, variações negativas (aumento de gastos) devem ser vermelhas.
- Se não houver dados suficientes para comparação, exibir mensagem informativa.
