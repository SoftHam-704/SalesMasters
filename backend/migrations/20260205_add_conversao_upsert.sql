-- ============================================================================
-- SalesMasters - Atualização fn_upsert_produto (Adição de pro_conversao)
-- ============================================================================

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
    p_codbarras VARCHAR(13) DEFAULT NULL,
    p_conversao VARCHAR(255) DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_pro_id INTEGER;
    v_codigo_normalizado VARCHAR(50);
BEGIN
    -- Normaliza o código
    v_codigo_normalizado := fn_normalizar_codigo(p_codprod);

    -- Tenta atualizar primeiro
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
        pro_conversao = COALESCE(NULLIF(p_conversao, ''), pro_conversao),
        pro_codprod = p_codprod
    WHERE pro_industria = p_industria 
      AND pro_codigonormalizado = v_codigo_normalizado
    RETURNING pro_id INTO v_pro_id;
    
    -- Se não encontrou para atualizar, insere novo
    IF v_pro_id IS NULL THEN
        -- Backup check por código exato (prevenção)
        SELECT pro_id INTO v_pro_id FROM cad_prod 
        WHERE pro_industria = p_industria AND pro_codprod = p_codprod LIMIT 1;

        IF v_pro_id IS NOT NULL THEN
            UPDATE cad_prod SET 
                pro_codigonormalizado = v_codigo_normalizado,
                pro_conversao = COALESCE(NULLIF(p_conversao, ''), pro_conversao)
            WHERE pro_id = v_pro_id;
        ELSE
            -- Insere realmente novo
            INSERT INTO cad_prod (
                pro_industria, pro_codprod, pro_codigonormalizado, pro_codigooriginal,
                pro_nome, pro_peso, pro_embalagem, pro_grupo, pro_setor,
                pro_linha, pro_ncm, pro_origem, pro_aplicacao, pro_codbarras, 
                pro_conversao, pro_status
            ) VALUES (
                p_industria, p_codprod, v_codigo_normalizado, p_codprod,
                p_nome, COALESCE(p_peso, 0), COALESCE(p_embalagem, 1), p_grupo, p_setor,
                p_linha, p_ncm, p_origem, p_aplicacao, p_codbarras, 
                p_conversao, true
            )
            RETURNING pro_id INTO v_pro_id;
        END IF;
    END IF;
    
    RETURN v_pro_id;
EXCEPTION WHEN unique_violation THEN
    -- Fallback para concorrência
    SELECT pro_id INTO v_pro_id FROM cad_prod 
    WHERE pro_industria = p_industria AND pro_codigonormalizado = v_codigo_normalizado;
    RETURN v_pro_id;
END;
$$;
