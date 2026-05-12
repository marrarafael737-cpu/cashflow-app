# Fase 13: Ferramentas de Análise Profissional (Cashflow Pro)

Esta fase foca em transformar o dashboard em uma ferramenta de consultoria financeira avançada, utilizando os dados existentes para gerar pontuações de saúde, previsões de aposentadoria e automação de poupança.

## 1. Financial Health Score (Radar Chart)
- **Métrica**: Nota de 0 a 100 baseada em 5 pilares:
    1. **Poupança**: % da renda que não é gasta.
    2. **Controle**: Aderência aos orçamentos definidos.
    3. **Foco**: Progresso médio nas metas ativas.
    4. **Disciplina**: Frequência de lançamentos e uso de categorias.
    5. **Liquidez**: Relação entre saldo disponível e gastos mensais.
- **Visual**: Gráfico de teia (Radar) usando Chart.js na seção do Oráculo.

## 2. Simulador de Liberdade Financeira
- **Cálculo**: Baseado na "Regra dos 4%" ou rendimento real de 0.6% ao mês.
- **Inputs**: Gastos mensais médios (automático) + Saldo Total (automático).
- **Output**: Quantos anos faltam para viver apenas de renda, considerando aportes mensais baseados no saldo positivo atual.

## 3. Piggy Bank (Arredondamento Automático)
- **Lógica**: Se ativado, cada transação de saída (ex: R$ 12,30) gera um "troco" para o próximo valor inteiro (R$ 0,70).
- **Ação**: Esse valor é automaticamente lançado como uma entrada em uma meta específica chamada "Reserva de Emergência".
- **Interface**: Interruptor (toggle) no Oráculo para ativar/desativar.

## Arquivos Afetados:
- `dashboard.html`: Novos containers para o Radar Chart e simulador.
- `style.css`: Estilização dos cards de análise e toggle do Piggy Bank.
- `main.js`: Lógica de cálculo do Score, simulador e hook de arredondamento no `handleSaveTransaction`.
