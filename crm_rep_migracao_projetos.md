# CRM-Rep — Guia de Migração: Suporte a Projetos

**Versão 1.0 | Fevereiro 2026**
**Classificação: CRÍTICO — Sistema em Produção**

---

## Sumário

1. [Resumo Executivo](#1-resumo-executivo)
2. [Princípios de Segurança](#2-princípios-de-segurança)
3. [Diagnóstico de Impacto](#3-diagnóstico-de-impacto)
4. [Alterações na Tabela `pedido`](#4-alterações-na-tabela-pedido)
5. [Alterações na Tabela `itens_ped`](#5-alterações-na-tabela-itens_ped)
6. [Nova Tabela `fase_projeto_historico`](#6-nova-tabela-fase_projeto_historico)
7. [Views para Dashboards](#7-views-para-dashboards)
8. [Impacto nas Queries Existentes](#8-impacto-nas-queries-existentes)
9. [Checklist de Telas Afetadas](#9-checklist-de-telas-afetadas)
10. [Script de Migração Completo](#10-script-de-migração-completo)
11. [Script de Rollback Completo](#11-script-de-rollback-completo)
12. [Plano de Execução](#12-plano-de-execução)
13. [Validação Pós-Migração](#13-validação-pós-migração)

---

## 1. Resumo Executivo

### O que estamos fazendo

Adicionando suporte a **projetos** (galpões, armazéns) dentro da estrutura existente de `pedido` e `itens_ped`, sem criar tabelas novas para dados comerciais e sem quebrar nenhum dashboard ou funcionalidade existente.

### Estratégia escolhida

| Abordagem | Risco | Esforço | Escolha |
|---|---|---|---|
| ❌ Tabela separada `itens_proj` + UNION ALL | Médio-Alto | Alto (manter 2 tabelas sincronizadas) | Descartada |
| ❌ Reescrever tabelas do zero | Altíssimo | Altíssimo | Descartada |
| ✅ **Adicionar colunas opcionais nas tabelas existentes** | **Baixo** | **Baixo** | **Escolhida** |

### Por que o risco é baixo

- Todas as novas colunas são **NULLABLE** ou possuem **DEFAULT** — registros existentes não são afetados
- Nenhuma coluna existente é alterada, renomeada ou removida
- Nenhum índice existente é removido
- Nenhuma constraint existente é modificada
- Dashboards existentes continuam funcionando **sem nenhuma alteração** no código
- A migração é 100% reversível (rollback documentado)

---

## 2. Princípios de Segurança

```
┌─────────────────────────────────────────────────────────┐
│                   REGRAS INVIOLÁVEIS                     │
├─────────────────────────────────────────────────────────┤
│  1. NUNCA rodar em produção sem testar em homologação   │
│  2. NUNCA alterar colunas existentes (só adicionar)     │
│  3. NUNCA remover colunas ou tabelas existentes         │
│  4. SEMPRE fazer backup ANTES de qualquer ALTER         │
│  5. SEMPRE ter script de rollback pronto                │
│  6. SEMPRE validar contagens antes e depois             │
│  7. NUNCA rodar migração em horário comercial           │
│  8. CADA ALTER é uma transação independente             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Diagnóstico de Impacto

### 3.1 O que NÃO muda (zero impacto)

| Componente | Status | Motivo |
|---|---|---|
| Cadastro de clientes | ✅ Intacto | Nenhuma alteração |
| Cadastro de indústrias | ✅ Intacto | Nenhuma alteração |
| Cadastro de produtos | ✅ Intacto | Nenhuma alteração |
| Tabelas de preço | ✅ Intacto | Nenhuma alteração |
| Comissões | ✅ Intacto | Nenhuma alteração |
| Visitas | ✅ Intacto | Nenhuma alteração |
| Atividades | ✅ Intacto | Nenhuma alteração |
| Usuários/Auth | ✅ Intacto | Nenhuma alteração |
| Pedidos existentes | ✅ Intacto | Recebem `tipo = 'pedido'` via DEFAULT |
| Itens de pedido existentes | ✅ Intacto | Recebem `tipo_item = 'produto'` via DEFAULT |
| **Todos os dashboards** | ✅ Intacto | SUM/COUNT continuam funcionando |

### 3.2 O que muda (impacto controlado)

| Componente | Impacto | Ação Necessária |
|---|---|---|
| Tabela `pedido` | 🟡 Baixo | +6 colunas opcionais, +1 índice |
| Tabela `itens_ped` | 🟡 Baixo | +2 colunas opcionais, alterar `produto_id` para nullable |
| Tela de criação de pedido | 🟡 Médio | Adicionar seletor de tipo + campos condicionais |
| Tela de listagem | 🟡 Baixo | Adicionar filtro por tipo e coluna visual |
| **Nova tela**: Kanban de projetos | 🟢 Novo | View filtrada de pedidos onde tipo='projeto' |
| **Nova tela**: Detalhe de projeto | 🟢 Novo | Tela estendida do pedido com campos de projeto |

### 3.3 Ponto de atenção crítico: `produto_id` em `itens_ped`

Hoje `produto_id` provavelmente é `NOT NULL` em `itens_ped`. Para projetos, precisamos que ele seja **NULLABLE**, porque itens de projeto podem ser serviços ou soluções customizadas que não existem no cadastro de produtos.

**Risco:** Nenhum. Alterar de NOT NULL para NULLABLE **nunca** quebra dados existentes. Todos os registros atuais já têm `produto_id` preenchido e continuarão tendo. Apenas registros **novos** poderão ter `produto_id = NULL`.

**Validação:** Após o ALTER, rodar `SELECT COUNT(*) FROM itens_ped WHERE produto_id IS NULL` — deve retornar **0** (nenhum registro existente foi afetado).

---

## 4. Alterações na Tabela `pedido`

### 4.1 Novas colunas

| Coluna | Tipo | Null | Default | Propósito |
|---|---|---|---|---|
| `tipo` | `VARCHAR(20)` | N | `'pedido'` | Discriminador: 'pedido' ou 'projeto' |
| `fase_projeto` | `VARCHAR(30)` | S | `NULL` | Estágio atual do projeto no Kanban |
| `area_m2` | `NUMERIC(10,2)` | S | `NULL` | Dimensão do galpão/armazém |
| `cidade_obra` | `VARCHAR(200)` | S | `NULL` | Localização da obra |
| `uf_obra` | `CHAR(2)` | S | `NULL` | Estado da obra |
| `previsao_fechamento` | `DATE` | S | `NULL` | Data prevista de fechamento do projeto |

### 4.2 Valores de `fase_projeto`

```
prospeccao → visita_tecnica → orcamento → negociacao → 
proposta_enviada → aprovado → em_execucao → concluido

Estados terminais: cancelado, perdido
```

Representação visual no Kanban:

```
┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐
│ Prospecção  │→ │Visita Técnica│→ │ Orçamento │→ │ Negociação │→
│    (3)      │  │     (2)      │  │    (4)    │  │    (1)     │
└────────────┘  └──────────────┘  └───────────┘  └────────────┘

┌──────────────────┐  ┌───────────┐  ┌─────────────┐  ┌───────────┐
│ Proposta Enviada │→ │ Aprovado  │→ │ Em Execução │→ │ Concluído │
│       (2)        │  │    (1)    │  │     (1)     │  │    (5)    │
└──────────────────┘  └───────────┘  └─────────────┘  └───────────┘
```

### 4.3 Como os dois tipos convivem

```
┌─────────────────────────────────────────────────────────┐
│                    TABELA: pedido                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  tipo = 'pedido'              tipo = 'projeto'          │
│  ┌───────────────────┐        ┌───────────────────┐     │
│  │ Usa: status        │        │ Usa: fase_projeto  │     │
│  │ (rascunho,enviado, │        │ (prospeccao,       │     │
│  │  aprovado,faturado)│        │  orcamento,        │     │
│  │                    │        │  aprovado,         │     │
│  │ area_m2 = NULL     │        │  em_execucao...)   │     │
│  │ cidade_obra = NULL │        │                    │     │
│  │ fase_projeto = NULL│        │ area_m2 = 800.00   │     │
│  │                    │        │ cidade_obra = ...   │     │
│  │ ➜ Fluxo normal    │        │                    │     │
│  │   que já existe    │        │ ➜ Fluxo novo       │     │
│  └───────────────────┘        │   (Kanban)         │     │
│                                └───────────────────┘     │
│                                                         │
│  Dashboards: SUM(valor_total) pega TUDO ✅              │
│  Filtros: WHERE tipo = 'pedido' OU tipo = 'projeto'     │
└─────────────────────────────────────────────────────────┘
```

### 4.4 SQL — ALTER pedido

```sql
-- ============================================================
-- MIGRAÇÃO: PEDIDO
-- Pré-requisito: backup completo do banco
-- Tempo estimado: < 1 segundo (só adiciona colunas)
-- ============================================================

-- PASSO 1: Adicionar coluna tipo com default 'pedido'
-- IMPACTO: Todos os registros existentes recebem 'pedido' automaticamente
-- ROLLBACK: ALTER TABLE pedido DROP COLUMN tipo;
ALTER TABLE pedido
  ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'pedido';

-- PASSO 2: Adicionar campos específicos de projeto (todos NULLABLE)
-- IMPACTO: Zero. Colunas nullable não afetam registros existentes
-- ROLLBACK: ALTER TABLE pedido DROP COLUMN fase_projeto;
ALTER TABLE pedido
  ADD COLUMN fase_projeto VARCHAR(30) NULL;

-- ROLLBACK: ALTER TABLE pedido DROP COLUMN area_m2;
ALTER TABLE pedido
  ADD COLUMN area_m2 NUMERIC(10,2) NULL;

-- ROLLBACK: ALTER TABLE pedido DROP COLUMN cidade_obra;
ALTER TABLE pedido
  ADD COLUMN cidade_obra VARCHAR(200) NULL;

-- ROLLBACK: ALTER TABLE pedido DROP COLUMN uf_obra;
ALTER TABLE pedido
  ADD COLUMN uf_obra CHAR(2) NULL;

-- ROLLBACK: ALTER TABLE pedido DROP COLUMN previsao_fechamento;
ALTER TABLE pedido
  ADD COLUMN previsao_fechamento DATE NULL;

-- PASSO 3: Constraint para validar valores de tipo
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_tipo;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_tipo
  CHECK (tipo IN ('pedido', 'projeto'));

-- PASSO 4: Constraint para validar fases de projeto
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_fase_projeto;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_fase_projeto
  CHECK (
    fase_projeto IS NULL
    OR fase_projeto IN (
      'prospeccao', 'visita_tecnica', 'orcamento', 'negociacao',
      'proposta_enviada', 'aprovado', 'em_execucao', 'concluido',
      'cancelado', 'perdido'
    )
  );

-- PASSO 5: Constraint de consistência tipo × fase
-- Se tipo='pedido', fase_projeto DEVE ser NULL
-- Se tipo='projeto', fase_projeto DEVE ser preenchido
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_tipo_fase_consistencia;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_tipo_fase_consistencia
  CHECK (
    (tipo = 'pedido' AND fase_projeto IS NULL)
    OR
    (tipo = 'projeto' AND fase_projeto IS NOT NULL)
  );

-- PASSO 6: Índices para o novo campo
-- ROLLBACK: DROP INDEX idx_pedido_tipo;
CREATE INDEX idx_pedido_tipo
  ON pedido(tenant_id, tipo);

-- ROLLBACK: DROP INDEX idx_pedido_fase_projeto;
CREATE INDEX idx_pedido_fase_projeto
  ON pedido(tenant_id, fase_projeto)
  WHERE tipo = 'projeto';

-- ROLLBACK: DROP INDEX idx_pedido_previsao_fechamento;
CREATE INDEX idx_pedido_previsao_fechamento
  ON pedido(tenant_id, previsao_fechamento)
  WHERE tipo = 'projeto' AND fase_projeto NOT IN ('concluido', 'cancelado', 'perdido');
```

### 4.5 Validação pós-ALTER em `pedido`

```sql
-- VALIDAÇÃO 1: Todos os registros existentes devem ter tipo = 'pedido'
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE tipo = 'pedido') AS tipo_pedido,
       COUNT(*) FILTER (WHERE tipo = 'projeto') AS tipo_projeto,
       COUNT(*) FILTER (WHERE fase_projeto IS NOT NULL) AS com_fase
FROM pedido;
-- ESPERADO: total = tipo_pedido, tipo_projeto = 0, com_fase = 0

-- VALIDAÇÃO 2: Nenhum valor total foi alterado
-- (rodar ANTES e DEPOIS e comparar)
SELECT SUM(valor_total) AS soma_total,
       COUNT(*) AS qtd_pedidos
FROM pedido;
-- ESPERADO: valores idênticos antes e depois do ALTER
```

---

## 5. Alterações na Tabela `itens_ped`

### 5.1 Novas colunas e alteração

| Alteração | Tipo | Propósito |
|---|---|---|
| `produto_id` → **NULLABLE** | ALTER | Permitir itens sem produto (serviços, soluções) |
| + `tipo_item` | `VARCHAR(20)` DEFAULT 'produto' | Classificar: produto, solucao, servico, customizado |
| + `descricao_livre` | `VARCHAR(500)` NULL | Descrição manual quando não tem produto_id |

### 5.2 Exemplos de como fica na prática

**Pedido tradicional (tipo = 'pedido')** — nada muda:

| tipo_item | produto_id | descricao_livre | descricao_produto | qtd | preco_unit | subtotal |
|---|---|---|---|---|---|---|
| produto | uuid-123 | NULL | Parafuso Sextavado M10 | 500 | 0,45 | 225,00 |
| produto | uuid-456 | NULL | Arruela Lisa 3/8 | 1000 | 0,12 | 120,00 |

**Projeto de galpão (tipo = 'projeto')** — novos tipos de item:

| tipo_item | produto_id | descricao_livre | descricao_produto | qtd | preco_unit | subtotal |
|---|---|---|---|---|---|---|
| solucao | uuid-789 | NULL | Galpão Bertolini 20x40m | 1 | 180.000 | 180.000 |
| solucao | uuid-012 | NULL | Cobertura Termoacústica | 1 | 45.000 | 45.000 |
| servico | NULL | Projeto de engenharia estrutural | Projeto de engenharia estrutural | 1 | 8.000 | 8.000 |
| servico | NULL | Instalação e montagem | Instalação e montagem | 1 | 25.000 | 25.000 |
| customizado | NULL | Adequação de piso industrial 800m² | Adequação de piso industrial 800m² | 1 | 15.000 | 15.000 |

> **Observe:** A coluna `subtotal` continua existindo e funcionando da mesma forma. Os dashboards que fazem `SUM(subtotal)` ou `SUM(preco_unitario * quantidade)` **não precisam de nenhuma alteração**.

### 5.3 SQL — ALTER itens_ped

```sql
-- ============================================================
-- MIGRAÇÃO: ITENS_PED
-- Pré-requisito: migração de pedido já executada com sucesso
-- Tempo estimado: depende do volume (< 5s para até 100k registros)
-- ============================================================

-- PASSO 1: Adicionar tipo_item com default 'produto'
-- IMPACTO: Todos os registros existentes recebem 'produto'
-- ROLLBACK: ALTER TABLE itens_ped DROP COLUMN tipo_item;
ALTER TABLE itens_ped
  ADD COLUMN tipo_item VARCHAR(20) NOT NULL DEFAULT 'produto';

-- PASSO 2: Adicionar descrição livre
-- IMPACTO: Zero (nullable)
-- ROLLBACK: ALTER TABLE itens_ped DROP COLUMN descricao_livre;
ALTER TABLE itens_ped
  ADD COLUMN descricao_livre VARCHAR(500) NULL;

-- PASSO 3: Tornar produto_id NULLABLE
-- ⚠️  ESTE É O ALTER MAIS SENSÍVEL
-- IMPACTO: Nenhum registro existente é afetado (todos já têm valor)
-- ROLLBACK: Ver seção 5.4
ALTER TABLE itens_ped
  ALTER COLUMN produto_id DROP NOT NULL;

-- PASSO 4: Constraint para validar tipo_item
-- ROLLBACK: ALTER TABLE itens_ped DROP CONSTRAINT ck_itens_ped_tipo_item;
ALTER TABLE itens_ped
  ADD CONSTRAINT ck_itens_ped_tipo_item
  CHECK (tipo_item IN ('produto', 'solucao', 'servico', 'customizado'));

-- PASSO 5: Constraint de consistência produto_id × tipo_item
-- Se tipo_item = 'produto', produto_id DEVE existir
-- Se tipo_item IN ('servico', 'customizado'), produto_id pode ser NULL
-- ROLLBACK: ALTER TABLE itens_ped DROP CONSTRAINT ck_itens_ped_produto_consistencia;
ALTER TABLE itens_ped
  ADD CONSTRAINT ck_itens_ped_produto_consistencia
  CHECK (
    (tipo_item = 'produto' AND produto_id IS NOT NULL)
    OR
    (tipo_item IN ('solucao', 'servico', 'customizado'))
  );

-- PASSO 6: Garantir que itens sem produto_id tenham descricao preenchida
-- ROLLBACK: ALTER TABLE itens_ped DROP CONSTRAINT ck_itens_ped_descricao;
ALTER TABLE itens_ped
  ADD CONSTRAINT ck_itens_ped_descricao
  CHECK (
    produto_id IS NOT NULL
    OR descricao_livre IS NOT NULL
  );

-- PASSO 7: Índice para filtrar por tipo
-- ROLLBACK: DROP INDEX idx_itens_ped_tipo_item;
CREATE INDEX idx_itens_ped_tipo_item
  ON itens_ped(tipo_item);
```

### 5.4 Rollback específico do `produto_id` NULLABLE

Este é o único ALTER que merece atenção especial. Para reverter `produto_id` para NOT NULL, precisamos garantir que nenhum registro novo foi criado com NULL:

```sql
-- VERIFICAR antes de reverter:
SELECT COUNT(*) FROM itens_ped WHERE produto_id IS NULL;
-- Se retornar 0, é seguro reverter:

-- Remover constraints que dependem de NULL
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_ped_produto_consistencia;
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_ped_descricao;

-- Reverter para NOT NULL
ALTER TABLE itens_ped ALTER COLUMN produto_id SET NOT NULL;

-- Se retornar > 0, PRIMEIRO precisa decidir o que fazer com esses registros:
-- Opção A: deletar (se foram criados em teste)
-- Opção B: atribuir um produto_id genérico
-- Opção C: NÃO reverter (significa que projetos já estão em uso)
```

### 5.5 Validação pós-ALTER em `itens_ped`

```sql
-- VALIDAÇÃO 1: Todos os registros existentes devem ter tipo_item = 'produto'
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE tipo_item = 'produto') AS tipo_produto,
       COUNT(*) FILTER (WHERE tipo_item != 'produto') AS tipo_outro,
       COUNT(*) FILTER (WHERE produto_id IS NULL) AS sem_produto
FROM itens_ped;
-- ESPERADO: total = tipo_produto, tipo_outro = 0, sem_produto = 0

-- VALIDAÇÃO 2: Somas dos dashboards não foram afetadas
-- (rodar ANTES e DEPOIS e comparar)
SELECT
  SUM(subtotal) AS soma_subtotais,
  SUM(quantidade * preco_unitario) AS soma_calculada,
  COUNT(*) AS qtd_itens
FROM itens_ped;
-- ESPERADO: valores idênticos antes e depois

-- VALIDAÇÃO 3: JOINs com produto continuam funcionando
SELECT COUNT(*)
FROM itens_ped ip
INNER JOIN produto p ON p.id = ip.produto_id;
-- ESPERADO: mesmo número que SELECT COUNT(*) FROM itens_ped
-- (pois nenhum registro existente teve produto_id alterado)
```

---

## 6. Nova Tabela `fase_projeto_historico`

Registra cada mudança de fase no Kanban. Essencial para métricas como "tempo médio de prospecção até aprovação".

```sql
-- ============================================================
-- NOVA TABELA: Histórico de fases de projeto
-- IMPACTO: Zero (tabela nova, não afeta nada existente)
-- ROLLBACK: DROP TABLE fase_projeto_historico;
-- ============================================================

CREATE TABLE fase_projeto_historico (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  pedido_id     UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES "user"(id) ON DELETE SET NULL,

  fase_anterior VARCHAR(30) NULL,        -- NULL na criação do projeto
  fase_nova     VARCHAR(30) NOT NULL,

  motivo        TEXT NULL,                -- Ex: "Cliente pediu mais prazo"
  metadata      JSONB NULL,              -- Dados extras (ex: valor atualizado)

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fase_hist_pedido
  ON fase_projeto_historico(pedido_id, created_at);

CREATE INDEX idx_fase_hist_tenant
  ON fase_projeto_historico(tenant_id, created_at);

-- Habilitar RLS
ALTER TABLE fase_projeto_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON fase_projeto_historico
  USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## 7. Views para Dashboards

### 7.1 View unificada (substitui acesso direto à tabela)

Esta view permite que dashboards existentes funcionem sem alteração **e** dashboards novos filtrem por tipo:

```sql
-- View que expõe a mesma interface que os dashboards já usam
-- IMPACTO: Nenhum. É uma adição, não substitui nada.
-- Os dashboards existentes podem continuar acessando a tabela diretamente.
-- Novos dashboards podem usar esta view.
-- ROLLBACK: DROP VIEW vw_pedidos_e_projetos;

CREATE OR REPLACE VIEW vw_pedidos_e_projetos AS
SELECT
  p.id,
  p.tenant_id,
  p.numero,
  p.numero_formatado,
  p.tipo,                                              -- 'pedido' ou 'projeto'
  p.cliente_id,
  c.nome_fantasia AS cliente_nome,
  p.industria_id,
  i.nome_fantasia AS industria_nome,
  p.user_id,
  u.nome AS representante_nome,

  -- Campos de pedido
  p.status,
  p.data_pedido,

  -- Campos de projeto
  p.fase_projeto,
  p.area_m2,
  p.cidade_obra,
  p.uf_obra,
  p.previsao_fechamento,

  -- Financeiro (funciona para AMBOS os tipos)
  p.subtotal,
  p.valor_total,
  p.comissao_estimada,
  p.comissao_percentual,

  -- Métricas calculadas
  CASE
    WHEN p.tipo = 'projeto' AND p.fase_projeto NOT IN ('concluido','cancelado','perdido')
    THEN CURRENT_DATE - p.data_pedido
    ELSE NULL
  END AS dias_em_andamento,

  CASE
    WHEN p.tipo = 'projeto' AND p.previsao_fechamento IS NOT NULL
    THEN p.previsao_fechamento - CURRENT_DATE
    ELSE NULL
  END AS dias_para_previsao,

  p.created_at,
  p.updated_at

FROM pedido p
LEFT JOIN cliente c ON c.id = p.cliente_id
LEFT JOIN industria i ON i.id = p.industria_id
LEFT JOIN "user" u ON u.id = p.user_id
WHERE p.deleted_at IS NULL;
```

### 7.2 View específica: Kanban de Projetos

```sql
-- View para alimentar o Kanban de projetos
-- ROLLBACK: DROP VIEW vw_kanban_projetos;

CREATE OR REPLACE VIEW vw_kanban_projetos AS
SELECT
  p.id,
  p.tenant_id,
  p.numero_formatado,
  p.fase_projeto,
  p.cliente_id,
  c.nome_fantasia AS cliente_nome,
  p.industria_id,
  i.nome_fantasia AS industria_nome,
  p.cidade_obra,
  p.uf_obra,
  p.area_m2,
  p.valor_total,
  p.comissao_estimada,
  p.previsao_fechamento,
  p.data_pedido AS data_criacao,
  CURRENT_DATE - p.data_pedido AS dias_em_andamento,

  -- Alerta: projeto parado há muito tempo
  CASE
    WHEN CURRENT_DATE - p.updated_at > 14 THEN 'critico'    -- 14+ dias sem movimentação
    WHEN CURRENT_DATE - p.updated_at > 7  THEN 'atencao'    -- 7-14 dias
    ELSE 'normal'
  END AS alerta_estagnacao,

  p.observacoes,
  p.updated_at AS ultima_movimentacao

FROM pedido p
LEFT JOIN cliente c ON c.id = p.cliente_id
LEFT JOIN industria i ON i.id = p.industria_id
WHERE p.tipo = 'projeto'
  AND p.deleted_at IS NULL
  AND p.fase_projeto NOT IN ('cancelado', 'perdido')
ORDER BY
  CASE p.fase_projeto
    WHEN 'prospeccao'       THEN 1
    WHEN 'visita_tecnica'   THEN 2
    WHEN 'orcamento'        THEN 3
    WHEN 'negociacao'       THEN 4
    WHEN 'proposta_enviada' THEN 5
    WHEN 'aprovado'         THEN 6
    WHEN 'em_execucao'      THEN 7
    WHEN 'concluido'        THEN 8
  END,
  p.previsao_fechamento ASC NULLS LAST;
```

### 7.3 View de Resumo para Dashboard

```sql
-- Dashboard: resumo financeiro unificado (pedidos + projetos)
-- ROLLBACK: DROP VIEW vw_dashboard_resumo;

CREATE OR REPLACE VIEW vw_dashboard_resumo AS
SELECT
  p.tenant_id,
  p.tipo,
  DATE_TRUNC('month', p.data_pedido) AS mes,

  -- Contadores
  COUNT(*) AS total_registros,
  COUNT(*) FILTER (WHERE
    (p.tipo = 'pedido'  AND p.status IN ('aprovado','faturado','entregue'))
    OR
    (p.tipo = 'projeto' AND p.fase_projeto IN ('aprovado','em_execucao','concluido'))
  ) AS ganhos,

  COUNT(*) FILTER (WHERE
    (p.tipo = 'pedido'  AND p.status IN ('recusado','cancelado'))
    OR
    (p.tipo = 'projeto' AND p.fase_projeto IN ('cancelado','perdido'))
  ) AS perdidos,

  -- Financeiro
  SUM(p.valor_total) AS valor_total_pipeline,
  SUM(p.valor_total) FILTER (WHERE
    (p.tipo = 'pedido'  AND p.status IN ('faturado','entregue'))
    OR
    (p.tipo = 'projeto' AND p.fase_projeto = 'concluido')
  ) AS valor_faturado,

  SUM(p.comissao_estimada) AS comissao_pipeline,
  SUM(p.comissao_estimada) FILTER (WHERE
    (p.tipo = 'pedido'  AND p.status IN ('faturado','entregue'))
    OR
    (p.tipo = 'projeto' AND p.fase_projeto = 'concluido')
  ) AS comissao_realizada,

  -- Taxa de conversão
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE
      (p.tipo = 'pedido'  AND p.status IN ('aprovado','faturado','entregue'))
      OR
      (p.tipo = 'projeto' AND p.fase_projeto IN ('aprovado','em_execucao','concluido'))
    ) / NULLIF(COUNT(*), 0),
    1
  ) AS taxa_conversao_pct

FROM pedido p
WHERE p.deleted_at IS NULL
GROUP BY p.tenant_id, p.tipo, DATE_TRUNC('month', p.data_pedido);
```

---

## 8. Impacto nas Queries Existentes

### 8.1 Queries que NÃO precisam de alteração

Qualquer query que hoje faz:

```sql
-- ✅ Continua funcionando perfeitamente
SELECT SUM(valor_total) FROM pedido WHERE tenant_id = ?;
SELECT SUM(subtotal) FROM itens_ped WHERE pedido_id = ?;
SELECT COUNT(*) FROM pedido WHERE status = 'faturado';
SELECT * FROM itens_ped ip JOIN produto p ON p.id = ip.produto_id;
```

Por quê? Porque:
- `SUM` e `COUNT` incluem os projetos automaticamente (o que é correto — são receita)
- O JOIN com produto continua funcionando (registros existentes têm `produto_id`)
- O `WHERE status = 'faturado'` naturalmente exclui projetos (que usam `fase_projeto`)

### 8.2 Queries que PODEM precisar de ajuste (opcional)

Se em algum dashboard você quiser separar pedidos de projetos:

```sql
-- Antes (pega tudo, continua correto para visão geral):
SELECT SUM(valor_total) FROM pedido WHERE tenant_id = ?;

-- Se quiser separar (OPCIONAL, só se fizer sentido no contexto):
SELECT SUM(valor_total) FROM pedido WHERE tenant_id = ? AND tipo = 'pedido';
SELECT SUM(valor_total) FROM pedido WHERE tenant_id = ? AND tipo = 'projeto';
```

### 8.3 Query de itens com tratamento de produto_id nullable

```sql
-- Antes (funciona, mas pode perder itens de serviço no futuro):
SELECT ip.*, p.descricao
FROM itens_ped ip
INNER JOIN produto p ON p.id = ip.produto_id;

-- Depois (inclui itens sem produto vinculado):
SELECT
  ip.*,
  COALESCE(p.descricao, ip.descricao_livre) AS descricao_final
FROM itens_ped ip
LEFT JOIN produto p ON p.id = ip.produto_id;
```

> **⚠️ Ação recomendada:** Fazer um `grep` no código procurando `INNER JOIN produto` em queries de `itens_ped` e avaliar se devem virar `LEFT JOIN`. Para os itens existentes (todos tipo 'produto'), o resultado é **idêntico**. A diferença só aparece quando itens de projeto começarem a ser criados.

---

## 9. Checklist de Telas Afetadas

### 9.1 Telas existentes (ajustes mínimos)

| Tela | Ajuste | Prioridade | Esforço |
|---|---|---|---|
| Listagem de pedidos | Adicionar coluna "Tipo" e filtro pedido/projeto | Média | 1h |
| Criação de pedido | Seletor de tipo no topo; se "projeto", mostrar campos extras e ocultar campos irrelevantes | Alta | 4h |
| Detalhe do pedido | Exibir campos de projeto quando `tipo = 'projeto'` | Média | 2h |
| Dashboard principal | Adicionar card de "Projetos em andamento" (opcional) | Baixa | 2h |
| Relatório de comissões | Nenhum (comissão funciona igual) | — | 0 |

### 9.2 Telas novas

| Tela | Descrição | Prioridade | Esforço |
|---|---|---|---|
| Kanban de Projetos | Board visual com drag-and-drop entre fases | Alta | 8h |
| Detalhe de Projeto | Tela estendida com timeline de fases, dados da obra | Média | 6h |
| Dashboard de Projetos | Pipeline por fase, previsão de fechamento, taxa de conversão | Média | 4h |

### 9.3 Lógica condicional na tela de criação

```
Usuário seleciona tipo:
│
├─ 'pedido' (padrão)
│   ├─ Mostrar: status, tabela de preço, produtos do catálogo
│   ├─ Ocultar: fase_projeto, area_m2, cidade_obra, uf_obra, previsao_fechamento
│   └─ Itens: obrigatoriamente vinculados a produto_id
│
└─ 'projeto'
    ├─ Mostrar: fase_projeto, area_m2, cidade_obra, uf_obra, previsao_fechamento
    ├─ Ocultar: status (usa fase_projeto no lugar)
    └─ Itens: permite tipo solucao/servico/customizado sem produto_id
```

---

## 10. Script de Migração Completo

Rodar nesta ordem exata. Cada bloco é independente e tem rollback próprio.

```sql
-- ============================================================
-- SCRIPT DE MIGRAÇÃO COMPLETO
-- RepCRM: Adição de suporte a Projetos
-- Data: ___/___/2026
-- Executado por: ________________
-- ============================================================

-- PRÉ-REQUISITO: BACKUP COMPLETO DO BANCO
-- pg_dump -Fc -f backup_pre_migracao_$(date +%Y%m%d_%H%M).dump nome_do_banco

-- ────────────────────────────────
-- SNAPSHOT PRÉ-MIGRAÇÃO (anotar!)
-- ────────────────────────────────
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped;

-- ────────────────────────────────
-- BLOCO 1: TABELA PEDIDO
-- ────────────────────────────────
BEGIN;

ALTER TABLE pedido ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'pedido';
ALTER TABLE pedido ADD COLUMN fase_projeto VARCHAR(30) NULL;
ALTER TABLE pedido ADD COLUMN area_m2 NUMERIC(10,2) NULL;
ALTER TABLE pedido ADD COLUMN cidade_obra VARCHAR(200) NULL;
ALTER TABLE pedido ADD COLUMN uf_obra CHAR(2) NULL;
ALTER TABLE pedido ADD COLUMN previsao_fechamento DATE NULL;

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_tipo
  CHECK (tipo IN ('pedido', 'projeto'));

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_fase_projeto
  CHECK (
    fase_projeto IS NULL
    OR fase_projeto IN (
      'prospeccao','visita_tecnica','orcamento','negociacao',
      'proposta_enviada','aprovado','em_execucao','concluido',
      'cancelado','perdido'
    )
  );

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_tipo_fase_consistencia
  CHECK (
    (tipo = 'pedido' AND fase_projeto IS NULL)
    OR
    (tipo = 'projeto' AND fase_projeto IS NOT NULL)
  );

CREATE INDEX idx_pedido_tipo ON pedido(tenant_id, tipo);
CREATE INDEX idx_pedido_fase_projeto ON pedido(tenant_id, fase_projeto) WHERE tipo = 'projeto';
CREATE INDEX idx_pedido_previsao_fechamento ON pedido(tenant_id, previsao_fechamento)
  WHERE tipo = 'projeto' AND fase_projeto NOT IN ('concluido','cancelado','perdido');

COMMIT;

-- VALIDAÇÃO BLOCO 1:
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE tipo = 'pedido') AS tipo_pedido,
       COUNT(*) FILTER (WHERE tipo = 'projeto') AS tipo_projeto
FROM pedido;
-- ESPERADO: total = tipo_pedido, tipo_projeto = 0

-- ────────────────────────────────
-- BLOCO 2: TABELA ITENS_PED
-- ────────────────────────────────
BEGIN;

ALTER TABLE itens_ped ADD COLUMN tipo_item VARCHAR(20) NOT NULL DEFAULT 'produto';
ALTER TABLE itens_ped ADD COLUMN descricao_livre VARCHAR(500) NULL;
ALTER TABLE itens_ped ALTER COLUMN produto_id DROP NOT NULL;

ALTER TABLE itens_ped ADD CONSTRAINT ck_itens_ped_tipo_item
  CHECK (tipo_item IN ('produto', 'solucao', 'servico', 'customizado'));

ALTER TABLE itens_ped ADD CONSTRAINT ck_itens_ped_produto_consistencia
  CHECK (
    (tipo_item = 'produto' AND produto_id IS NOT NULL)
    OR
    (tipo_item IN ('solucao', 'servico', 'customizado'))
  );

ALTER TABLE itens_ped ADD CONSTRAINT ck_itens_ped_descricao
  CHECK (produto_id IS NOT NULL OR descricao_livre IS NOT NULL);

CREATE INDEX idx_itens_ped_tipo_item ON itens_ped(tipo_item);

COMMIT;

-- VALIDAÇÃO BLOCO 2:
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE tipo_item = 'produto') AS tipo_produto,
       COUNT(*) FILTER (WHERE produto_id IS NULL) AS sem_produto
FROM itens_ped;
-- ESPERADO: total = tipo_produto, sem_produto = 0

-- ────────────────────────────────
-- BLOCO 3: NOVA TABELA
-- ────────────────────────────────
CREATE TABLE fase_projeto_historico (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  pedido_id     UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES "user"(id) ON DELETE SET NULL,
  fase_anterior VARCHAR(30) NULL,
  fase_nova     VARCHAR(30) NOT NULL,
  motivo        TEXT NULL,
  metadata      JSONB NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fase_hist_pedido ON fase_projeto_historico(pedido_id, created_at);
CREATE INDEX idx_fase_hist_tenant ON fase_projeto_historico(tenant_id, created_at);

-- ────────────────────────────────
-- BLOCO 4: VIEWS (seguro — só adição)
-- ────────────────────────────────
-- [Colar as views da seção 7 aqui]

-- ────────────────────────────────
-- SNAPSHOT PÓS-MIGRAÇÃO (comparar com pré!)
-- ────────────────────────────────
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped;
```

---

## 11. Script de Rollback Completo

Caso algo dê errado, executar na **ordem inversa**:

```sql
-- ============================================================
-- ROLLBACK COMPLETO
-- ⚠️  SÓ EXECUTAR SE ALGO DEU ERRADO NA MIGRAÇÃO
-- ⚠️  NÃO EXECUTAR SE PROJETOS JÁ FORAM CADASTRADOS
-- ============================================================

-- BLOCO 4: Remover views
DROP VIEW IF EXISTS vw_dashboard_resumo;
DROP VIEW IF EXISTS vw_kanban_projetos;
DROP VIEW IF EXISTS vw_pedidos_e_projetos;

-- BLOCO 3: Remover tabela nova
DROP TABLE IF EXISTS fase_projeto_historico;

-- BLOCO 2: Reverter itens_ped
DROP INDEX IF EXISTS idx_itens_ped_tipo_item;
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_ped_descricao;
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_ped_produto_consistencia;
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_ped_tipo_item;
ALTER TABLE itens_ped ALTER COLUMN produto_id SET NOT NULL;  -- ⚠️ só se sem_produto = 0
ALTER TABLE itens_ped DROP COLUMN IF EXISTS descricao_livre;
ALTER TABLE itens_ped DROP COLUMN IF EXISTS tipo_item;

-- BLOCO 1: Reverter pedido
DROP INDEX IF EXISTS idx_pedido_previsao_fechamento;
DROP INDEX IF EXISTS idx_pedido_fase_projeto;
DROP INDEX IF EXISTS idx_pedido_tipo;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_tipo_fase_consistencia;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_fase_projeto;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_tipo;
ALTER TABLE pedido DROP COLUMN IF EXISTS previsao_fechamento;
ALTER TABLE pedido DROP COLUMN IF EXISTS uf_obra;
ALTER TABLE pedido DROP COLUMN IF EXISTS cidade_obra;
ALTER TABLE pedido DROP COLUMN IF EXISTS area_m2;
ALTER TABLE pedido DROP COLUMN IF EXISTS fase_projeto;
ALTER TABLE pedido DROP COLUMN IF EXISTS tipo;

-- VALIDAÇÃO PÓS-ROLLBACK:
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped;
-- ESPERADO: idêntico ao snapshot pré-migração
```

---

## 12. Plano de Execução

### Cronograma sugerido

| Dia | Ação | Responsável |
|---|---|---|
| D-7 | Executar migração em **ambiente de homologação** | Dev |
| D-7 | Testar todos os dashboards existentes em homologação | QA / Dev |
| D-7 | Testar criação de pedido normal (deve funcionar igual) | QA |
| D-5 | Testar criação de projeto com itens tipo serviço | QA |
| D-3 | Validar rollback em homologação (executar e verificar) | Dev |
| D-1 | Comunicar janela de manutenção (se necessário) | Gestor |
| **D-0** | **Backup de produção** | Dev |
| **D-0** | **Snapshot pré-migração** | Dev |
| **D-0** | **Executar migração em produção** (fora do horário comercial) | Dev |
| **D-0** | **Validação pós-migração (seção 13)** | Dev |
| D+1 | Monitorar logs e dashboards durante o dia | Dev |
| D+2 | Liberar criação de projetos para o representante | Gestor |

### Tempo estimado de indisponibilidade

**Zero.** Os ALTERs com DEFAULT e colunas NULLABLE no PostgreSQL são operações de metadata — não reescrevem a tabela. O sistema pode estar rodando durante a execução.

> **Exceção:** Se a tabela `itens_ped` tiver mais de 1 milhão de registros, o `ALTER COLUMN produto_id DROP NOT NULL` pode levar alguns segundos com lock. Nesse caso, usar `ALTER TABLE ... SET NOT NULL` com `NOT VALID` e validar depois. Mas para o volume atual, é instantâneo.

---

## 13. Validação Pós-Migração

### Checklist obrigatório (✓ marcar cada item)

```
[ ] 1. Snapshot pré e pós migração possuem mesmos COUNT e SUM
[ ] 2. SELECT * FROM pedido LIMIT 10 → coluna 'tipo' = 'pedido' em todos
[ ] 3. SELECT * FROM itens_ped LIMIT 10 → coluna 'tipo_item' = 'produto' em todos
[ ] 4. Nenhum registro com produto_id = NULL em itens_ped existentes
[ ] 5. Dashboard principal carrega normalmente com valores corretos
[ ] 6. Dashboard de comissões carrega normalmente
[ ] 7. Listagem de pedidos funciona (exibe coluna tipo)
[ ] 8. Criação de pedido tipo 'pedido' funciona igual ao antes
[ ] 9. Criação de pedido tipo 'projeto' funciona com campos de projeto
[ ] 10. Itens tipo 'servico' podem ser criados sem produto_id
[ ] 11. View vw_kanban_projetos retorna dados (quando houver projetos)
[ ] 12. Constraint impede criar pedido tipo='projeto' sem fase_projeto
[ ] 13. Constraint impede criar item tipo='produto' sem produto_id
```

---

> **Filosofia:** Adicionar, nunca alterar. Tornar opcional, nunca obrigatório. Garantir rollback, nunca rezar. Se deu certo em homologação e os números batem, produção é só replicar.
