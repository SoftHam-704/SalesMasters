-- Correção da função fn_upsert_preco para usar itab_idindustria e itab_prepeso
-- Atualizado para incluir o campo itab_prepeso (preço por peso/quantidade)

-- Remover função antiga (caso exista com 12 parâmetros)
DROP FUNCTION IF EXISTS fn_upsert_preco(INTEGER, INTEGER, VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, DOUBLE PRECISION, DATE, DATE);

-- Criar função corrigida (com 13 parâmetros, adicionando p_prepeso)
CREATE OR REPLACE FUNCTION fn_upsert_preco(
    p_pro_id INTEGER,
    p_industria INTEGER,
    p_tabela VARCHAR(20),
    p_precobruto DOUBLE PRECISION,
    p_precopromo DOUBLE PRECISION DEFAULT NULL,
    p_precoespecial DOUBLE PRECISION DEFAULT NULL,
    p_ipi DOUBLE PRECISION DEFAULT 0,
    p_st DOUBLE PRECISION DEFAULT 0,
    p_grupodesconto INTEGER DEFAULT NULL,
    p_descontoadd DOUBLE PRECISION DEFAULT 0,
    p_datatbela DATE DEFAULT CURRENT_DATE,
    p_datavencimento DATE DEFAULT NULL,
    p_prepeso DOUBLE PRECISION DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- UPSERT: insere ou atualiza
    INSERT INTO cad_tabelaspre (
        itab_idprod,
        itab_idindustria,
        itab_tabela,
        itab_precobruto,
        itab_precopromo,
        itab_precoespecial,
        itab_ipi,
        itab_st,
        itab_grupodesconto,
        itab_descontoadd,
        itab_datatabela,
        itab_datavencimento,
        itab_prepeso,
        itab_status
    ) VALUES (
        p_pro_id,
        p_industria,
        p_tabela,
        p_precobruto,
        p_precopromo,
        p_precoespecial,
        p_ipi,
        p_st,
        p_grupodesconto,
        p_descontoadd,
        p_datatbela,
        p_datavencimento,
        p_prepeso,
        true
    )
    ON CONFLICT (itab_idprod, itab_tabela) 
    DO UPDATE SET
        itab_precobruto = COALESCE(NULLIF(EXCLUDED.itab_precobruto, 0), cad_tabelaspre.itab_precobruto),
        itab_precopromo = COALESCE(NULLIF(EXCLUDED.itab_precopromo, 0), cad_tabelaspre.itab_precopromo),
        itab_precoespecial = COALESCE(NULLIF(EXCLUDED.itab_precoespecial, 0), cad_tabelaspre.itab_precoespecial),
        itab_ipi = COALESCE(NULLIF(EXCLUDED.itab_ipi, 0), cad_tabelaspre.itab_ipi),
        itab_st = COALESCE(NULLIF(EXCLUDED.itab_st, 0), cad_tabelaspre.itab_st),
        itab_grupodesconto = COALESCE(EXCLUDED.itab_grupodesconto, cad_tabelaspre.itab_grupodesconto),
        itab_descontoadd = COALESCE(NULLIF(EXCLUDED.itab_descontoadd, 0), cad_tabelaspre.itab_descontoadd),
        itab_datatabela = COALESCE(EXCLUDED.itab_datatabela, cad_tabelaspre.itab_datatabela),
        itab_datavencimento = COALESCE(EXCLUDED.itab_datavencimento, cad_tabelaspre.itab_datavencimento),
        itab_prepeso = COALESCE(NULLIF(EXCLUDED.itab_prepeso, 0), cad_tabelaspre.itab_prepeso),
        itab_status = EXCLUDED.itab_status;
END;
$$;
