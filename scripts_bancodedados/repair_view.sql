-- Script de Reparo da View vw_produtos_precos
-- Corrige nomes de colunas que podem estar obsoletos em algumas instalações

CREATE OR REPLACE VIEW vw_produtos_precos AS
SELECT 
    p.pro_id,
    p.pro_industria,
    f.for_nomered as industria_nome,
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
    -- Tenta usar os dois nomes possíveis para as colunas de data
    COALESCE(t.itab_datatabela, t.itab_datatbela) as itab_datatabela,
    t.itab_datavencimento,
    t.itab_status,
    -- Preço final sugerido (bruto + IPI)
    ROUND(CAST(t.itab_precobruto * (1 + t.itab_ipi / 100) AS numeric), 2) as preco_com_ipi
FROM cad_prod p
INNER JOIN fornecedores f ON f.for_codigo = p.pro_industria
LEFT JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
WHERE p.pro_status = true;

COMMENT ON VIEW vw_produtos_precos IS 'View consolidada de produtos com seus preços em todas as tabelas (Versão Corrigida)';
