-- ============================================================================
-- ANÁLISE SIMPLIFICADA - PROBLEMAS CRÍTICOS NO SCHEMA RIMEF
-- Execute este script para ver os principais problemas de performance
-- ============================================================================

-- 1. RESUMO DAS TABELAS (Tamanho e Contagem)
SELECT 
    'RESUMO_TABELAS' as tipo,
    t.table_name as tabela,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as tamanho_total,
    (SELECT n_live_tup FROM pg_stat_user_tables s WHERE s.schemaname = 'rimef' AND s.relname = t.table_name) as registros_estimados,
    (SELECT COUNT(*) FROM pg_indexes i WHERE i.schemaname = 'rimef' AND i.tablename = t.table_name) as qtd_indices,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc 
        WHERE tc.table_schema = 'rimef' AND tc.table_name = t.table_name AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN 'SIM' ELSE 'NAO' END as tem_pk
FROM information_schema.tables t
WHERE t.table_schema = 'rimef' AND t.table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) DESC;

-- 2. TABELAS COM PROBLEMAS (Sem índice OU sem PK)
SELECT 
    'PROBLEMA_CRITICO' as tipo,
    t.table_name as tabela,
    CASE WHEN NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname = 'rimef' AND i.tablename = t.table_name) 
         THEN 'SEM INDICES' ELSE 'OK' END as status_indices,
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc 
        WHERE tc.table_schema = 'rimef' AND tc.table_name = t.table_name AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN 'SEM PRIMARY KEY' ELSE 'OK' END as status_pk
FROM information_schema.tables t
WHERE t.table_schema = 'rimef' AND t.table_type = 'BASE TABLE'
AND (
    NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname = 'rimef' AND i.tablename = t.table_name)
    OR NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc 
        WHERE tc.table_schema = 'rimef' AND tc.table_name = t.table_name AND tc.constraint_type = 'PRIMARY KEY'
    )
)
ORDER BY t.table_name;

-- 3. INDICES EXISTENTES POR TABELA (Resumo)
SELECT 
    'INDICES' as tipo,
    i.tablename as tabela,
    i.indexname as indice,
    pg_size_pretty(pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))) as tamanho
FROM pg_indexes i
WHERE i.schemaname = 'rimef'
ORDER BY i.tablename, i.indexname;

-- 4. ESTATISTICAS DE USO (Tabelas com muitos scans sequenciais = problema)
SELECT 
    'ESTATISTICAS' as tipo,
    relname as tabela,
    seq_scan as scans_sequenciais,
    idx_scan as scans_por_indice,
    CASE WHEN seq_scan > 0 AND (idx_scan IS NULL OR idx_scan = 0) 
         THEN 'PROBLEMA: So usa scan sequencial!' 
         WHEN seq_scan > COALESCE(idx_scan, 0) * 10
         THEN 'ATENCAO: Muitos scans sequenciais'
         ELSE 'OK' 
    END as diagnostico
FROM pg_stat_user_tables
WHERE schemaname = 'rimef'
ORDER BY seq_scan DESC;
