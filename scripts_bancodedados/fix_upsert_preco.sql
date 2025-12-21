-- Correção da função fn_upsert_preco para usar itab_idindustria

-- Remover função antiga
DROP FUNCTION IF EXISTS fn_upsert_preco(INTEGER, INTEGER, VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, DOUBLE PRECISION, DATE, DATE);

-- Criar função corrigida
CREATE FUNCTION fn_upsert_preco(
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
    p_datavencimento DATE DEFAULT NULL
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
        true
    )
    ON CONFLICT (itab_idprod, itab_tabela) 
    DO UPDATE SET
        itab_precobruto = EXCLUDED.itab_precobruto,
        itab_precopromo = EXCLUDED.itab_precopromo,
        itab_precoespecial = EXCLUDED.itab_precoespecial,
        itab_ipi = EXCLUDED.itab_ipi,
        itab_st = EXCLUDED.itab_st,
        itab_grupodesconto = EXCLUDED.itab_grupodesconto,
        itab_descontoadd = EXCLUDED.itab_descontoadd,
        itab_datatabela = EXCLUDED.itab_datatabela,
        itab_datavencimento = EXCLUDED.itab_datavencimento,
        itab_status = EXCLUDED.itab_status;
END;
$$;
