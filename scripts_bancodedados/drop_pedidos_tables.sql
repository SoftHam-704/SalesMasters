-- ============================================================================
-- SalesMasters - PostgreSQL Migration  
-- Script: Drop PEDIDOS and ITENS_PED Tables
-- Purpose: Remove order-related tables and all dependencies
-- ============================================================================

-- IMPORTANT: This script will permanently delete the following:
-- 1. Table: itens_ped (order items)
-- 2. Table: pedidos (orders)
-- 3. Sequence: gen_pedidos_id
-- 4. Sequence: gen_itens_ped_id
-- 5. All associated indexes and foreign keys

-- ============================================================================
-- Step 1: Drop ITENS_PED table (child table first)
-- ============================================================================
-- This will automatically drop:
-- - Foreign key: fk_itens_ped_pedido
-- - Foreign key: fk_itens_ped_industria
-- - Index: idx_itens_ped_pedido
-- - Index: idx_itens_ped_produto
-- - Index: idx_itens_ped_industria
-- - Primary key constraint on ite_lancto

DROP TABLE IF EXISTS itens_ped CASCADE;

-- ============================================================================
-- Step 2: Drop PEDIDOS table (parent table)
-- ============================================================================
-- This will automatically drop:
-- - Foreign key: fk_pedidos_cliente
-- - Foreign key: fk_pedidos_industria
-- - Foreign key: fk_pedidos_vendedor
-- - Index: idx_pedidos_data
-- - Index: idx_pedidos_cliente
-- - Index: idx_pedidos_industria
-- - Index: idx_pedidos_vendedor
-- - Index: idx_pedidos_situacao
-- - Index: idx_pedidos_numero
-- - Primary key constraint on ped_pedido

DROP TABLE IF EXISTS pedidos CASCADE;

-- ============================================================================
-- Step 3: Drop sequences
-- ============================================================================

DROP SEQUENCE IF EXISTS gen_pedidos_id CASCADE;
DROP SEQUENCE IF EXISTS gen_itens_ped_id CASCADE;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to confirm the tables have been removed:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('pedidos', 'itens_ped');

-- ============================================================================
-- Completion Message
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tables PEDIDOS and ITENS_PED have been successfully removed!';
    RAISE NOTICE '✅ All associated indexes, foreign keys, and sequences have been dropped.';
END $$;
