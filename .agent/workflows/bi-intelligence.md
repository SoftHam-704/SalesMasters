# BI Intelligence Architecture & Standards

## Description
Este documento define a arquitetura e padrões do módulo BI Intelligence do SalesMasters. 
Toda IA que trabalhar neste projeto DEVE seguir estas diretrizes.

---

## Arquitetura de 3 Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                               │
│  IntelligencePage.jsx, BIPage.jsx, Dashboard.jsx               │
│  Porta: 3000                                                    │
│  Responsabilidade: Apenas EXIBIÇÃO (gráficos, tabelas, UI)     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP calls (axios)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BI-ENGINE (Python/FastAPI)                                     │
│  Pasta: bi-engine/                                              │
│  Porta: 8000                                                    │
│  Responsabilidade: TODA lógica BI, queries SQL, measures       │
│  Endpoint Base: /api/dashboard/*                                │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQLAlchemy / psycopg2
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                            │
│  Porta: 5432 | Database: salesmasters                          │
└─────────────────────────────────────────────────────────────────┘
```

> ⚠️ **IMPORTANTE**: O Node.js backend (porta 3005) é para operações CRUD e autenticação, 
> NÃO para BI/Analytics. Toda lógica de BI deve estar no Python.

---

## Estrutura do BI-Engine Python

```
bi-engine/
├── main.py                    # Inicialização FastAPI
├── config.py                  # Configurações DB
├── routers/
│   ├── dashboard.py           # Endpoints de BI
│   └── narratives.py          # Narrativas inteligentes
└── services/
    ├── database.py            # Conexão PostgreSQL
    ├── data_fetcher.py        # Queries com cache
    ├── measures.py            # Medidas DAX-like (reutilizáveis!)
    ├── analysis.py            # Pareto, Growth, etc.
    └── insights.py            # Geração de narrativas
```

---

## Endpoints Python Disponíveis (Porta 8000)

| Endpoint | Parâmetros | Descrição |
|----------|------------|-----------|
| `GET /api/dashboard/evolution` | `ano`, `metrica` | Evolução mensal (MoM) |
| `GET /api/dashboard/comparison` | `ano` | Faturamento vs Metas |
| `GET /api/dashboard/goals-scroller` | `ano` | Progresso metas por indústria |
| `GET /api/dashboard/pareto` | `ano`, `metrica` | Curva 80/20 clientes |
| `GET /api/dashboard/industry-growth` | `ano`, `metrica` | Crescimento TOP 15 indústrias |
| `GET /api/dashboard/insights` | `ano`, `industryId` | Narrativas inteligentes |
| `GET /api/dashboard/metas` | `mes`, `ano` | Metas do período |
| `GET /api/dashboard/summary` | (placeholder) | KPIs agregados |

---

## Pattern: Measures (DAX-like)

Python reutiliza medidas assim como DAX no Power BI.
Todas as medidas ficam em `services/measures.py`:

```python
# Exemplo de medida reutilizável
def measure_total_vendas(df: pd.DataFrame, industria_id: int = None) -> float:
    if industria_id:
        df = df[df['industria'] == industria_id]
    return df['valor'].sum()
```

Endpoints chamam as medidas:
```python
@router.get("/api/dashboard/kpis")
async def get_kpis(ano: int, industria_id: int = None):
    df = fetch_vendas(ano)
    return {
        "total_vendas": measure_total_vendas(df, industria_id),
        "total_clientes": measure_total_clientes(df, industria_id)
    }
```

---

## Design do Bubble Chart (TOP 6 Industries)

### Visual Specs
- Bolha maior (TOP 1): ~170px, na FRENTE
- Bolhas progressivamente menores para trás
- Fundo TRANSPARENTE (cor do painel visível)
- Anel cyan fino (2px), vermelho quando selecionada
- Imagem da indústria = 88% do tamanho da bolha (pouco padding)
- Sobreposição sutil (~15-20%, não 50%)
- Renderizar menores primeiro, maiores por último (z-index)

### Comportamento
- Click na bolha = selecionar indústria (borda vermelha)
- Indústria selecionada = filtro para KPIs e outros gráficos
- Click novamente = deselecionar
- Métrica (Valor/Quantidade) afeta tamanho e ordenação

---

## Comandos para Iniciar Servidores

```bash
# Frontend React (porta 3000)
cd frontend && npm run dev

# Backend Node.js (porta 3005) - CRUD apenas
cd backend && npm start

# BI-Engine Python (porta 8000) - Analytics/BI
cd bi-engine && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000
```

---

## Regras de Ouro

1. **Toda lógica BI = Python** (FastAPI porta 8000)
2. **Frontend = apenas exibição** (React, sem cálculos complexos)
3. **Measures são reutilizáveis** (criar em services/measures.py)
4. **Usar cache** (TTL LRU via functools ou Redis)
5. **Bubble Chart**: transparente, sobreposição sutil, proporcional à métrica
