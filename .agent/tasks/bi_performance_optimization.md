---
status: pending
priority: high
created_at: 2026-01-29
---

# 🚀 Otimização de Performance BI (Indústria)

## 🛑 O Problema
- **Sintoma:** Ao selecionar uma indústria no filtro, o dashboard leva **exatos 32 segundos** para carregar.
- **Impacto:** Experiência do usuário inaceitável ("passar vergonha").
- **Suspeita:** A filtragem por `ped_industria` nas views grandes (`vw_performance_mensal`, `vw_analise_portfolio`) está causando *Table Scans* completos na tabela de items/pedidos (milhões de linhas).

## 🎯 Objetivo
- Reduzir tempo de carga de **32s** para **< 3s**.

## 🛠️ Plano de Ação (Amanhã)

### 1. Diagnóstico (Explorar & Analisar)
- Executar `EXPLAIN ANALYZE` nas queries filtradas por indústria.
- Verificar índices existentes na coluna `ped_industria` e `ite_industria` nas tabelas `pedidos` e `itens_ped`.
- **Script:** Criar script `backend/sql/check_indexes.py` para listar índices atuais.

### 2. Otimização de Banco de Dados
- **Índices:** É quase certo que faltam índices compostos:
    - `pedidos(ped_industria, ped_data)`
    - `itens_ped(ite_industria, ite_pedido)`
- **Views:** Verificar se as views forçam joins desnecessários quando o filtro é aplicado.

### 3. Estratégia de Cache
- Validar se o cache do Python (`lru_cache` ou `_engines_cache`) está sendo efetivo para queries parametrizadas.

### 4. Solução Extrema (Caso índices não bastem)
- Criar **Materialized Views** para os dados históricos (2024 pra trás), deixando apenas 2025 para cálculo em tempo real.
