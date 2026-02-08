# 📋 Plano de Implementação: Financial Dashboard Hub (SoftHam-ADM)

## 📌 Visão Geral
Este documento detalha os requisitos técnicos para a implementação do Dashboard Financeiro Central. O objetivo é fornecer ao gestor uma visão 360º da saúde financeira, focando em liquidez imediata e tendências de fluxo de caixa.

---

## 1. ⚙️ Backend: Camada de Inteligência (API)
A API deve consolidar dados de múltiplas tabelas financeiras para evitar sobrecarga no frontend.

### 🔹 Endpoint: `GET /api/financial/dashboard/summary`
**Lógica SQL sugerida (PostgreSQL):**
```sql
-- 1. Resumo de Pendências (Receber e Pagar)
SELECT 
    SUM(CASE WHEN data_vencimento < CURRENT_DATE THEN saldo ELSE 0 END) as vencidos,
    SUM(CASE WHEN data_vencimento = CURRENT_DATE THEN saldo ELSE 0 END) as hoje,
    SUM(CASE WHEN data_vencimento > CURRENT_DATE AND data_vencimento <= CURRENT_DATE + 7 THEN saldo ELSE 0 END) as prox_7_dias
FROM fin_contas_receber/pagar
WHERE status = 'ABERTO';

-- 2. Histórico de Fluxo (Últimos 6 meses)
SELECT 
    to_char(data_vencimento, 'Mon/YY') as label,
    SUM(valor_receita) as entradas,
    SUM(valor_despesa) as saidas
FROM financeiro_consolidado
GROUP BY 1 ORDER BY min(data_vencimento);
```

---

## 2. 🎨 Frontend: Interface Premium (UI/UX)
O design deve priorizar a hierarquia de informações e o uso de cores semânticas.

### 🔹 Componente Central: `MetricCard` Dinâmico
Atualizar o componente de card para suportar variantes:
- **`financial` (Azul):** Saldo operacional e caixas.
- **`revenue` (Verde):** Entradas e recebimentos.
- **`expense` (Vermelho):** Saídas e obrigações.
- **`alert` (Rosa):** Inadimplência e atrasos críticos.

### 🔹 Layout da Página
- **Topo:** KPI Cards com animação de "shimmer" (brilho) para indicar dados vivos.
- **Centro (Esquerda):** Gráfico de Área (`AreaChart`) com gradientes suaves para Entradas vs Saídas.
- **Centro (Direita):** Widgets de "Atenção Diária" (O que pagar hoje? O que cobrar hoje?).
- **Rodapé/Ações:** Botões de atalho flutuantes para "Novo Lançamento" e "Impressão de DRE".

---

## 3. 🛠️ Stack Tecnológica Recomendada
- **Charts:** `Recharts` (pela facilidade de integração com React e responsividade).
- **Icons:** `Lucide React` (ícones modernos e leves).
- **Animations:** `Framer Motion` (para transições de estado e entrada de página).

---

## 📅 Cronograma de Entrega (Estimado)
1. **Dia 1:** Desenvolvimento das Queries SQL e Endpoint de Resumo.
2. **Dia 2:** Criação dos Componentes Visuais (Cards e Gráficos).
3. **Dia 3:** Integração Final, Testes de Saldo e Deploy.

---

**Nota:** Este dashboard foi projetado para reduzir em 40% o tempo que o gestor gasta navegando entre relatórios de contas individuais.
