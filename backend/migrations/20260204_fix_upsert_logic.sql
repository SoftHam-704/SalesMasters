-- ============================================================================
-- SalesMasters - Refinamento de Lógica UPSERT (Preservação de Dados)
-- ============================================================================
-- Se o campo vier nulo ou zerado na importação, mantém o valor existente.
-- ============================================================================

-- 1. Refinar fn_upsert_produto
CREATE OR REPLACE FUNCTION fn_upsert_produto(
    p_industria INTEGER,
    p_codprod VARCHAR(25),
    p_nome VARCHAR(100),
    p_peso DOUBLE PRECISION DEFAULT NULL,
    p_embalagem INTEGER DEFAULT NULL,
    p_grupo INTEGER DEFAULT NULL,
    p_setor VARCHAR(30) DEFAULT NULL,
    p_linha VARCHAR(50) DEFAULT NULL,
    p_ncm VARCHAR(10) DEFAULT NULL,
    p_origem CHAR(1) DEFAULT NULL,
    p_aplicacao VARCHAR(300) DEFAULT NULL,
    p_codbarras VARCHAR(13) DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_pro_id INTEGER;
    v_codigo_normalizado VARCHAR(50);
BEGIN
    v_codigo_normalizado := fn_normalizar_codigo(p_codprod);
    
    UPDATE cad_prod SET
        pro_nome = COALESCE(NULLIF(p_nome, ''), pro_nome),
        pro_peso = COALESCE(NULLIF(p_peso, 0), pro_peso),
        pro_embalagem = COALESCE(NULLIF(p_embalagem, 0), pro_embalagem),
        pro_grupo = COALESCE(NULLIF(p_grupo, 0), pro_grupo),
        pro_setor = COALESCE(NULLIF(p_setor, ''), pro_setor),
        pro_linha = COALESCE(NULLIF(p_linha, ''), pro_linha),
        pro_ncm = COALESCE(NULLIF(p_ncm, ''), pro_ncm),
        pro_origem = COALESCE(NULLIF(p_origem, ''), pro_origem),
        pro_aplicacao = COALESCE(NULLIF(p_aplicacao, ''), pro_aplicacao),
        pro_codbarras = COALESCE(NULLIF(p_codbarras, ''), pro_codbarras),
        pro_codprod = p_codprod
    WHERE pro_industria = p_industria 
      AND pro_codigonormalizado = v_codigo_normalizado
    RETURNING pro_id INTO v_pro_id;
    
    IF v_pro_id IS NULL THEN
        SELECT pro_id INTO v_pro_id FROM cad_prod 
        WHERE pro_industria = p_industria AND pro_codprod = p_codprod LIMIT 1;

        IF v_pro_id IS NOT NULL THEN
            UPDATE cad_prod SET pro_codigonormalizado = v_codigo_normalizado WHERE pro_id = v_pro_id;
        ELSE
            INSERT INTO cad_prod (
                pro_industria, pro_codprod, pro_codigonormalizado, pro_codigooriginal,
                pro_nome, pro_peso, pro_embalagem, pro_grupo, pro_setor,
                pro_linha, pro_ncm, pro_origem, pro_aplicacao, pro_codbarras, pro_status
            ) VALUES (
                p_industria, p_codprod, v_codigo_normalizado, p_codprod,
                p_nome, COALESCE(p_peso, 0), COALESCE(p_embalagem, 1), p_grupo, p_setor,
                p_linha, p_ncm, p_origem, p_aplicacao, p_codbarras, true
            )
            RETURNING pro_id INTO v_pro_id;
        END IF;
    END IF;
    
    RETURN v_pro_id;
END;
$$;

-- 2. Refinar fn_upsert_preco
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
