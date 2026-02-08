-- ========================================
-- SCRIPT: Adicionar controle de acesso iOS por empresa
-- Data: 2026-01-23
-- Descrição: Permite liberar/bloquear acesso via iOS (iPhone/iPad) por empresa
-- ========================================

-- 1. Adicionar coluna na tabela de empresas (Master DB)
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS ios_enabled CHAR(1) DEFAULT 'N';

-- 2. Comentário explicativo
COMMENT ON COLUMN empresas.ios_enabled IS 'S = iOS liberado, N = iOS bloqueado (padrão). Controla acesso via iPhone/iPad ao app mobile.';

-- 3. Liberar a SoftHam por padrão (para testes)
UPDATE empresas SET ios_enabled = 'S' WHERE cnpj LIKE '%17504829000124%';

-- Verificar resultado
SELECT id, cnpj, razao_social, ios_enabled FROM empresas;
