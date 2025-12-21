-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 09: Product Code Normalization Function
-- ============================================================================
-- Este script cria:
-- 1. Função de normalização de códigos de produtos
-- 2. Trigger para auto-normalização
-- 3. Índice único para garantir integridade
-- ============================================================================

-- ============================================================================
-- Função: fn_normalizar_codigo
-- Descrição: Normaliza códigos de produtos removendo caracteres especiais,
--            convertendo para maiúsculas e removendo zeros à esquerda
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_normalizar_codigo(codigo VARCHAR(50))
RETURNS VARCHAR(50)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    resultado VARCHAR(50);
BEGIN
    -- Retorna NULL se o código for NULL ou vazio
    IF codigo IS NULL OR TRIM(codigo) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove caracteres especiais e converte para maiúsculas
    -- Mantém apenas letras (A-Z) e números (0-9)
    resultado := UPPER(REGEXP_REPLACE(codigo, '[^A-Z0-9]', '', 'g'));
    
    -- Remove zeros à esquerda
    resultado := REGEXP_REPLACE(resultado, '^0+', '');
    
    -- Se ficou vazio (era tudo zero ou caracteres especiais), retorna '0'
    IF resultado = '' THEN
        resultado := '0';
    END IF;
    
    RETURN resultado;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION fn_normalizar_codigo(VARCHAR) IS 
'Normaliza códigos de produtos: remove caracteres especiais, converte para maiúsculas e remove zeros à esquerda. Exemplos: "ABC-0001" → "ABC1", "XYZ 0123" → "XYZ123", "000" → "0"';

-- ============================================================================
-- Trigger Function: Normalização automática de códigos
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_normalizar_codigo_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-preenche o código normalizado ao inserir/atualizar
    IF NEW.pro_codprod IS NOT NULL THEN
        NEW.pro_codigonormalizado := fn_normalizar_codigo(NEW.pro_codprod);
    ELSE
        NEW.pro_codigonormalizado := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Comentário da função de trigger
COMMENT ON FUNCTION trg_normalizar_codigo_produto() IS 
'Trigger function que auto-normaliza o código do produto antes de inserir/atualizar';

-- ============================================================================
-- Trigger: Aplicar normalização automaticamente
-- ============================================================================
DROP TRIGGER IF EXISTS trg_cad_prod_normalizar ON cad_prod;

CREATE TRIGGER trg_cad_prod_normalizar
    BEFORE INSERT OR UPDATE OF pro_codprod
    ON cad_prod
    FOR EACH ROW
    EXECUTE FUNCTION trg_normalizar_codigo_produto();

-- ============================================================================
-- Índice Único: Garantir unicidade por indústria + código normalizado
-- ============================================================================
-- Remove índice se já existir
DROP INDEX IF EXISTS uk_prod_industria_normalizado;

-- Cria índice único composto
CREATE UNIQUE INDEX uk_prod_industria_normalizado 
    ON cad_prod(pro_industria, pro_codigonormalizado)
    WHERE pro_codigonormalizado IS NOT NULL;

-- Comentário do índice
COMMENT ON INDEX uk_prod_industria_normalizado IS 
'Garante que não existam produtos duplicados por indústria com o mesmo código normalizado';

-- ============================================================================
-- Atualizar códigos normalizados existentes (se a tabela já tiver dados)
-- ============================================================================
-- ATENÇÃO: Execute este UPDATE apenas uma vez, após criar a função
-- Se a tabela cad_prod já tiver dados, este comando irá normalizar todos os códigos existentes

UPDATE cad_prod 
SET pro_codigonormalizado = fn_normalizar_codigo(pro_codprod)
WHERE pro_codprod IS NOT NULL 
  AND (pro_codigonormalizado IS NULL 
       OR pro_codigonormalizado != fn_normalizar_codigo(pro_codprod));

-- ============================================================================
-- Testes de Validação
-- ============================================================================
-- Descomente as linhas abaixo para testar a função

/*
SELECT 
    'ABC-0001' as original,
    fn_normalizar_codigo('ABC-0001') as normalizado,
    'ABC1' as esperado
UNION ALL
SELECT 
    'XYZ 0123',
    fn_normalizar_codigo('XYZ 0123'),
    'XYZ123'
UNION ALL
SELECT 
    '000',
    fn_normalizar_codigo('000'),
    '0'
UNION ALL
SELECT 
    'PRD.001/23',
    fn_normalizar_codigo('PRD.001/23'),
    'PRD123'
UNION ALL
SELECT 
    'abc-0001',
    fn_normalizar_codigo('abc-0001'),
    'ABC1'
UNION ALL
SELECT 
    '0000ABC',
    fn_normalizar_codigo('0000ABC'),
    'ABC'
UNION ALL
SELECT 
    'A-B-C|1.2.3',
    fn_normalizar_codigo('A-B-C|1.2.3'),
    'ABC123';
*/

-- ============================================================================
-- Fim do Script
-- ============================================================================
