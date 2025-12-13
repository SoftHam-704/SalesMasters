-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script: Update FORNECEDORES table - Add missing field
-- ============================================================================

-- Adicionar campo FOR_OBS2 (Política Comercial) na tabela FORNECEDORES
ALTER TABLE fornecedores 
    ADD COLUMN IF NOT EXISTS for_obs2 TEXT;

COMMENT ON COLUMN fornecedores.for_obs2 IS 'Política comercial (campo BLOB)';

-- Adicionar campo FOR_TIPO2 (Status: A=Ativo, I=Inativo)
ALTER TABLE fornecedores 
    ADD COLUMN IF NOT EXISTS for_tipo2 CHAR(1) DEFAULT 'A';

COMMENT ON COLUMN fornecedores.for_tipo2 IS 'Tipo/Status: A=Ativo, I=Inativo';

-- Criar índice para filtro de fornecedores ativos
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo2 ON fornecedores(for_tipo2);
