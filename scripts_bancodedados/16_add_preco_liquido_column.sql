-- ============================================================================
-- Update fn_listar_produtos_tabela to include calculated net price
-- ============================================================================
-- This script adds a calculated "preco_liquido" column that applies
-- discount group percentages in cascade when itab_grupodesconto > 0
-- ============================================================================

-- Drop existing function first (required to change return type)
DROP FUNCTION IF EXISTS fn_listar_produtos_tabela(INTEGER, VARCHAR);

CREATE FUNCTION fn_listar_produtos_tabela(
    p_industria INTEGER,
    p_tabela VARCHAR(20)
)
RETURNS TABLE (
    itab_idprod INTEGER,
    itab_idindustria INTEGER,
    itab_tabela VARCHAR(20),
    pro_codprod VARCHAR(25),
    pro_nome VARCHAR(100),
    itab_grupodesconto INTEGER,
    itab_descontoadd DOUBLE PRECISION,
    itab_ipi DOUBLE PRECISION,
    itab_st DOUBLE PRECISION,
    itab_prepeso DOUBLE PRECISION,
    itab_precobruto DOUBLE PRECISION,
    itab_precopromo DOUBLE PRECISION,
    itab_precoespecial DOUBLE PRECISION,
    preco_liquido DOUBLE PRECISION,  -- NOVA COLUNA CALCULADA
    itab_datatabela DATE,
    itab_datavencimento DATE,
    itab_status BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.itab_idprod,
        ct.itab_idindustria,
        ct.itab_tabela,
        cp.pro_codprod,
        cp.pro_nome,
        ct.itab_grupodesconto,
        ct.itab_descontoadd,
        ct.itab_ipi,
        ct.itab_st,
        ct.itab_prepeso,
        ct.itab_precobruto,
        ct.itab_precopromo,
        ct.itab_precoespecial,
        -- Cálculo do preço líquido com descontos em cascata
        CASE 
            WHEN ct.itab_grupodesconto > 0 AND gd.gde_id IS NOT NULL THEN
                -- Aplica os 9 descontos em cascata sobre o preço bruto
                CAST(
                    ROUND(
                        CAST(
                            ct.itab_precobruto *
                            (1 - COALESCE(gd.gde_desc1, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc2, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc3, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc4, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc5, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc6, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc7, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc8, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc9, 0) / 100)
                        AS NUMERIC), 2)
                AS DOUBLE PRECISION)
            ELSE
                NULL  -- Retorna NULL se não houver grupo de desconto
        END AS preco_liquido,
        ct.itab_datatabela,
        ct.itab_datavencimento,
        ct.itab_status
    FROM cad_tabelaspre ct
    LEFT JOIN cad_prod cp ON ct.itab_idprod = cp.pro_id
    LEFT JOIN grupo_desc gd ON ct.itab_grupodesconto = gd.gde_id
    WHERE ct.itab_idindustria = p_industria 
      AND ct.itab_tabela = p_tabela
    ORDER BY cp.pro_codprod;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_listar_produtos_tabela(INTEGER, VARCHAR) IS 
'Lista todos os produtos com seus preços de uma tabela específica de uma indústria. 
Inclui cálculo de preço líquido aplicando descontos do grupo em cascata (gde_desc1 a gde_desc9).';

-- ============================================================================
-- Exemplo de uso:
-- SELECT * FROM fn_listar_produtos_tabela(1, 'PADRAO');
-- ============================================================================
