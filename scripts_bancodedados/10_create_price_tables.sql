-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 10: Price Tables Structure
-- ============================================================================
-- Este script cria:
-- 1. Tabela CAD_TABELASPRE (tabelas de preço)
-- 2. Índices para performance
-- 3. Foreign keys e constraints
-- 4. Funções de UPSERT inteligente
-- ============================================================================

-- ============================================================================
-- Table: CAD_TABELASPRE (Tabelas de Preço)
-- ============================================================================
CREATE TABLE cad_tabelaspre (
    itab_idprod         INTEGER NOT NULL,
    itab_industria      INTEGER NOT NULL,
    itab_tabela         VARCHAR(20) NOT NULL,
    itab_grupodesconto  INTEGER,
    itab_descontoadd    DOUBLE PRECISION DEFAULT 0,
    itab_ipi            DOUBLE PRECISION DEFAULT 0,
    itab_st             DOUBLE PRECISION DEFAULT 0,
    itab_prepeso        DOUBLE PRECISION DEFAULT 0,
    itab_precobruto     DOUBLE PRECISION DEFAULT 0,
    itab_precopromo     DOUBLE PRECISION DEFAULT 0,
    itab_precoespecial  DOUBLE PRECISION DEFAULT 0,
    itab_datatbela      DATE,
    itab_datavencimento DATE,
    itab_status         BOOLEAN DEFAULT true,
    
    -- Chave primária composta: produto + tabela
    CONSTRAINT pk_cad_tabelaspre PRIMARY KEY (itab_idprod, itab_tabela)
);

-- Comentários da tabela
COMMENT ON TABLE cad_tabelaspre IS 'Tabelas de preço dos produtos - um produto pode ter múltiplas tabelas';
COMMENT ON COLUMN cad_tabelaspre.itab_idprod IS 'ID do produto (FK para cad_prod)';
COMMENT ON COLUMN cad_tabelaspre.itab_industria IS 'Código da indústria/fornecedor';
COMMENT ON COLUMN cad_tabelaspre.itab_tabela IS 'Nome/código da tabela de preço (ex: PADRAO, PROMOCIONAL, VIP)';
COMMENT ON COLUMN cad_tabelaspre.itab_grupodesconto IS 'Grupo de desconto aplicável';
COMMENT ON COLUMN cad_tabelaspre.itab_descontoadd IS 'Desconto adicional da tabela (%)';
COMMENT ON COLUMN cad_tabelaspre.itab_ipi IS 'Percentual de IPI (%)';
COMMENT ON COLUMN cad_tabelaspre.itab_st IS 'Percentual de ST (%)';
COMMENT ON COLUMN cad_tabelaspre.itab_prepeso IS 'Preço por peso (kg)';
COMMENT ON COLUMN cad_tabelaspre.itab_precobruto IS 'Preço bruto base';
COMMENT ON COLUMN cad_tabelaspre.itab_precopromo IS 'Preço promocional';
COMMENT ON COLUMN cad_tabelaspre.itab_precoespecial IS 'Preço especial';
COMMENT ON COLUMN cad_tabelaspre.itab_datatbela IS 'Data de criação/vigência da tabela';
COMMENT ON COLUMN cad_tabelaspre.itab_datavencimento IS 'Data de vencimento da tabela';
COMMENT ON COLUMN cad_tabelaspre.itab_status IS 'Status da tabela (ativo/inativo)';

-- ============================================================================
-- Índices para Performance
-- ============================================================================
CREATE INDEX idx_tabelaspre_industria ON cad_tabelaspre(itab_industria);
CREATE INDEX idx_tabelaspre_tabela ON cad_tabelaspre(itab_tabela);
CREATE INDEX idx_tabelaspre_produto ON cad_tabelaspre(itab_idprod);
CREATE INDEX idx_tabelaspre_status ON cad_tabelaspre(itab_status);
CREATE INDEX idx_tabelaspre_vigencia ON cad_tabelaspre(itab_datatbela, itab_datavencimento);

-- Índice composto para busca de preço ativo
CREATE INDEX idx_tabelaspre_busca_preco 
    ON cad_tabelaspre(itab_industria, itab_tabela, itab_status)
    WHERE itab_status = true;

-- ============================================================================
-- Foreign Keys
-- ============================================================================
ALTER TABLE cad_tabelaspre 
    ADD CONSTRAINT fk_tabelaspre_produto 
    FOREIGN KEY (itab_idprod) 
    REFERENCES cad_prod(pro_id)
    ON DELETE CASCADE;

ALTER TABLE cad_tabelaspre 
    ADD CONSTRAINT fk_tabelaspre_industria 
    FOREIGN KEY (itab_industria) 
    REFERENCES fornecedores(for_codigo)
    ON DELETE CASCADE;

ALTER TABLE cad_tabelaspre 
    ADD CONSTRAINT fk_tabelaspre_grupodesc 
    FOREIGN KEY (itab_grupodesconto) 
    REFERENCES grupo_desc(gde_id)
    ON DELETE SET NULL;

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
    p_codbarras VARCHAR(13) DEFAULT NULL
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
    
    -- Tenta buscar o produto existente
    SELECT pro_id INTO v_pro_id
    FROM cad_prod
    WHERE pro_industria = p_industria 
      AND pro_codigonormalizado = v_codigo_normalizado;
    
    IF v_pro_id IS NOT NULL THEN
        -- Produto existe: ATUALIZA apenas campos fixos
        UPDATE cad_prod SET
            pro_nome = COALESCE(p_nome, pro_nome),
            pro_peso = COALESCE(p_peso, pro_peso),
            pro_embalagem = COALESCE(p_embalagem, pro_embalagem),
            pro_grupo = COALESCE(p_grupo, pro_grupo),
            pro_setor = COALESCE(p_setor, pro_setor),
            pro_linha = COALESCE(p_linha, pro_linha),
            pro_ncm = COALESCE(p_ncm, pro_ncm),
            pro_origem = COALESCE(p_origem, pro_origem),
            pro_aplicacao = COALESCE(p_aplicacao, pro_aplicacao),
            pro_codbarras = COALESCE(p_codbarras, pro_codbarras),
            pro_codprod = p_codprod -- Atualiza código original se mudou formatação
        WHERE pro_id = v_pro_id;
    ELSE
        -- Produto NÃO existe: INSERE novo
        INSERT INTO cad_prod (
            pro_industria,
            pro_codprod,
            pro_codigonormalizado,
            pro_codigooriginal,
            pro_nome,
            pro_peso,
            pro_embalagem,
            pro_grupo,
            pro_setor,
            pro_linha,
            pro_ncm,
            pro_origem,
            pro_aplicacao,
            pro_codbarras,
            pro_status
        ) VALUES (
            p_industria,
            p_codprod,
            v_codigo_normalizado,
            p_codprod,
            p_nome,
            p_peso,
            p_embalagem,
            p_grupo,
            p_setor,
            p_linha,
            p_ncm,
            p_origem,
            p_aplicacao,
            p_codbarras,
            true
        )
        RETURNING pro_id INTO v_pro_id;
    END IF;
    
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
        itab_industria,
        itab_tabela,
        itab_precobruto,
        itab_precopromo,
        itab_precoespecial,
        itab_ipi,
        itab_st,
        itab_grupodesconto,
        itab_descontoadd,
        itab_datatbela,
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
        itab_datatbela = EXCLUDED.itab_datatbela,
        itab_datavencimento = EXCLUDED.itab_datavencimento,
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
    t.itab_datatbela,
    t.itab_datavencimento,
    t.itab_status,
    -- Preço final sugerido (bruto + IPI)
    ROUND(t.itab_precobruto * (1 + t.itab_ipi / 100), 2) as preco_com_ipi
FROM cad_prod p
INNER JOIN fornecedores f ON f.for_codigo = p.pro_industria
LEFT JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
WHERE p.pro_status = true;

COMMENT ON VIEW vw_produtos_precos IS 
'View consolidada de produtos com seus preços em todas as tabelas';

-- ============================================================================
-- Fim do Script
-- ============================================================================
