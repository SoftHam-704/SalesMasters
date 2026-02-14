# CRM-Rep — Guia de Migração v2: Suporte a Projetos

**Versão 2.0 | Fevereiro 2026**
**Classificação: CRÍTICO — Sistema em Produção**
**Abordagem: Produtos Genéricos (sem campos nullable em FKs)**

---

## Sumário

1. [Resumo Executivo](#1-resumo-executivo)
2. [O Que Mudou da v1 para v2](#2-o-que-mudou-da-v1-para-v2)
3. [Princípios de Segurança](#3-princípios-de-segurança)
4. [Diagnóstico de Impacto](#4-diagnóstico-de-impacto)
5. [Passo 1 — Produtos Genéricos](#5-passo-1--produtos-genéricos)
6. [Passo 2 — Alterações na Tabela `pedido`](#6-passo-2--alterações-na-tabela-pedido)
7. [Passo 3 — Alterações na Tabela `itens_ped`](#7-passo-3--alterações-na-tabela-itens_ped)
8. [Passo 4 — Tabela `fase_projeto_historico`](#8-passo-4--tabela-fase_projeto_historico)
9. [Passo 5 — Views para Dashboards](#9-passo-5--views-para-dashboards)
10. [Impacto nas Queries Existentes](#10-impacto-nas-queries-existentes)
11. [Checklist de Telas Afetadas](#11-checklist-de-telas-afetadas)
12. [Script de Migração Completo](#12-script-de-migração-completo)
13. [Script de Rollback Completo](#13-script-de-rollback-completo)
14. [Plano de Execução](#14-plano-de-execução)
15. [Validação Pós-Migração](#15-validação-pós-migração)

---

## 1. Resumo Executivo

### O que estamos fazendo

Adicionando suporte a **projetos** (galpões, armazéns) dentro da estrutura existente do SalesMasters/CRM-Rep, reaproveitando as tabelas `pedido` e `itens_ped` sem quebrar nenhuma funcionalidade.

### Estratégia escolhida

| Abordagem | Risco | Escolha |
|---|---|---|
| ❌ Tabela separada `itens_proj` + UNION ALL | Médio-Alto (manter 2 tabelas) | Descartada |
| ❌ `produto_id` NULLABLE em `itens_ped` | Baixo-Médio (quebra JOINs, precisa COALESCE) | Descartada na v2 |
| ✅ **Produtos genéricos + colunas opcionais** | **Mínimo** | **Escolhida** |

### Por que esta abordagem é a mais segura

- `produto_id` em `itens_ped` **continua NOT NULL e INTEGER** — zero alteração na FK
- Todos os INNER JOINs existentes continuam funcionando sem nenhuma mudança
- Nenhuma coluna existente é alterada, renomeada ou removida
- Dashboards existentes funcionam **sem nenhuma alteração** no código
- Produtos genéricos são apenas registros novos — não afetam dados existentes
- Migração é 100% reversível

---

## 2. O Que Mudou da v1 para v2

| Aspecto | v1 (anterior) | v2 (atual) |
|---|---|---|
| `produto_id` em `itens_ped` | Alterado para NULLABLE | **Mantido NOT NULL** ✅ |
| Itens de serviço/solução | Sem `produto_id`, com `descricao_livre` | **Vinculados a produto genérico** ✅ |
| Constraints em `itens_ped` | 3 constraints novas complexas | **1 constraint simples** ✅ |
| JOINs no código | Precisavam virar LEFT JOIN | **Nenhuma alteração** ✅ |
| Rollback de `itens_ped` | Complexo (reverter nullable) | **Trivial (só DROP COLUMN)** ✅ |
| Complexidade geral | Média | **Baixa** ✅ |

---

## 3. Princípios de Segurança

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
│  8. CADA bloco é uma transação independente             │
│  9. produto_id NUNCA será alterado para NULLABLE        │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Diagnóstico de Impacto

### 4.1 O que NÃO muda (zero impacto)

| Componente | Status | Motivo |
|---|---|---|
| Cadastro de clientes | ✅ Intacto | Nenhuma alteração |
| Cadastro de indústrias | ✅ Intacto | Nenhuma alteração |
| Tabelas de preço | ✅ Intacto | Nenhuma alteração |
| Comissões | ✅ Intacto | Nenhuma alteração |
| Visitas | ✅ Intacto | Nenhuma alteração |
| Atividades | ✅ Intacto | Nenhuma alteração |
| Usuários/Auth | ✅ Intacto | Nenhuma alteração |
| **produto_id em itens_ped** | ✅ **Intacto** | **NOT NULL mantido** |
| Pedidos existentes | ✅ Intacto | Recebem `tipo = 'pedido'` via DEFAULT |
| Itens existentes | ✅ Intacto | Recebem `tipo_item = 'produto'` via DEFAULT |
| **Todos os INNER JOINs** | ✅ **Intacto** | **FK não foi alterada** |
| **Todos os dashboards** | ✅ **Intacto** | **SUM/COUNT inalterados** |

### 4.2 O que muda (impacto controlado)

| Componente | Impacto | Ação |
|---|---|---|
| Tabela `produto` | 🟢 Mínimo | +1 coluna `generico` + INSERTs de produtos genéricos |
| Tabela `pedido` | 🟡 Baixo | +6 colunas opcionais |
| Tabela `itens_ped` | 🟢 Mínimo | +1 coluna `tipo_item` (só classificação) |
| Tela de criação de pedido | 🟡 Médio | Seletor de tipo + campos condicionais |
| **Nova tela**: Kanban | 🟢 Novo | View filtrada da tabela pedido |

---

## 5. Passo 1 — Produtos Genéricos

### 5.1 Conceito

Em vez de deixar `produto_id` nullable, cadastramos **produtos genéricos** que representam serviços e soluções usados em projetos. O relacionamento `itens_ped → produto` continua íntegro em 100% dos registros.

```
┌──────────────────────────────────────────────────────────┐
│                    TABELA: produto                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  generico = FALSE (padrão)       generico = TRUE         │
│  ┌─────────────────────┐         ┌─────────────────────┐ │
│  │ Produtos reais       │         │ Serviços e soluções │ │
│  │ da indústria         │         │ para projetos       │ │
│  │                      │         │                     │ │
│  │ Parafuso M10         │         │ SRV-ENG             │ │
│  │ Arruela Lisa 3/8     │         │ SRV-MONT            │ │
│  │ Galpão Bertolini X   │         │ SRV-FRETE           │ │
│  │ Cobertura Thermo Y   │         │ SOL-CUSTOM          │ │
│  │ ...                  │         │ SOL-GALP            │ │
│  │                      │         │ SOL-COB             │ │
│  └─────────────────────┘         └─────────────────────┘ │
│                                                          │
│  Tela pedido: WHERE generico = FALSE                     │
│  Tela projeto: mostra TODOS (genéricos + catálogo)       │
└──────────────────────────────────────────────────────────┘
```

### 5.2 ALTER na tabela `produto`

```sql
-- ============================================================
-- PASSO 1A: Adicionar flag 'generico' na tabela produto
-- IMPACTO: Todos os produtos existentes recebem FALSE (são reais)
-- ROLLBACK: ALTER TABLE produto DROP COLUMN generico;
-- ============================================================

ALTER TABLE produto
  ADD COLUMN generico BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para filtrar genéricos vs. reais
-- ROLLBACK: DROP INDEX idx_produto_generico;
CREATE INDEX idx_produto_generico
  ON produto(industria_id, generico, ativo);
```

### 5.3 Produtos genéricos a cadastrar

Estes produtos devem ser cadastrados **por indústria**. O representante pode ter produtos genéricos diferentes para cada representada. Abaixo a lista sugerida:

```sql
-- ============================================================
-- PASSO 1B: Inserir produtos genéricos
-- IMPACTO: Apenas INSERTs, não afeta dados existentes
-- ROLLBACK: DELETE FROM produto WHERE generico = TRUE;
--
-- ⚠️  IMPORTANTE: Substituir {INDUSTRIA_ID} e {TENANT_ID}
--    pelos IDs reais de cada indústria do representante.
--    Rodar uma vez POR INDÚSTRIA.
-- ============================================================

-- ┌──────────────────────────────────────────────────────┐
-- │  MODELO PARA COPIAR POR INDÚSTRIA                    │
-- │  Trocar {TENANT_ID} e {INDUSTRIA_ID} antes de rodar  │
-- └──────────────────────────────────────────────────────┘

INSERT INTO produto (tenant_id, industria_id, codigo, descricao, descricao_curta, unidade, generico, ativo)
VALUES
  -- Soluções (itens de projeto vinculados ao catálogo da indústria)
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-GALP',    'Estrutura de Galpão',                'Galpão',             'UN', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-COB',     'Cobertura e Fechamento',             'Cobertura',          'M2', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-GALP-TM', 'Galpão Pré-Moldado (Telha Metálica)','Galpão TM',          'UN', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-GALP-TA', 'Galpão Pré-Moldado (Termoacústico)', 'Galpão TA',          'UN', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-MEZANINO','Mezanino Metálico',                  'Mezanino',           'M2', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-DOCA',    'Plataforma de Doca',                 'Doca',               'UN', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SOL-CUSTOM',  'Solução Customizada',                'Customizado',        'UN', TRUE, TRUE),

  -- Serviços (itens sem produto físico)
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-ENG',     'Projeto de Engenharia Estrutural',   'Proj. Engenharia',   'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-ARQ',     'Projeto Arquitetônico',              'Proj. Arquitetura',  'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-MONT',    'Instalação e Montagem',              'Montagem',           'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-FRETE',   'Frete e Logística',                  'Frete',              'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-FUND',    'Fundação e Terraplanagem',           'Fundação',           'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-ELET',    'Instalação Elétrica',                'Elétrica',           'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-HIDR',    'Instalação Hidráulica',              'Hidráulica',         'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-PISO',    'Adequação de Piso Industrial',       'Piso Industrial',    'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-ACOMP',   'Acompanhamento de Obra',             'Acomp. Obra',        'SV', TRUE, TRUE),
  ({TENANT_ID}, {INDUSTRIA_ID}, 'SRV-OUTROS',  'Outros Serviços',                    'Outros',             'SV', TRUE, TRUE);
```

### 5.4 Exemplo prático: Projeto de Galpão Bertolini

Depois da migração, um projeto ficaria assim na tabela `itens_ped`:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  PEDIDO #1547  |  tipo = 'projeto'  |  fase = 'orcamento'                      │
│  Cliente: Distribuidora ABC  |  Indústria: Bertolini                           │
│  Cidade Obra: Uberlândia/MG  |  Área: 800 m²                                  │
├──────┬────────────┬──────────────────────────────────────┬─────┬───────────────┤
│ seq  │ produto_id │ descricao_produto                    │ qtd │    subtotal   │
├──────┼────────────┼──────────────────────────────────────┼─────┼───────────────┤
│  1   │    1042    │ Galpão Pré-Moldado (Termoacústico)   │  1  │ R$ 180.000,00 │
│  2   │    1044    │ Mezanino Metálico                    │ 200 │  R$ 48.000,00 │
│  3   │    1048    │ Projeto de Engenharia Estrutural     │  1  │   R$ 8.000,00 │
│  4   │    1050    │ Instalação e Montagem                │  1  │  R$ 25.000,00 │
│  5   │    1051    │ Frete e Logística                    │  1  │  R$ 12.000,00 │
│  6   │    1053    │ Adequação de Piso Industrial         │ 800 │  R$ 15.000,00 │
├──────┴────────────┴──────────────────────────────────────┴─────┼───────────────┤
│                                                   valor_total: │ R$ 288.000,00 │
│                                           comissão estimada 4%:│  R$ 11.520,00 │
└────────────────────────────────────────────────────────────────┴───────────────┘
```

Note: **todos os itens têm `produto_id` preenchido** (inteiro, NOT NULL). O JOIN com a tabela `produto` continua funcionando perfeitamente. O dashboard que faz `SUM(subtotal)` pega esse projeto junto com os pedidos normais.

---

## 6. Passo 2 — Alterações na Tabela `pedido`

### 6.1 Novas colunas

| Coluna | Tipo | Null | Default | Propósito |
|---|---|---|---|---|
| `tipo` | `VARCHAR(20)` | N | `'pedido'` | Discriminador: 'pedido' ou 'projeto' |
| `fase_projeto` | `VARCHAR(30)` | S | `NULL` | Estágio atual no Kanban |
| `area_m2` | `DECIMAL(10,2)` | S | `NULL` | Dimensão do galpão/armazém |
| `cidade_obra` | `VARCHAR(200)` | S | `NULL` | Localização da obra |
| `uf_obra` | `CHAR(2)` | S | `NULL` | Estado da obra |
| `previsao_fechamento` | `DATE` | S | `NULL` | Data prevista de fechamento |

> **Todas as colunas novas são NULLABLE ou possuem DEFAULT.** Registros existentes não são afetados.

### 6.2 Valores de `fase_projeto` e fluxo Kanban

```
prospeccao → visita_tecnica → orcamento → negociacao →
proposta_enviada → aprovado → em_execucao → concluido

Estados terminais: cancelado, perdido
```

```
┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐
│ Prospecção  │→ │Visita Técnica│→ │ Orçamento │→ │ Negociação │
│    (3)      │  │     (2)      │  │    (4)    │  │    (1)     │
└────────────┘  └──────────────┘  └───────────┘  └────────────┘
       ↓                                                ↓
┌──────────────────┐  ┌───────────┐  ┌─────────────┐  ┌───────────┐
│ Proposta Enviada │→ │ Aprovado  │→ │ Em Execução │→ │ Concluído │
│       (2)        │  │    (1)    │  │     (1)     │  │    (5)    │
└──────────────────┘  └───────────┘  └─────────────┘  └───────────┘
```

### 6.3 Como pedidos e projetos convivem

```
┌──────────────────────────────────────────────────────────┐
│                    TABELA: pedido                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  tipo = 'pedido'               tipo = 'projeto'          │
│  ┌────────────────────┐        ┌────────────────────┐    │
│  │ Usa: status         │        │ Usa: fase_projeto   │    │
│  │ (rascunho, enviado, │        │ (prospeccao,        │    │
│  │  aprovado, faturado)│        │  orcamento,         │    │
│  │                     │        │  aprovado,          │    │
│  │ fase_projeto = NULL │        │  em_execucao...)    │    │
│  │ area_m2 = NULL      │        │                     │    │
│  │ cidade_obra = NULL  │        │ area_m2 = 800.00    │    │
│  │                     │        │ cidade_obra = ...    │    │
│  │ ➜ Fluxo que já      │        │                     │    │
│  │   existe hoje       │        │ ➜ Fluxo novo        │    │
│  └────────────────────┘        │   (Kanban)          │    │
│                                 └────────────────────┘    │
│                                                          │
│  Dashboards: SUM(valor_total) pega TUDO ✅               │
│  Separar: WHERE tipo = 'pedido' OU tipo = 'projeto'      │
└──────────────────────────────────────────────────────────┘
```

### 6.4 SQL

```sql
-- ============================================================
-- PASSO 2: ALTER TABLE pedido
-- Pré-requisito: Passo 1 concluído com sucesso
-- Tempo estimado: < 1 segundo
-- ============================================================

-- 2A: Tipo do registro
-- ROLLBACK: ALTER TABLE pedido DROP COLUMN tipo;
ALTER TABLE pedido
  ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'pedido';

-- 2B: Campos específicos de projeto (todos NULLABLE)
-- ROLLBACK individual: ALTER TABLE pedido DROP COLUMN {nome};
ALTER TABLE pedido ADD COLUMN fase_projeto VARCHAR(30) NULL;
ALTER TABLE pedido ADD COLUMN area_m2 DECIMAL(10,2) NULL;
ALTER TABLE pedido ADD COLUMN cidade_obra VARCHAR(200) NULL;
ALTER TABLE pedido ADD COLUMN uf_obra CHAR(2) NULL;
ALTER TABLE pedido ADD COLUMN previsao_fechamento DATE NULL;

-- 2C: Constraint — valores válidos para tipo
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_tipo;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_tipo
  CHECK (tipo IN ('pedido', 'projeto'));

-- 2D: Constraint — valores válidos para fase_projeto
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_fase;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_fase
  CHECK (
    fase_projeto IS NULL
    OR fase_projeto IN (
      'prospeccao', 'visita_tecnica', 'orcamento', 'negociacao',
      'proposta_enviada', 'aprovado', 'em_execucao', 'concluido',
      'cancelado', 'perdido'
    )
  );

-- 2E: Constraint — consistência tipo × fase
-- ROLLBACK: ALTER TABLE pedido DROP CONSTRAINT ck_pedido_tipo_fase;
ALTER TABLE pedido
  ADD CONSTRAINT ck_pedido_tipo_fase
  CHECK (
    (tipo = 'pedido'  AND fase_projeto IS NULL)
    OR
    (tipo = 'projeto' AND fase_projeto IS NOT NULL)
  );

-- 2F: Índices
-- ROLLBACK: DROP INDEX idx_pedido_tipo;
CREATE INDEX idx_pedido_tipo
  ON pedido(tenant_id, tipo);

-- ROLLBACK: DROP INDEX idx_pedido_fase;
CREATE INDEX idx_pedido_fase
  ON pedido(tenant_id, fase_projeto)
  WHERE tipo = 'projeto';

-- ROLLBACK: DROP INDEX idx_pedido_prev_fech;
CREATE INDEX idx_pedido_prev_fech
  ON pedido(tenant_id, previsao_fechamento)
  WHERE tipo = 'projeto'
    AND fase_projeto NOT IN ('concluido', 'cancelado', 'perdido');
```

### 6.5 Validação

```sql
-- Rodar ANTES e DEPOIS — comparar resultados
SELECT
  COUNT(*) AS total_pedidos,
  SUM(valor_total) AS soma_valores,
  COUNT(*) FILTER (WHERE tipo = 'pedido') AS qtd_tipo_pedido,
  COUNT(*) FILTER (WHERE tipo = 'projeto') AS qtd_tipo_projeto,
  COUNT(*) FILTER (WHERE fase_projeto IS NOT NULL) AS qtd_com_fase
FROM pedido;

-- ESPERADO APÓS MIGRAÇÃO:
-- total_pedidos: mesmo que antes
-- soma_valores: mesmo que antes
-- qtd_tipo_pedido: igual ao total (todos existentes viraram 'pedido')
-- qtd_tipo_projeto: 0
-- qtd_com_fase: 0
```

---

## 7. Passo 3 — Alterações na Tabela `itens_ped`

### 7.1 Escopo reduzido (comparado à v1)

| v1 (descartada) | v2 (atual) |
|---|---|
| ~~ALTER produto_id DROP NOT NULL~~ | **produto_id permanece NOT NULL** ✅ |
| ~~ADD descricao_livre~~ | **Desnecessário** (usa produto.descricao) ✅ |
| ~~3 constraints complexas~~ | **1 constraint simples** ✅ |
| ADD tipo_item | ADD tipo_item ✅ |

### 7.2 Nova coluna

| Coluna | Tipo | Null | Default | Propósito |
|---|---|---|---|---|
| `tipo_item` | `VARCHAR(20)` | N | `'produto'` | Classificar: produto, solucao, servico |

> Esta coluna é apenas **informativa/classificatória**. Não afeta cálculos, JOINs ou dashboards. Serve para filtrar na tela e para relatórios futuros.

### 7.3 SQL

```sql
-- ============================================================
-- PASSO 3: ALTER TABLE itens_ped
-- Pré-requisito: Passos 1 e 2 concluídos
-- Tempo estimado: < 1 segundo
-- ============================================================

-- 3A: Tipo do item (classificação)
-- ROLLBACK: ALTER TABLE itens_ped DROP COLUMN tipo_item;
ALTER TABLE itens_ped
  ADD COLUMN tipo_item VARCHAR(20) NOT NULL DEFAULT 'produto';

-- 3B: Constraint — valores válidos
-- ROLLBACK: ALTER TABLE itens_ped DROP CONSTRAINT ck_itens_tipo_item;
ALTER TABLE itens_ped
  ADD CONSTRAINT ck_itens_tipo_item
  CHECK (tipo_item IN ('produto', 'solucao', 'servico'));

-- 3C: Índice para filtro
-- ROLLBACK: DROP INDEX idx_itens_ped_tipo_item;
CREATE INDEX idx_itens_ped_tipo_item
  ON itens_ped(tipo_item);
```

> **É só isso.** Comparado com a v1 que tinha 7 passos nesta tabela, agora são 3. E o mais importante: **`produto_id` não foi tocado.**

### 7.4 Validação

```sql
-- Rodar ANTES e DEPOIS — comparar
SELECT
  COUNT(*) AS total_itens,
  SUM(subtotal) AS soma_subtotais,
  SUM(quantidade * preco_unitario) AS soma_calculada,
  COUNT(*) FILTER (WHERE tipo_item = 'produto') AS qtd_tipo_produto,
  COUNT(*) FILTER (WHERE tipo_item != 'produto') AS qtd_tipo_outro
FROM itens_ped;

-- ESPERADO APÓS MIGRAÇÃO:
-- total_itens: mesmo que antes
-- soma_subtotais: mesmo que antes
-- soma_calculada: mesmo que antes
-- qtd_tipo_produto: igual ao total
-- qtd_tipo_outro: 0

-- VALIDAÇÃO EXTRA: JOINs com produto intactos
SELECT COUNT(*) FROM itens_ped;
SELECT COUNT(*) FROM itens_ped ip INNER JOIN produto p ON p.id = ip.produto_id;
-- ESPERADO: os dois SELECTs retornam o MESMO número
```

---

## 8. Passo 4 — Tabela `fase_projeto_historico`

Log de mudanças de fase no Kanban. Essencial para métricas (tempo médio por fase, gargalos do funil).

```sql
-- ============================================================
-- PASSO 4: Nova tabela (zero impacto em tabelas existentes)
-- ROLLBACK: DROP TABLE fase_projeto_historico;
-- ============================================================

CREATE TABLE fase_projeto_historico (
  id              INT PRIMARY KEY AUTO_INCREMENT,    -- ou SERIAL no PostgreSQL
  tenant_id       INT NOT NULL,
  pedido_id       INT NOT NULL,
  user_id         INT NULL,

  fase_anterior   VARCHAR(30) NULL,                  -- NULL na criação
  fase_nova       VARCHAR(30) NOT NULL,
  motivo          TEXT NULL,
  metadata        JSON NULL,

  created_at      DATETIME NOT NULL DEFAULT NOW(),

  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuario(id) ON DELETE SET NULL
);

CREATE INDEX idx_fase_hist_pedido ON fase_projeto_historico(pedido_id, created_at);
CREATE INDEX idx_fase_hist_tenant ON fase_projeto_historico(tenant_id, created_at);
```

> **Nota:** Ajustar `usuario` para o nome real da tabela de usuários no SalesMasters. Ajustar `INT/SERIAL` vs `AUTO_INCREMENT` conforme o SGBD (PostgreSQL vs MySQL).

---

## 9. Passo 5 — Views para Dashboards

### 9.1 View unificada

```sql
-- ============================================================
-- View que unifica pedidos e projetos para dashboards
-- IMPACTO: Zero (adição, não substitui nada)
-- ROLLBACK: DROP VIEW vw_pedidos_e_projetos;
-- ============================================================

CREATE OR REPLACE VIEW vw_pedidos_e_projetos AS
SELECT
  p.id,
  p.tenant_id,
  p.numero,
  p.tipo,
  p.cliente_id,
  c.nome_fantasia AS cliente_nome,
  p.industria_id,
  i.nome_fantasia AS industria_nome,

  -- Campos de pedido
  p.status,
  p.data_pedido,

  -- Campos de projeto
  p.fase_projeto,
  p.area_m2,
  p.cidade_obra,
  p.uf_obra,
  p.previsao_fechamento,

  -- Financeiro (funciona para AMBOS)
  p.subtotal,
  p.valor_total,
  p.comissao_estimada,
  p.comissao_percentual,

  -- Métricas calculadas
  CASE
    WHEN p.tipo = 'projeto'
      AND p.fase_projeto NOT IN ('concluido','cancelado','perdido')
    THEN DATEDIFF(CURDATE(), p.data_pedido)
    ELSE NULL
  END AS dias_em_andamento,

  CASE
    WHEN p.tipo = 'projeto'
      AND p.previsao_fechamento IS NOT NULL
    THEN DATEDIFF(p.previsao_fechamento, CURDATE())
    ELSE NULL
  END AS dias_para_previsao,

  p.created_at,
  p.updated_at

FROM pedido p
LEFT JOIN cliente c ON c.id = p.cliente_id
LEFT JOIN industria i ON i.id = p.industria_id
WHERE p.deleted_at IS NULL;
```

> **Nota:** Substituir `DATEDIFF`/`CURDATE()` pela sintaxe do seu SGBD. PostgreSQL: `CURRENT_DATE - p.data_pedido`. MySQL: `DATEDIFF(CURDATE(), p.data_pedido)`.

### 9.2 View do Kanban

```sql
-- ROLLBACK: DROP VIEW vw_kanban_projetos;

CREATE OR REPLACE VIEW vw_kanban_projetos AS
SELECT
  p.id,
  p.tenant_id,
  p.numero,
  p.fase_projeto,
  c.nome_fantasia AS cliente_nome,
  i.nome_fantasia AS industria_nome,
  p.cidade_obra,
  p.uf_obra,
  p.area_m2,
  p.valor_total,
  p.comissao_estimada,
  p.previsao_fechamento,
  p.data_pedido AS data_criacao,

  -- Alerta de estagnação
  CASE
    WHEN DATEDIFF(CURDATE(), p.updated_at) > 14 THEN 'critico'
    WHEN DATEDIFF(CURDATE(), p.updated_at) > 7  THEN 'atencao'
    ELSE 'normal'
  END AS alerta,

  p.observacoes,
  p.updated_at AS ultima_movimentacao

FROM pedido p
LEFT JOIN cliente c ON c.id = p.cliente_id
LEFT JOIN industria i ON i.id = p.industria_id
WHERE p.tipo = 'projeto'
  AND p.deleted_at IS NULL
  AND p.fase_projeto NOT IN ('cancelado', 'perdido')
ORDER BY
  FIELD(p.fase_projeto,
    'prospeccao', 'visita_tecnica', 'orcamento', 'negociacao',
    'proposta_enviada', 'aprovado', 'em_execucao', 'concluido'
  ),
  p.previsao_fechamento ASC;
```

> **Nota PostgreSQL:** Substituir `FIELD(...)` por `CASE WHEN fase_projeto = 'prospeccao' THEN 1 WHEN ... END`.

### 9.3 View de resumo para dashboard

```sql
-- ROLLBACK: DROP VIEW vw_dashboard_resumo;

CREATE OR REPLACE VIEW vw_dashboard_resumo AS
SELECT
  p.tenant_id,
  p.tipo,
  DATE_FORMAT(p.data_pedido, '%Y-%m') AS mes,

  COUNT(*) AS total,

  -- Ganhos
  SUM(CASE
    WHEN (p.tipo = 'pedido'  AND p.status IN ('aprovado','faturado','entregue'))
      OR (p.tipo = 'projeto' AND p.fase_projeto IN ('aprovado','em_execucao','concluido'))
    THEN 1 ELSE 0
  END) AS ganhos,

  -- Financeiro
  SUM(p.valor_total) AS pipeline_total,

  SUM(CASE
    WHEN (p.tipo = 'pedido'  AND p.status IN ('faturado','entregue'))
      OR (p.tipo = 'projeto' AND p.fase_projeto = 'concluido')
    THEN p.valor_total ELSE 0
  END) AS faturado,

  SUM(p.comissao_estimada) AS comissao_pipeline,

  SUM(CASE
    WHEN (p.tipo = 'pedido'  AND p.status IN ('faturado','entregue'))
      OR (p.tipo = 'projeto' AND p.fase_projeto = 'concluido')
    THEN p.comissao_estimada ELSE 0
  END) AS comissao_realizada

FROM pedido p
WHERE p.deleted_at IS NULL
GROUP BY p.tenant_id, p.tipo, DATE_FORMAT(p.data_pedido, '%Y-%m');
```

> **Nota PostgreSQL:** Substituir `DATE_FORMAT(...)` por `TO_CHAR(p.data_pedido, 'YYYY-MM')`.

---

## 10. Impacto nas Queries Existentes

### 10.1 Queries que NÃO mudam (maioria)

```sql
-- ✅ Todos continuam funcionando identicamente:
SELECT SUM(valor_total) FROM pedido WHERE tenant_id = ?;
SELECT SUM(subtotal) FROM itens_ped WHERE pedido_id = ?;
SELECT COUNT(*) FROM pedido WHERE status = 'faturado';
SELECT ip.*, p.descricao FROM itens_ped ip INNER JOIN produto p ON p.id = ip.produto_id;
```

### 10.2 Tela de seleção de produtos (única mudança relevante)

```sql
-- ANTES (pedido tradicional — continua igual):
SELECT * FROM produto
WHERE industria_id = ?
  AND ativo = TRUE
ORDER BY descricao;

-- DEPOIS — tela de PEDIDO (excluir genéricos):
SELECT * FROM produto
WHERE industria_id = ?
  AND ativo = TRUE
  AND generico = FALSE        -- ← ÚNICO filtro adicional
ORDER BY descricao;

-- DEPOIS — tela de PROJETO (mostrar todos, genéricos primeiro):
SELECT * FROM produto
WHERE industria_id = ?
  AND ativo = TRUE
ORDER BY generico DESC, descricao;
-- genéricos aparecem primeiro, depois catálogo da indústria
```

### 10.3 Relatório de itens por tipo (novo, opcional)

```sql
-- Relatório: composição de itens por tipo
SELECT
  ip.tipo_item,
  COUNT(*) AS qtd_itens,
  SUM(ip.subtotal) AS valor_total,
  ROUND(100.0 * SUM(ip.subtotal) / SUM(SUM(ip.subtotal)) OVER(), 1) AS percentual
FROM itens_ped ip
JOIN pedido p ON p.id = ip.pedido_id
WHERE p.tenant_id = ?
  AND p.tipo = 'projeto'
GROUP BY ip.tipo_item
ORDER BY valor_total DESC;

-- Exemplo de resultado:
-- | tipo_item | qtd_itens | valor_total  | percentual |
-- |-----------|-----------|------------- |------------|
-- | solucao   |       12  | R$ 890.000   |     68,3%  |
-- | servico   |       28  | R$ 320.000   |     24,6%  |
-- | produto   |        8  | R$  93.000   |      7,1%  |
```

---

## 11. Checklist de Telas Afetadas

### 11.1 Telas existentes

| Tela | Ajuste | Esforço |
|---|---|---|
| Listagem de pedidos | Adicionar coluna "Tipo" com badge e filtro | ~1h |
| Criação de pedido | Seletor tipo no topo; se 'projeto', mostrar campos extras | ~4h |
| Detalhe do pedido | Exibir campos de projeto quando `tipo = 'projeto'` | ~2h |
| Seletor de produtos | Filtrar `generico = FALSE` para pedidos, mostrar todos para projetos | ~30min |
| Dashboard principal | Adicionar card "Projetos em andamento" (opcional) | ~2h |

### 11.2 Telas novas

| Tela | Descrição | Esforço |
|---|---|---|
| Kanban de Projetos | Board visual com drag-and-drop entre fases | ~8h |
| Detalhe de Projeto | Tela com timeline de fases e dados da obra | ~6h |
| Dashboard de Projetos | Pipeline, previsão, taxa de conversão | ~4h |

### 11.3 Lógica da tela de criação

```
Usuário seleciona tipo no topo da tela:
│
├─ 'pedido' (padrão, botão selecionado)
│   ├─ Mostrar: status, tabela de preço
│   ├─ Ocultar: fase_projeto, area_m2, cidade_obra, uf_obra, previsao_fechamento
│   ├─ Seletor de produtos: WHERE generico = FALSE (catálogo da indústria)
│   └─ tipo_item dos itens: sempre 'produto'
│
└─ 'projeto' (segundo botão)
    ├─ Mostrar: fase_projeto, area_m2, cidade_obra, uf_obra, previsao_fechamento
    ├─ Ocultar: status (usa fase_projeto)
    ├─ Seletor de produtos: todos (genéricos primeiro, depois catálogo)
    └─ tipo_item dos itens: baseado no produto selecionado
        ├─ produto.generico = TRUE AND codigo LIKE 'SOL-%' → 'solucao'
        ├─ produto.generico = TRUE AND codigo LIKE 'SRV-%' → 'servico'
        └─ produto.generico = FALSE → 'produto'
```

---

## 12. Script de Migração Completo

Rodar nesta ordem. Cada bloco é independente.

```sql
-- ============================================================
-- MIGRAÇÃO COMPLETA — CRM-Rep v2
-- Data: ___/___/2026
-- Executado por: ________________
-- Ambiente: [ ] Homologação  [ ] Produção
-- ============================================================

-- ┌─────────────────────────────────────────────────────┐
-- │  PRÉ-REQUISITO: BACKUP COMPLETO DO BANCO            │
-- │  mysqldump -u root -p banco > backup_pre_v2.sql      │
-- │  OU                                                   │
-- │  pg_dump -Fc -f backup_pre_v2.dump banco              │
-- └─────────────────────────────────────────────────────┘

-- ┌─────────────────────────────────────────────────────┐
-- │  SNAPSHOT PRÉ-MIGRAÇÃO (anotar os números!)          │
-- └─────────────────────────────────────────────────────┘
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped
UNION ALL
SELECT 'produto', COUNT(*), NULL FROM produto;


-- ═══════════════════════════════════════════════════════
-- BLOCO 1: TABELA PRODUTO
-- ═══════════════════════════════════════════════════════

ALTER TABLE produto
  ADD COLUMN generico BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_produto_generico
  ON produto(industria_id, generico, ativo);

-- Inserir produtos genéricos (AJUSTAR IDs!)
-- [Colar os INSERTs da seção 5.3 com IDs corretos]


-- ═══════════════════════════════════════════════════════
-- BLOCO 2: TABELA PEDIDO
-- ═══════════════════════════════════════════════════════

ALTER TABLE pedido ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'pedido';
ALTER TABLE pedido ADD COLUMN fase_projeto VARCHAR(30) NULL;
ALTER TABLE pedido ADD COLUMN area_m2 DECIMAL(10,2) NULL;
ALTER TABLE pedido ADD COLUMN cidade_obra VARCHAR(200) NULL;
ALTER TABLE pedido ADD COLUMN uf_obra CHAR(2) NULL;
ALTER TABLE pedido ADD COLUMN previsao_fechamento DATE NULL;

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_tipo
  CHECK (tipo IN ('pedido', 'projeto'));

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_fase
  CHECK (
    fase_projeto IS NULL
    OR fase_projeto IN (
      'prospeccao','visita_tecnica','orcamento','negociacao',
      'proposta_enviada','aprovado','em_execucao','concluido',
      'cancelado','perdido'
    )
  );

ALTER TABLE pedido ADD CONSTRAINT ck_pedido_tipo_fase
  CHECK (
    (tipo = 'pedido' AND fase_projeto IS NULL)
    OR
    (tipo = 'projeto' AND fase_projeto IS NOT NULL)
  );

CREATE INDEX idx_pedido_tipo ON pedido(tenant_id, tipo);
CREATE INDEX idx_pedido_fase ON pedido(tenant_id, fase_projeto) WHERE tipo = 'projeto';
CREATE INDEX idx_pedido_prev_fech ON pedido(tenant_id, previsao_fechamento)
  WHERE tipo = 'projeto' AND fase_projeto NOT IN ('concluido','cancelado','perdido');


-- ═══════════════════════════════════════════════════════
-- BLOCO 3: TABELA ITENS_PED
-- ═══════════════════════════════════════════════════════

ALTER TABLE itens_ped
  ADD COLUMN tipo_item VARCHAR(20) NOT NULL DEFAULT 'produto';

ALTER TABLE itens_ped ADD CONSTRAINT ck_itens_tipo_item
  CHECK (tipo_item IN ('produto', 'solucao', 'servico'));

CREATE INDEX idx_itens_ped_tipo_item ON itens_ped(tipo_item);


-- ═══════════════════════════════════════════════════════
-- BLOCO 4: TABELA NOVA — HISTÓRICO DE FASES
-- ═══════════════════════════════════════════════════════

CREATE TABLE fase_projeto_historico (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  pedido_id       INT NOT NULL,
  user_id         INT NULL,
  fase_anterior   VARCHAR(30) NULL,
  fase_nova       VARCHAR(30) NOT NULL,
  motivo          TEXT NULL,
  metadata        JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
);

CREATE INDEX idx_fase_hist_pedido ON fase_projeto_historico(pedido_id, created_at);
CREATE INDEX idx_fase_hist_tenant ON fase_projeto_historico(tenant_id, created_at);


-- ═══════════════════════════════════════════════════════
-- BLOCO 5: VIEWS
-- ═══════════════════════════════════════════════════════

-- [Colar as views da seção 9 aqui]


-- ┌─────────────────────────────────────────────────────┐
-- │  SNAPSHOT PÓS-MIGRAÇÃO (comparar com pré!)           │
-- └─────────────────────────────────────────────────────┘
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped
UNION ALL
SELECT 'produto', COUNT(*), NULL FROM produto;

-- produto terá +N registros (os genéricos inseridos)
-- pedido e itens_ped: MESMOS números de antes
```

---

## 13. Script de Rollback Completo

```sql
-- ============================================================
-- ROLLBACK COMPLETO — Reverter TODA a migração v2
-- ⚠️  SÓ executar se algo deu errado
-- ⚠️  NÃO executar se projetos já foram cadastrados no sistema
-- ============================================================

-- BLOCO 5: Views
DROP VIEW IF EXISTS vw_dashboard_resumo;
DROP VIEW IF EXISTS vw_kanban_projetos;
DROP VIEW IF EXISTS vw_pedidos_e_projetos;

-- BLOCO 4: Tabela nova
DROP TABLE IF EXISTS fase_projeto_historico;

-- BLOCO 3: itens_ped
DROP INDEX IF EXISTS idx_itens_ped_tipo_item;
ALTER TABLE itens_ped DROP CONSTRAINT IF EXISTS ck_itens_tipo_item;
ALTER TABLE itens_ped DROP COLUMN IF EXISTS tipo_item;

-- BLOCO 2: pedido
DROP INDEX IF EXISTS idx_pedido_prev_fech;
DROP INDEX IF EXISTS idx_pedido_fase;
DROP INDEX IF EXISTS idx_pedido_tipo;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_tipo_fase;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_fase;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS ck_pedido_tipo;
ALTER TABLE pedido DROP COLUMN IF EXISTS previsao_fechamento;
ALTER TABLE pedido DROP COLUMN IF EXISTS uf_obra;
ALTER TABLE pedido DROP COLUMN IF EXISTS cidade_obra;
ALTER TABLE pedido DROP COLUMN IF EXISTS area_m2;
ALTER TABLE pedido DROP COLUMN IF EXISTS fase_projeto;
ALTER TABLE pedido DROP COLUMN IF EXISTS tipo;

-- BLOCO 1: produto
DELETE FROM produto WHERE generico = TRUE;
DROP INDEX IF EXISTS idx_produto_generico;
ALTER TABLE produto DROP COLUMN IF EXISTS generico;

-- VALIDAÇÃO PÓS-ROLLBACK:
SELECT 'pedido' AS tabela, COUNT(*) AS registros, SUM(valor_total) AS soma FROM pedido
UNION ALL
SELECT 'itens_ped', COUNT(*), SUM(subtotal) FROM itens_ped
UNION ALL
SELECT 'produto', COUNT(*), NULL FROM produto;
-- ESPERADO: números idênticos ao snapshot pré-migração
```

---

## 14. Plano de Execução

| Dia | Ação | Quem |
|---|---|---|
| D-7 | Migração completa em **homologação** | Dev |
| D-7 | Testar TODOS os dashboards existentes | Dev |
| D-7 | Testar criação de pedido normal (deve funcionar igual) | Dev |
| D-5 | Testar criação de projeto com itens genéricos | Dev |
| D-3 | Testar rollback completo em homologação | Dev |
| D-1 | Comunicar janela de manutenção (se necessário) | Gestor |
| **D-0** | **Backup de produção** | Dev |
| **D-0** | **Snapshot pré-migração (anotar números)** | Dev |
| **D-0** | **Rodar migração** (fora do horário comercial) | Dev |
| **D-0** | **Validação pós-migração (seção 15)** | Dev |
| D+1 | Monitorar dashboards e logs durante o dia | Dev |
| D+2 | Liberar criação de projetos para o representante | Gestor |

### Tempo de indisponibilidade estimado

**Zero.** Os ALTERs com colunas DEFAULT e NULLABLE são operações de metadata. O sistema pode estar rodando. Os INSERTs de produtos genéricos são registros novos que não afetam nada existente.

---

## 15. Validação Pós-Migração

### Checklist obrigatório

```
SNAPSHOT:
[ ] Snapshot pré e pós possuem mesmos COUNT e SUM para pedido e itens_ped
[ ] Tabela produto tem +N registros (genéricos), restante igual

PEDIDO:
[ ] SELECT * FROM pedido LIMIT 20 → tipo = 'pedido' em todos
[ ] Nenhum registro com fase_projeto preenchida
[ ] Dashboard principal carrega com valores corretos
[ ] Criação de pedido tipo 'pedido' funciona igual ao antes
[ ] Constraint impede tipo='projeto' sem fase_projeto ✓

ITENS_PED:
[ ] SELECT * FROM itens_ped LIMIT 20 → tipo_item = 'produto' em todos
[ ] INNER JOIN com produto retorna mesmo COUNT que SELECT COUNT(*) FROM itens_ped
[ ] produto_id continua NOT NULL em todos os registros

PRODUTO:
[ ] Produtos genéricos visíveis com generico = TRUE
[ ] Produtos existentes com generico = FALSE
[ ] Tela de pedido NÃO mostra genéricos
[ ] Tela de projeto mostra genéricos + catálogo

PROJETO (após liberar funcionalidade):
[ ] Criar projeto com itens genéricos funciona
[ ] Kanban exibe projeto na fase correta
[ ] Mover projeto entre fases registra histórico
[ ] Dashboard inclui valor do projeto no total ✓
```

---

## Resumo das Alterações (Visão Geral)

```
┌─────────────────────────────────────────────────────────┐
│  TABELA PRODUTO:  +1 coluna  +N registros genéricos     │
│  TABELA PEDIDO:   +6 colunas  +3 constraints  +3 idx   │
│  TABELA ITENS_PED: +1 coluna  +1 constraint   +1 idx   │
│  TABELA NOVA:     fase_projeto_historico                 │
│  VIEWS NOVAS:     3 views para dashboards                │
│                                                          │
│  COLUNAS ALTERADAS: 0 (zero)                             │
│  COLUNAS REMOVIDAS: 0 (zero)                             │
│  TABELAS REMOVIDAS: 0 (zero)                             │
│  ÍNDICES REMOVIDOS: 0 (zero)                             │
│  FKs ALTERADAS:     0 (zero)                             │
│  DADOS MODIFICADOS: 0 (zero)                             │
│                                                          │
│  FILOSOFIA: Só adicionamos. Nunca alteramos.             │
└─────────────────────────────────────────────────────────┘
```
