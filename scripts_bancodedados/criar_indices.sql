-- ============================================
-- SalesMasters - Script de Criação de Índices
-- Data: 21/12/2024
-- Objetivo: Melhorar performance de queries críticas
-- ============================================

-- FASE 1: ÍNDICES PARA TABELAS DE PREÇO (PRIORIDADE ALTA)
-- ========================================================

-- 1. Busca por indústria + tabela (usado em TODAS as consultas de preço)
CREATE INDEX IF NOT EXISTS idx_tabelaspre_industria_tabela 
ON cad_tabelaspre(itab_idindustria, itab_tabela);

-- 2. Busca por produto (usado em updates e consultas)
CREATE INDEX IF NOT EXISTS idx_tabelaspre_produto 
ON cad_tabelaspre(itab_idprod);

-- 3. Busca por grupo de desconto (usado em filtros)
CREATE INDEX IF NOT EXISTS idx_tabelaspre_grupodesc 
ON cad_tabelaspre(itab_grupodesconto) 
WHERE itab_grupodesconto IS NOT NULL;

-- 4. Busca por status (filtros de ativo/inativo)
CREATE INDEX IF NOT EXISTS idx_tabelaspre_status 
ON cad_tabelaspre(itab_status);

-- FASE 2: ÍNDICES PARA PRODUTOS (PRIORIDADE ALTA)
-- ================================================

-- 5. Busca por indústria + código (muito usado em importações e consultas)
CREATE INDEX IF NOT EXISTS idx_prod_industria_codigo 
ON cad_prod(pro_industria, pro_codprod);

-- 6. Busca por código normalizado (crítico para importação de preços)
CREATE INDEX IF NOT EXISTS idx_prod_codigo_normalizado 
ON cad_prod(pro_codigonormalizado);

-- 7. Busca por nome (full-text search para pesquisas)
CREATE INDEX IF NOT EXISTS idx_prod_nome 
ON cad_prod USING gin(to_tsvector('portuguese', pro_nome));

-- 8. Busca por status (filtros de ativo/inativo)
CREATE INDEX IF NOT EXISTS idx_prod_status 
ON cad_prod(pro_status);

-- FASE 3: ÍNDICES PARA CLIENTES (PRIORIDADE MÉDIA)
-- =================================================

-- 9. Busca por CNPJ/CPF (usado em consultas e validações)
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj 
ON clientes(cli_cnpj);

-- 10. Busca por nome (full-text search)
CREATE INDEX IF NOT EXISTS idx_clientes_nome 
ON clientes USING gin(to_tsvector('portuguese', cli_nomered));

-- 11. Busca por status
CREATE INDEX IF NOT EXISTS idx_clientes_status 
ON clientes(cli_status);

-- FASE 4: ÍNDICES PARA FORNECEDORES (PRIORIDADE MÉDIA)
-- =====================================================

-- 12. Busca por código (usado em relacionamentos)
CREATE INDEX IF NOT EXISTS idx_fornecedores_codigo 
ON fornecedores(for_codigo);

-- 13. Busca por nome (full-text search)
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome 
ON fornecedores USING gin(to_tsvector('portuguese', for_nomered));

-- 14. Busca por status
CREATE INDEX IF NOT EXISTS idx_fornecedores_status 
ON fornecedores(for_status);

-- FASE 5: ÍNDICES PARA PEDIDOS (PRIORIDADE MÉDIA)
-- ================================================

-- 15. Busca por indústria (filtro principal)
CREATE INDEX IF NOT EXISTS idx_pedidos_industria 
ON pedidos(ped_industria);

-- 16. Busca por data (usado em filtros de período)
CREATE INDEX IF NOT EXISTS idx_pedidos_data 
ON pedidos(ped_data);

-- 17. Busca por situação (filtro de status)
CREATE INDEX IF NOT EXISTS idx_pedidos_situacao 
ON pedidos(ped_situacao);

-- 18. Busca composta (indústria + situação + data) - QUERY PRINCIPAL DA TELA DE PEDIDOS
CREATE INDEX IF NOT EXISTS idx_pedidos_industria_situacao_data 
ON pedidos(ped_industria, ped_situacao, ped_data DESC);

-- 19. Busca por cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente 
ON pedidos(ped_cliente);

-- FASE 6: ÍNDICES ADICIONAIS (PRIORIDADE BAIXA)
-- ==============================================

-- 20. Índice para relacionamento cliente-indústria
CREATE INDEX IF NOT EXISTS idx_cli_ind_cliente 
ON cli_ind(cli_codigo);

-- 21. Índice para relacionamento cliente-indústria (fornecedor)
CREATE INDEX IF NOT EXISTS idx_cli_ind_fornecedor 
ON cli_ind(for_codigo);

-- 22. Índice para vendedores
CREATE INDEX IF NOT EXISTS idx_vendedores_codigo 
ON vendedores(ven_codigo);

-- ============================================
-- ANÁLISE DE PERFORMANCE
-- ============================================

-- Verificar tamanho dos índices criados
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verificar uso dos índices
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
