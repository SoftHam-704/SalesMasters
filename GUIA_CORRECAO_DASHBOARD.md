# 🔧 GUIA DE CORREÇÃO - Dashboard SalesMasters

> **Data**: 2026-02-25
> **Objetivo**: Corrigir dados vazios/incorretos nos dashboards após inserção do filtro por indústria.
> **Arquitetura**: 2 motores independentes — Node.js (server.js na porta 8080) e Python/FastAPI (bi-engine na porta 8000).

---

## 📐 ARQUITETURA

```
Frontend (React/Vite)
  ├── Dashboard Inicial (/dashboard)      → Node.js (server.js)
  │     ├── Cards de métricas             → get_dashboard_metrics_v2()
  │     ├── Gráfico Vendas Comparação     → fn_comparacao_vendas_mensais()
  │     ├── Gráfico Quantidades           → fn_comparacao_quantidades_mensais()
  │     ├── Top 15 Clientes               → get_top_clients()
  │     └── Faturamento por Indústria     → get_industry_revenue()
  │
  └── BI Intelligence (/bi-intelligence)  → Python/FastAPI (bi-engine/)
        ├── Aba CLIENTES                  → services/client_dashboard.py
        ├── Aba INDÚSTRIA                 → services/industry_dashboard.py
        ├── Summary KPIs                  → services/dashboard_summary.py
        ├── Analytics                     → services/analytics_dashboard.py
        └── Narrativas                    → services/insights.py
```

---

## 🐛 PROBLEMAS ENCONTRADOS E SOLUÇÕES

### ═══════════════════════════════════════
### MOTOR 1: NODE.JS (backend/server.js)
### ═══════════════════════════════════════

#### PROBLEMA 1: Top 15 Clientes mostra "R$ Null"
- **Causa**: Mapeamento de colunas incorreto no endpoint `/api/dashboard/top-clients`
- **Localização**: `server.js` ~linha 2449-2456
- **Antes (ERRADO)**:
```javascript
data: result.rows.map(row => ({
    cliente_codigo: row.cliente_id,       // ❌ Não existe
    cliente_nome: row.razao_social,       // ❌ Não existe
    total_vendido: row.total_vendas,      // ❌ Não existe
    quantidade_pedidos: row.qtd_pedidos   // ❌ Não existe
}))
```
- **Depois (CORRETO)**:
```javascript
data: result.rows.map(row => ({
    cliente_codigo: row.cliente_codigo,
    cliente_nome: row.cliente_nome,
    total_vendido: Number(row.total_vendido || 0),
    quantidade_pedidos: Number(row.quantidade_pedidos || 0)
}))
```

#### PROBLEMA 2: Gráficos demoram >2 minutos
- **Causa**: `TRIM()` nos JOINs + `LATERAL JOIN` em 265k registros mata qualquer índice
- **Localização**: Funções SQL `fn_comparacao_quantidades_mensais` e `get_dashboard_metrics_v2`
- **Solução**: 
  - Trocar `LATERAL JOIN` por `INNER JOIN` direto
  - Remover `TRIM()` (verificado: 0 registros precisam de trim)
  - Trocar `EXTRACT(YEAR FROM ped_data) = X` por `ped_data >= make_date(X, 1, 1)` (usa índice)
  - Criar índices: `(ped_data, ped_situacao)`, `(ped_industria)`, `(ite_pedido, ite_industria)`
- **Script de reparo**: `backend/repair_dashboard_v5.js` — roda em TODOS os schemas

#### PROBLEMA 3: Valores numéricos chegam como string
- **Causa**: PostgreSQL retorna `numeric` como string no driver Node.js
- **Localização**: `server.js` endpoints de sales-comparison e quantities-comparison
- **Solução**: Mapear explicitamente com `Number()` antes de enviar ao frontend
```javascript
vendas_ano_atual: Number(row.vendas_ano_atual || 0),
vendas_ano_anterior: Number(row.vendas_ano_anterior || 0)
```

#### PROBLEMA 4: Status 'E' incorreto
- **Regra de negócio**: Apenas `'P'` (Pedido) e `'F'` (Faturado) são válidos
- **Onde aparecia**: Em TODAS as funções SQL do dashboard
- **Solução**: Remover `'E'` de todos os filtros `ped_situacao IN (...)`

#### PROBLEMA 5: Nomes de colunas inconsistentes entre SQL e Frontend
- **Causa**: Funções SQL retornavam `v_atual`/`v_anterior` mas frontend esperava `vendas_ano_atual`/`vendas_ano_anterior`
- **Solução**: Padronizar os alias no RETURNS TABLE das funções SQL:
  - Vendas: `vendas_ano_atual`, `vendas_ano_anterior`
  - Quantidades: `quantidade_ano_atual`, `quantidade_ano_anterior`

---

### ═══════════════════════════════════════
### MOTOR 2: PYTHON/FASTAPI (bi-engine/)
### ═══════════════════════════════════════

#### PROBLEMA 6: Filtro de indústria como STRING em vez de INTEGER
- **Causa**: Várias funções montam o filtro como `ped_industria = '{industry_id}'` (com aspas)
- **Impacto**: PostgreSQL faz cast implícito, não usa índice, ou retorna 0 resultados
- **Localização**: `bi-engine/services/client_dashboard.py` — funções:
  - `get_active_vs_inactive()` (linha ~249)
  - `get_clients_no_purchase()` (linha ~353)
  - `get_churn_risk_clients()` (linha ~425)
  - `get_client_monthly_evolution()` (linha ~627)
- **Antes (ERRADO)**:
```python
industry_filter = f"AND p.ped_industria = '{industry_id}'"
```
- **Depois (CORRETO)**:
```python
industry_filter = f"AND p.ped_industria = {industry_id}"
```

#### PROBLEMA 7: Variável `industry_filter` não definida
- **Causa**: `get_top_clients_impact()` usa `{industry_filter}` na query mas nunca define essa variável
- **Localização**: `bi-engine/services/client_dashboard.py` ~linha 181
- **Solução**: Definir `industry_filter` no início da função (veja a versão corrigida do arquivo)

#### PROBLEMA 8: EXTRACT() em colunas indexadas
- **Causa**: `EXTRACT(YEAR FROM p.ped_data) = {ano}` impede uso do índice em `ped_data`
- **Localização**: Múltiplas funções em `client_dashboard.py`
- **Solução**: Usar range comparison: `p.ped_data >= make_date({ano}, 1, 1) AND p.ped_data <= make_date({ano}, 12, 31)`
- **Função helper criada**:
```python
def _build_date_filter(ano, mes=None, startDate=None, endDate=None, alias="p"):
    if startDate and endDate:
        return f"{alias}.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    if mes:
        return f"{alias}.ped_data >= make_date({ano}, {mes}, 1) AND {alias}.ped_data < (make_date({ano}, {mes}, 1) + INTERVAL '1 month')"
    return f"{alias}.ped_data >= make_date({ano}, 1, 1) AND {alias}.ped_data <= make_date({ano}, 12, 31)"
```

#### PROBLEMA 9: industry_id com aspas no analytics_dashboard.py
- **Causa**: `vw_performance_mensal` comparação `industry_id = '{industry_id}'` com aspas
- **Localização**: `bi-engine/services/analytics_dashboard.py` linha 443
- **Solução**: Remover aspas → `industry_id = {industry_id}`

---

## 🔴 REGRAS DE OURO PARA SQL NESTE PROJETO

1. **NUNCA usar TRIM() em colunas de JOIN** — mata índice, full table scan
2. **NUNCA usar EXTRACT() para filtrar datas** — usar `make_date()` para range comparison
3. **NUNCA usar aspas em campos INTEGER** — `ped_industria = 23` e NÃO `= '23'`
4. **NUNCA usar SUBSTRING/CAST/COALESCE em colunas WHERE** — impede uso de índice
5. **SEMPRE usar status `IN ('P', 'F')`** — NÃO existe status 'E'
6. **SEMPRE usar `Number()` no Node.js** para converter numeric do PostgreSQL antes de enviar ao frontend

---

## 📁 ARQUIVOS MODIFICADOS

### Backend Node.js
- `backend/server.js` — Endpoints do dashboard (mapeamento de colunas, Number())
- `backend/repair_dashboard_v5.js` — Script para recriar funções SQL em todos os schemas

### BI Engine Python  
- `bi-engine/services/client_dashboard.py` — Funções de análise de clientes (REESCRITO COMPLETO)

### Frontend React
- `frontend/src/pages/Dashboard.jsx` — Data keys padronizadas (`atual`/`anterior`)
- `frontend/src/components/dashboard/BirthdayCard.jsx` — Campo de data corrigido
- `frontend/src/pages/frmGrupoDesc.jsx` — Removido `gid` legado, usando `gde_id`

---

## 🔍 PROBLEMA 10 — Grid de Grupos de Desconto vazio

- **Sintoma**: Grid mostra "Nenhum registro encontrado" mesmo com 57+ registros no banco
- **Causa**: `ORDER BY NULLIF(gid, '')::integer` — o campo `gid` é legado do Firebird e pode conter valores não conversíveis para integer, causando erro 500
- **Localização**: `backend/server.js` endpoint `GET /api/v2/discount-groups` (~L552)
- **Solução**: 
  - Removido `gid` da query, usando `ORDER BY gde_id`
  - Frontend: Trocado `gid` por `gde_id` em `frmGrupoDesc.jsx` (coluna ID, delete, busca)

## 🔍 PROBLEMA 11 — Aba Curva ABC vazia no BI Intelligence

- **Sintoma**: Aba CURVA ABC mostra "Nenhum dado disponível"
- **Causa RAIZ**: As funções SQL `fn_curva_abc` e `fn_analise_curva_abc` foram criadas APENAS no schema `public` pelo script Python original. Quando o tenant usa `ro_consult`, `repsoma`, etc., a função não existe.
- **Causa SECUNDÁRIA**: `abc_intelligence.py` L302 tem `ped_industria = '{industryId}'` com aspas (string em vez de integer)
- **Solução**:
  1. Rodar `backend/sql_pgadmin_bi_functions.sql` no pgAdmin (cria funções + views em TODOS os schemas)
  2. Corrigido `abc_intelligence.py` L302: aspas removidas
- **Views também criadas**: `vw_metricas_cliente`, `vw_performance_mensal` em schemas que faltavam (`barrosrep`, `repseven`)
- **Teste**: `ro_consult` = 2549 produtos, `repsoma` = 2227 produtos

---

## 🔍 CHECKLIST - ARQUIVOS QUE AINDA PRECISAM REVISÃO

> **ATENÇÃO**: Os seguintes arquivos do BI Engine podem conter os MESMOS erros (industry como string, EXTRACT() em datas):

- [x] `bi-engine/services/analytics_dashboard.py` — **CORRIGIDO**: industry_id com aspas (L443)
- [ ] `bi-engine/services/insights.py` (33KB — tem TRIM na L293, tem EXTRACT em L283/288)
- [ ] `bi-engine/services/insights_analyzer.py` (10KB — tem EXTRACT em L127/188/194)
- [ ] `bi-engine/services/portfolio_analyzer.py` (13KB)
- [ ] `bi-engine/services/top_industries.py` (4KB — tem EXTRACT em L28)
- [ ] `bi-engine/services/data_fetcher.py` (6KB — tem EXTRACT em L50/102)
- [ ] `bi-engine/services/measures.py` (4KB)
- [x] `bi-engine/services/dashboard_summary.py` — Revisado, OK (tem EXTRACT mas usa params nomeados)
- [x] `bi-engine/services/industry_dashboard.py` — Revisado, OK estruturalmente (tem EXTRACT mas funcional)
- [x] `bi-engine/services/client_dashboard.py` — **REESCRITO COMPLETO**
- [x] `bi-engine/services/analysis.py` — Revisado (tem EXTRACT L20/75/86, funcional mas não otimizado)

### Como verificar cada arquivo:
```bash
# Buscar industry_id com aspas (ERRADO):
grep -n "'{industry_id}'" bi-engine/services/*.py

# Buscar EXTRACT em colunas indexadas:
grep -n "EXTRACT(YEAR" bi-engine/services/*.py

# Buscar TRIM em JOINs:
grep -n "TRIM(" bi-engine/services/*.py

# Buscar status 'E':
grep -n "'E'" bi-engine/services/*.py
```

---

## 🗄️ CONEXÃO COM O BANCO

```
Host: node254557-salesmaster.sp1.br.saveincloud.net.br
Port: 13062
Database: basesales
User: webadmin
Password: ytAyO0u043
Schemas: repwill, repmoraes, garrarep, repseven, brasil_wl, barrosrep, ndsrep, 
         remap, target, ro_consult, markpress, rimef, public, eticarep, rmvcrep, repsoma
```

---

## 📊 BENCHMARK ANTES/DEPOIS

| Função | Antes | Depois |
|---|---|---|
| fn_comparacao_quantidades_mensais (sem filtro) | >120s (timeout) | ~250ms |
| fn_comparacao_quantidades_mensais (com filtro) | >60s | ~107ms |
| get_dashboard_metrics_v2 (sem filtro) | >120s | ~250ms |
| get_dashboard_metrics_v2 (com filtro) | N/A | ~105ms |
| get_top_clients | ~2s | ~49ms |
