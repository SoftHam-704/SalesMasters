# Tarefa: Implementação do Dashboard Central Financeiro (Financial Hub)

## 🎯 Objetivo
Criar uma tela centralizadora para o módulo financeiro que forneça uma visão 360º da saúde financeira da empresa, com indicadores de performance (KPIs) e atalhos para as operações mais comuns.

## 🛠️ Especificações Técnicas

### 1. Backend (Node.js)
- **Endpoint**: `/api/financial/dashboard/summary`
- **Dados necessários**:
    - Saldo total (contas).
    - Contas a Pagar: Total hoje, Total Vencido, Total Próximos 7 dias.
    - Contas a Receber: Total hoje, Total Vencido, Total Próximos 7 dias.
    - Histórico de 6 meses (Receitas vs Despesas) para gráfico.

### 2. Frontend (React)
- **Componente**: `FinancialDashboardPage.jsx`
- **Layout**:
    - **KPI Row**: 4 cards (Saldo, A Receber, A Pagar, Resultado Previsto).
    - **Quick Actions**: Barra de botões (Novo Pagar, Novo Receber, Conciliar, DRE Rápido).
    - **Charts Area**:
        - Fluxo de Caixa (Entradas vs Saídas) - Recharts.
        - Distribuição de Despesas por Centro de Custo/Plano.
    - **Mini Grid**: Top 5 Contas a Receber/Pagar mais urgentes.

## 📅 Chronology

- [ ] **Fase 1**: Criar endpoint de resumo no backend (`financial_endpoints.js`).
- [ ] **Fase 2**: Registrar rota no `componentMapping.jsx` e adicionar no `Sidebar.jsx`.
- [ ] **Fase 3**: Desenvolver os CSS/Styled-components para os Cards Premium.
- [ ] **Fase 4**: Implementar gráficos e integração de dados reais.
- [ ] **Fase 5**: Adicionar diálogos de ação rápida (Novo Lançamento).

## 🧪 Critérios de Aceite
- Os valores do Dashboard devem bater com os relatórios detalhados.
- O layout deve ser responsivo.
- Cliques nos cards de "Vencidos" devem levar às respectivas telas filtradas.
