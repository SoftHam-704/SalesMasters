-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- MASTER SCRIPT - Execute All in Order
-- ============================================================================

\echo '============================================================================'
\echo 'SalesMasters - PostgreSQL Migration'
\echo 'Database: basesales'
\echo '============================================================================'
\echo ''

-- Conectar ao database basesales
\c basesales

\echo ''
\echo '============================================================================'
\echo 'Step 1/6: Creating Sequences...'
\echo '============================================================================'
\i 02_create_sequences.sql

\echo ''
\echo '============================================================================'
\echo 'Step 2/6: Creating Core Tables - Part 1 (VENDEDORES, FORNECEDORES, CLIENTES)...'
\echo '============================================================================'
\i 03_create_core_tables_part1.sql

\echo ''
\echo '============================================================================'
\echo 'Step 3/6: Creating Core Tables - Part 2 (CAD_PROD, PEDIDOS, ITENS_PED)...'
\echo '============================================================================'
\i 04_create_core_tables_part2.sql

\echo ''
\echo '============================================================================'
\echo 'Step 4/6: Creating Supporting Tables - Part 1...'
\echo '============================================================================'
\i 05_create_supporting_tables_part1.sql

\echo ''
\echo '============================================================================'
\echo 'Step 5/6: Creating Supporting Tables - Part 2...'
\echo '============================================================================'
-- \i 06_create_supporting_tables_part2.sql

\echo ''
\echo '============================================================================'
\echo 'Step 6/6: Creating Additional Tables...'
\echo '============================================================================'
-- \i 07_create_additional_tables.sql

\echo ''
\echo '============================================================================'
\echo 'Verification: Listing all tables created...'
\echo '============================================================================'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

\echo ''
\echo '============================================================================'
\echo 'Database Size:'
\echo '============================================================================'
SELECT pg_size_pretty(pg_database_size('basesales')) as database_size;

\echo ''
\echo '============================================================================'
\echo 'Migration Complete!'
\echo '============================================================================'
\echo ''
\echo 'Next steps:'
\echo '1. Review the created tables'
\echo '2. Convert and create stored procedures'
\echo '3. Convert and create triggers'
\echo '4. Migrate data from Firebird'
\echo ''
