# Plano de Execução — Fase 11: Inteligência e Automação (Oráculo)

Este documento detalha o plano para implementar recursos de automação e análise preditiva.

## 🎯 Objetivo
Reduzir o esforço manual do usuário e fornecer visibilidade sobre o futuro financeiro do mês.

## 🛠️ Arquitetura e Alterações
- **Importação de Dados:**
  - Adicionar botão **Importar CSV/OFX** na seção de transações.
  - Implementar o `Parser` de arquivos no frontend (sem backend necessário para processamento básico).
  - Criar modal de mapeamento de colunas (para CSVs genéricos).
- **Análise Preditiva (Cashflow Projection):**
  - Função `calculateProjection()`:
    - Saldo Atual + (Receitas Recorrentes Pendentes) - (Despesas Recorrentes Pendentes).
    - Cálculo da média de gastos diários variáveis.
    - Projeção: `Saldo Final Estimado = Saldo Atual + Pendências - (Média Diária * Dias Restantes)`.
- **Sistema de Alertas:**
  - Monitoramento em tempo real do consumo do orçamento.
  - Alertas de 80% e 100% via Mascote e Toast.

## 📋 Lista de Tarefas
- [ ] Criar modal e lógica de importação de arquivos (foco inicial em CSV).
- [ ] Implementar o card de "Projeção do Mês" na seção de Insights.
- [ ] Atualizar o Mascote para dar avisos proativos sobre orçamentos estourando.
- [ ] Criar gráfico de tendência de saldo (Projeção Linear).

## 🧮 Lógica do Oráculo
- Se `Gasto Atual / Dias Transcorridos > Orçamento Diário`, o Oráculo avisa: "Cuidado, você terminará o mês com R$ X negativos se mantiver o ritmo".
