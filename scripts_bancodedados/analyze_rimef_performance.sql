-- ============================================================================
-- ANÁLISE DE PERFORMANCE DO SCHEMA RIMEF
-- Execute este script diretamente no banco de dados (pgAdmin, DBeaver, psql)
-- Database: basesales | Schema: rimef
-- ============================================================================

-- 1. TABELAS E SEUS TAMANHOS
-- ============================================================================
SELECT '=== TABELAS E TAMANHOS ===' as info;

SELECT 
    t.table_name as "Tabela",
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as "Tamanho Total",
    pg_size_pretty(pg_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as "Dados",
    pg_size_pretty(pg_indexes_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as "Indices"
FROM information_schema.tables t
WHERE t.table_schema = 'rimef'
AND t.table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) DESC;

-- 2. CONTAGEM DE REGISTROS POR TABELA
-- ============================================================================
SELECT '=== CONTAGEM DE REGISTROS ===' as info;

SELECT 
    schemaname || '.' || relname as "Tabela",
    n_live_tup as "Registros Estimados",
    n_dead_tup as "Registros Mortos (VACUUM)",
    last_vacuum as "Ultimo VACUUM",
    last_analyze as "Ultimo ANALYZE"
FROM pg_stat_user_tables
WHERE schemaname = 'rimef'
ORDER BY n_live_tup DESC;

-- 3. TODOS OS ÍNDICES EXISTENTES
-- ============================================================================
SELECT '=== INDICES EXISTENTES ===' as info;

SELECT 
    i.tablename as "Tabela",
    i.indexname as "Nome do Indice",
    pg_size_pretty(pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))) as "Tamanho",
    i.indexdef as "Definicao"
FROM pg_indexes i
WHERE i.schemaname = 'rimef'
ORDER BY i.tablename, i.indexname;

-- 4. USO DOS ÍNDICES (IMPORTANTE!)
-- ============================================================================
SELECT '=== USO DOS INDICES (idx_scan = 0 indica indice nao usado) ===' as info;

SELECT 
    schemaname || '.' || relname as "Tabela",
    indexrelname as "Indice",
    idx_scan as "Vezes Usado",
    idx_tup_read as "Tuplas Lidas",
    idx_tup_fetch as "Tuplas Buscadas",
    pg_size_pretty(pg_relation_size(indexrelid)) as "Tamanho"
FROM pg_stat_user_indexes
WHERE schemaname = 'rimef'
ORDER BY idx_scan DESC;

-- 5. TABELAS SEM NENHUM ÍNDICE (CRÍTICO!)
-- ============================================================================
SELECT '=== TABELAS SEM INDICES (PROBLEMA!) ===' as info;

SELECT t.table_name as "Tabela SEM Indice"
FROM information_schema.tables t
WHERE t.table_schema = 'rimef' 
AND t.table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i 
    WHERE i.schemaname = 'rimef' AND i.tablename = t.table_name
);

-- 6. TABELAS SEM PRIMARY KEY (CRÍTICO!)
-- ============================================================================
SELECT '=== TABELAS SEM PRIMARY KEY (PROBLEMA!) ===' as info;

SELECT t.table_name as "Tabela SEM Primary Key"
FROM information_schema.tables t
WHERE t.table_schema = 'rimef' 
AND t.table_type = 'BASE TABLE'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'rimef' 
    AND tc.table_name = t.table_name 
    AND tc.constraint_type = 'PRIMARY KEY'
);

-- 7. PRIMARY KEYS EXISTENTES
-- ============================================================================
SELECT '=== PRIMARY KEYS EXISTENTES ===' as info;

SELECT 
    tc.table_name as "Tabela",
    tc.constraint_name as "Nome da PK",
    kcu.column_name as "Coluna",
    c.data_type as "Tipo de Dados"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.columns c 
    ON c.table_name = tc.table_name 
    AND c.table_schema = tc.table_schema 
    AND c.column_name = kcu.column_name
WHERE tc.table_schema = 'rimef' 
AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- 8. SEQUENCES (GENERATORS) DO SCHEMA RIMEF
-- ============================================================================
SELECT '=== SEQUENCES/GENERATORS NO SCHEMA RIMEF ===' as info;

SELECT 
    s.sequence_schema as "Schema",
    s.sequence_name as "Sequence",
    s.start_value as "Inicio",
    s.increment as "Incremento",
    s.maximum_value as "Maximo"
FROM information_schema.sequences s
WHERE s.sequence_schema = 'rimef'
ORDER BY s.sequence_name;

-- 9. SEQUENCES NO PUBLIC (usadas pelo rimef?)
-- ============================================================================
SELECT '=== SEQUENCES NO SCHEMA PUBLIC (verificar se usadas) ===' as info;

SELECT 
    sequencename as "Sequence",
    last_value as "Ultimo Valor"
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- 10. ANÁLISE DE QUERIES LENTAS (se pg_stat_statements estiver habilitado)
-- ============================================================================
SELECT '=== ESTATISTICAS DE TABELAS (BLOAT/FRAGMENTACAO) ===' as info;

SELECT
    schemaname || '.' || relname as "Tabela",
    seq_scan as "Scans Sequenciais",
    seq_tup_read as "Tuplas Lidas (Seq)",
    idx_scan as "Scans por Indice",
    idx_tup_fetch as "Tuplas Buscadas (Idx)",
    CASE WHEN seq_scan > 0 
         THEN round((seq_tup_read::numeric / seq_scan), 2) 
         ELSE 0 END as "Media Tuplas/Seq Scan"
FROM pg_stat_user_tables
WHERE schemaname = 'rimef'
ORDER BY seq_scan DESC;

-- 11. INDICES DUPLICADOS OU REDUNDANTES
-- ============================================================================
SELECT '=== POSSIVEIS INDICES DUPLICADOS ===' as info;

SELECT 
    pg_size_pretty(sum(pg_relation_size(idx))::bigint) as "Tamanho Total",
    (array_agg(idx))[1] as "Indice 1",
    (array_agg(idx))[2] as "Indice 2 (duplicado?)"
FROM (
    SELECT 
        indexrelid::regclass as idx, 
        indrelid, 
        indkey
    FROM pg_index
    WHERE indrelid::regclass::text LIKE 'rimef.%'
) sub
GROUP BY indrelid, indkey
HAVING count(*) > 1;

-- 12. COLUNAS FREQUENTEMENTE USADAS EM WHERE (analisar para criar indices)
-- ============================================================================
SELECT '=== COLUNAS IMPORTANTES PARA INDEXAR ===' as info;

SELECT 
    c.table_name as "Tabela",
    c.column_name as "Coluna",
    c.data_type as "Tipo",
    CASE 
        WHEN c.column_name LIKE '%_codigo%' THEN 'CANDIDATA A PK/INDEX'
        WHEN c.column_name LIKE '%_id%' THEN 'CANDIDATA A PK/INDEX'
        WHEN c.column_name LIKE '%_industria%' THEN 'FK - INDEXAR'
        WHEN c.column_name LIKE '%_cliente%' THEN 'FK - INDEXAR'
        WHEN c.column_name LIKE '%_data%' THEN 'RANGE - INDEXAR'
        WHEN c.column_name LIKE '%_pedido%' THEN 'FK - INDEXAR'
        ELSE ''
    END as "Recomendacao"
FROM information_schema.columns c
WHERE c.table_schema = 'rimef'
AND (
    c.column_name LIKE '%_codigo%'
    OR c.column_name LIKE '%_id%'
    OR c.column_name LIKE '%_industria%'
    OR c.column_name LIKE '%_cliente%'
    OR c.column_name LIKE '%_data%'
    OR c.column_name LIKE '%_pedido%'
)
ORDER BY c.table_name, c.ordinal_position;

-- 13. FOREIGN KEYS
-- ============================================================================
SELECT '=== FOREIGN KEYS ===' as info;

SELECT 
    tc.table_name as "Tabela Origem",
    kcu.column_name as "Coluna",
    ccu.table_name as "Tabela Destino",
    ccu.column_name as "Coluna Destino"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'rimef' 
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- ============================================================================
-- FIM DA ANÁLISE
-- ============================================================================
SELECT '=== ANALISE CONCLUIDA ===' as info;
