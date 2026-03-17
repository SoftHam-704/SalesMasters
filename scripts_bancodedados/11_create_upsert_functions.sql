-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 11: UPSERT Functions for Existing Tables
-- ============================================================================
-- Este script cria APENAS as funções de UPSERT para as tabelas EXISTENTES:
-- - cad_prod (já existe)
-- - cad_tabelaspre (já existe)
-- ============================================================================

-- ============================================================================
-- Função: UPSERT de Produto (Dados Fixos)
-- ============================================================================
-- Esta função insere ou atualiza APENAS os dados fixos do produto
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
    p_conversao VARCHAR(50) DEFAULT NULL,
    p_linhaleve BOOLEAN DEFAULT FALSE,
    p_linhapesada BOOLEAN DEFAULT FALSE,
    p_linhaagricola BOOLEAN DEFAULT FALSE,
    p_linhautilitarios BOOLEAN DEFAULT FALSE,
    p_motocicletas BOOLEAN DEFAULT FALSE,
    p_offroad BOOLEAN DEFAULT FALSE
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
        pro_linhaleve = p_linhaleve,
        pro_linhapesada = p_linhapesada,
        pro_linhaagricola = p_linhaagricola,
        pro_linhautilitarios = p_linhautilitarios,
        pro_motocicletas = p_motocicletas,
        pro_offroad = p_offroad,
        pro_codprod = p_codprod
    WHERE pro_industria = p_industria 
      AND pro_codigonormalizado = v_codigo_normalizado
    RETURNING pro_id INTO v_pro_id;
    
    -- Se não encontrou para atualizar, insere novo
    IF v_pro_id IS NULL THEN
        SELECT pro_id INTO v_pro_id FROM cad_prod 
        WHERE pro_industria = p_industria AND pro_codprod = p_codprod LIMIT 1;

        IF v_pro_id IS NOT NULL THEN
            UPDATE cad_prod SET 
                pro_codigonormalizado = v_codigo_normalizado,
                pro_linhaleve = p_linhaleve,
                pro_linhapesada = p_linhapesada,
                pro_linhaagricola = p_linhaagricola,
                pro_linhautilitarios = p_linhautilitarios,
                pro_motocicletas = p_motocicletas,
                pro_offroad = p_offroad
            WHERE pro_id = v_pro_id;
        ELSE
            INSERT INTO cad_prod (
                pro_industria, pro_codprod, pro_codigonormalizado, pro_codigooriginal,
                pro_nome, pro_peso, pro_embalagem, pro_grupo, pro_setor,
                pro_linha, pro_ncm, pro_origem, pro_aplicacao, pro_codbarras, pro_conversao, 
                pro_linhaleve, pro_linhapesada, pro_linhaagricola, pro_linhautilitarios,
                pro_motocicletas, pro_offroad, pro_status
            ) VALUES (
                p_industria, p_codprod, v_codigo_normalizado, p_codprod,
                p_nome, p_peso, p_embalagem, p_grupo, p_setor,
                p_linha, p_ncm, p_origem, p_aplicacao, p_codbarras, p_conversao,
                p_linhaleve, p_linhapesada, p_linhaagricola, p_linhautilitarios,
                p_motocicletas, p_offroad, true
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

COMMENT ON FUNCTION fn_upsert_produto IS 
'Insere ou atualiza produto em cad_prod. Retorna o pro_id. Atualiza apenas dados fixos do produto.';

-- ============================================================================
-- Função: UPSERT de Preço (Dados Variáveis)
-- ============================================================================
-- Esta função insere ou atualiza os dados de preço em uma tabela específica
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
    p_datatabela DATE DEFAULT CURRENT_DATE,
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
        p_datatabela,
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

COMMENT ON FUNCTION fn_upsert_preco IS 
'Insere ou atualiza preço de produto em uma tabela específica. Se já existe, atualiza todos os campos de preço.';

-- ============================================================================
-- Função: Buscar Preço de Produto
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_buscar_preco(
    p_industria INTEGER,
    p_codigo_produto VARCHAR(50),
    p_tabela VARCHAR(20) DEFAULT 'PADRAO'
)
RETURNS TABLE (
    pro_id INTEGER,
    pro_nome VARCHAR(100),
    pro_codprod VARCHAR(25),
    tabela VARCHAR(20),
    preco_bruto DOUBLE PRECISION,
    preco_promo DOUBLE PRECISION,
    preco_especial DOUBLE PRECISION,
    ipi DOUBLE PRECISION,
    st DOUBLE PRECISION,
    grupo_desconto INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo_normalizado VARCHAR(50);
BEGIN
    v_codigo_normalizado := fn_normalizar_codigo(p_codigo_produto);
    
    RETURN QUERY
    SELECT 
        p.pro_id,
        p.pro_nome,
        p.pro_codprod,
        t.itab_tabela,
        t.itab_precobruto,
        t.itab_precopromo,
        t.itab_precoespecial,
        t.itab_ipi,
        t.itab_st,
        t.itab_grupodesconto
    FROM cad_prod p
    INNER JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
    WHERE p.pro_industria = p_industria
      AND p.pro_codigonormalizado = v_codigo_normalizado
      AND t.itab_tabela = p_tabela
      AND t.itab_status = true;
END;
$$;

COMMENT ON FUNCTION fn_buscar_preco IS 
'Busca o preço de um produto em uma tabela específica. Retorna NULL se não encontrado.';

-- ============================================================================
-- View: Produtos com Preços (útil para consultas)
-- ============================================================================
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
    t.itab_datatabela,
    t.itab_datavencimento,
    t.itab_status,
    -- Preço final sugerido (bruto + IPI)
    ROUND(CAST(t.itab_precobruto * (1 + t.itab_ipi / 100) AS numeric), 2) as preco_com_ipi
FROM cad_prod p
INNER JOIN fornecedores f ON f.for_codigo = p.pro_industria
LEFT JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
WHERE p.pro_status = true;

COMMENT ON VIEW vw_produtos_precos IS 
'View consolidada de produtos com seus preços em todas as tabelas';

-- ============================================================================
-- Testes de Validação
-- ============================================================================
/*
-- Teste 1: Inserir produto novo
SELECT fn_upsert_produto(1, 'ABC-0001', 'Produto Teste', 1.5, 12, 1);

-- Teste 2: Atualizar produto existente (mesmo código normalizado)
SELECT fn_upsert_produto(1, 'ABC 0001', 'Produto Teste Atualizado', 1.8, 12, 1);

-- Teste 3: Inserir preço
SELECT fn_upsert_preco(
    (SELECT pro_id FROM cad_prod WHERE pro_industria = 1 AND pro_codigonormalizado = 'ABC1'),
    1, 'PADRAO', 150.00, NULL, NULL, 10.0, 18.0
);

-- Teste 4: Buscar preço
SELECT * FROM fn_buscar_preco(1, 'ABC-0001', 'PADRAO');

-- Teste 5: View consolidada
SELECT * FROM vw_produtos_precos WHERE pro_industria = 1 LIMIT 10;
*/

-- ============================================================================
-- Fim do Script
-- ============================================================================
