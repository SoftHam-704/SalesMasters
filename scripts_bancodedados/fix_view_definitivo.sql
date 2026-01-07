-- ============================================================================
-- FIX DEFINITIVO: View vw_produtos_precos
-- ============================================================================
-- Este script conserta a view para funcionar em LOCAL e CLOUD

-- 1. Ativar produtos com status NULL
UPDATE cad_prod 
SET pro_status = true 
WHERE pro_status IS NULL;

-- 2. Recriar view SEM filtro de pro_status
DROP VIEW IF EXISTS vw_produtos_precos CASCADE;

CREATE OR REPLACE VIEW vw_produtos_precos AS
SELECT 
    p.pro_id,
    p.pro_industria,
    COALESCE(f.for_nomered, 'Indústria ' || p.pro_industria) as industria_nome,
    p.pro_codprod,
    p.pro_codigonormalizado,
    p.pro_nome,
    p.pro_grupo,
    p.pro_ncm,
    t.itab_tabela,
    t.itab_precobruto,
    t.itab_precopromo,
    t.itab_precoespecial,
    t.itab_ipi,
    t.itab_st,
    t.itab_grupodesconto,
    t.itab_datatabela,
    t.itab_datavencimento,
    t.itab_status,
    ROUND(CAST(t.itab_precobruto * (1 + COALESCE(t.itab_ipi, 0) / 100) AS numeric), 2) as preco_com_ipi
FROM cad_tabelaspre t
INNER JOIN cad_prod p ON p.pro_id = t.itab_idprod
LEFT JOIN fornecedores f ON f.for_codigo = p.pro_industria;

COMMENT ON VIEW vw_produtos_precos IS 'View consolidada de produtos com preços - Versão corrigida sem filtro de status';

-- 3. Testar
SELECT 
    pro_industria,
    itab_tabela,
    COUNT(*) as total_produtos
FROM vw_produtos_precos
GROUP BY pro_industria, itab_tabela
ORDER BY pro_industria, itab_tabela;
