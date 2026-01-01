-- ============================================
-- SCRIPT DE LIMPEZA COMPLETA DO BANCO DE DADOS
-- ⚠️ ATENÇÃO: ESTE SCRIPT APAGA TODOS OS DADOS!
-- ============================================
-- Data: 2025-12-29
-- Descrição: Trunca todas as tabelas e reseta sequences
-- ============================================

-- Desabilitar triggers temporariamente para evitar erros de FK
SET session_replication_role = 'replica';

-- ============================================
-- 1. TABELAS DE PEDIDOS
-- ============================================
TRUNCATE TABLE itens_ped RESTART IDENTITY CASCADE;
TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE;

-- ============================================
-- 2. TABELAS DE PRODUTOS E PREÇOS
-- ============================================
TRUNCATE TABLE itenspreco RESTART IDENTITY CASCADE;
TRUNCATE TABLE produtos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tabelaspreco RESTART IDENTITY CASCADE;

-- ============================================
-- 3. TABELAS DE CLIENTES
-- ============================================
TRUNCATE TABLE cli_ind RESTART IDENTITY CASCADE;
TRUNCATE TABLE cli_aniv RESTART IDENTITY CASCADE;
TRUNCATE TABLE compradores RESTART IDENTITY CASCADE;
TRUNCATE TABLE clientes RESTART IDENTITY CASCADE;

-- ============================================
-- 4. TABELAS AUXILIARES
-- ============================================
TRUNCATE TABLE industriasgrupos RESTART IDENTITY CASCADE;
TRUNCATE TABLE transportadoras RESTART IDENTITY CASCADE;
TRUNCATE TABLE vendedores RESTART IDENTITY CASCADE;
TRUNCATE TABLE condicoes_pagamento RESTART IDENTITY CASCADE;

-- ============================================
-- 5. TABELAS DE SISTEMA
-- ============================================
TRUNCATE TABLE fornecedores RESTART IDENTITY CASCADE;
TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE;

-- ============================================
-- 6. TABELAS CRM (se existirem)
-- ============================================
TRUNCATE TABLE crm_interactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE crm_interaction_types RESTART IDENTITY CASCADE;
TRUNCATE TABLE crm_channels RESTART IDENTITY CASCADE;
TRUNCATE TABLE crm_results RESTART IDENTITY CASCADE;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- MENSAGEM FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Todas as tabelas foram limpas com sucesso!';
    RAISE NOTICE '🔄 Todos os sequences foram resetados para 1';
    RAISE NOTICE '⚠️  O banco está completamente vazio e pronto para importação';
END $$;
