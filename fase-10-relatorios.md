# Fase 10: Exportação e Relatórios (Data Portability)

Esta fase foca em permitir que o usuário leve seus dados para onde quiser e gere documentos formais sobre sua saúde financeira.

## 1. Exportação de Transações (CSV)
- **Função**: Gera um arquivo `.csv` com todas as transações filtradas no dashboard.
- **Campos**: Data, Descrição, Categoria, Valor, Tipo, Conta.

## 2. Backup de Segurança (JSON)
- **Função**: Exporta a base completa do usuário (Transações, Contas, Metas, Orçamentos) em um único arquivo JSON para migração ou backup manual.

## 3. Relatório de Fechamento Mensal (PDF/Print)
- **Função**: Uma versão formatada para impressão do dashboard do mês atual, focada em um "extrato de desempenho" limpo.

## 4. UI de Exportação
- **Local**: Botão na seção de Relatórios e no topo da lista de transações.
- **Ação**: Menu suspenso ou botões diretos para os formatos disponíveis.

## Arquivos Afetados:
- `dashboard.html`: Adição dos botões de exportação.
- `main.js`: Lógica de geração de blobs CSV/JSON e comandos de impressão.
