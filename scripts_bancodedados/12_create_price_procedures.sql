-- ============================================================================
-- Procedures para Gerenciamento de Tabelas de Preço
-- ============================================================================
-- Criado em: 2025-12-19
-- Descrição: Procedures otimizadas para listagem de tabelas e produtos
-- ============================================================================

-- ============================================================================
-- FUNCTION: fn_listar_tabelas_industria
-- ============================================================================
-- Descrição: Lista todas as tabelas de preço de uma indústria específica
-- Parâmetros: p_industria (INTEGER) - Código da indústria
-- Retorno: TABLE com informações das tabelas
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_listar_tabelas_industria(
    p_industria INTEGER
)
RETURNS TABLE (
    itab_industria INTEGER,
    itab_tabela VARCHAR(20),
    itab_datatabela DATE,
    itab_datavencimento DATE,
    itab_status BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.itab_industria,
        ct.itab_tabela,
        MAX(ct.itab_datatbela) AS itab_datatabela,
        MAX(ct.itab_datavencimento) AS itab_datavencimento,
        BOOL_AND(ct.itab_status) AS itab_status
    FROM cad_tabelaspre ct
    WHERE ct.itab_industria = p_industria
    GROUP BY ct.itab_industria, ct.itab_tabela
    ORDER BY ct.itab_tabela;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: fn_listar_produtos_tabela
-- ============================================================================
-- Descrição: Lista todos os produtos de uma tabela de preço específica
-- Parâmetros: 
--   p_industria (INTEGER) - Código da indústria
--   p_tabela (VARCHAR) - Nome da tabela de preço
-- Retorno: TABLE com informações dos produtos e preços
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_listar_produtos_tabela(
    p_industria INTEGER,
    p_tabela VARCHAR(20)
)
RETURNS TABLE (
    itab_idprod INTEGER,
    itab_industria INTEGER,
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
    itab_datatabela DATE,
    itab_datavencimento DATE,
    itab_status BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.itab_idprod,
        ct.itab_industria,
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
        ct.itab_datatbela AS itab_datatabela,
        ct.itab_datavencimento,
        ct.itab_status
    FROM cad_tabelaspre ct
    LEFT JOIN cad_prod cp ON ct.itab_idprod = cp.pro_id
    WHERE ct.itab_industria = p_industria 
      AND ct.itab_tabela = p_tabela
    ORDER BY cp.pro_codprod;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS DAS FUNÇÕES
-- ============================================================================

COMMENT ON FUNCTION fn_listar_tabelas_industria(INTEGER) IS 
'Lista todas as tabelas de preço de uma indústria, agrupando por nome da tabela e retornando as datas mais recentes';

COMMENT ON FUNCTION fn_listar_produtos_tabela(INTEGER, VARCHAR) IS 
'Lista todos os produtos com seus preços de uma tabela específica de uma indústria';

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

-- Listar tabelas da indústria 1
-- SELECT * FROM fn_listar_tabelas_industria(1);

-- Listar produtos da tabela 'PADRAO' da indústria 1
-- SELECT * FROM fn_listar_produtos_tabela(1, 'PADRAO');

-- ============================================================================
-- ÍNDICES RECOMENDADOS (se ainda não existirem)
-- ============================================================================

-- Índice para otimizar busca por indústria e tabela
CREATE INDEX IF NOT EXISTS idx_tabelaspre_industria_tabela 
ON cad_tabelaspre(itab_industria, itab_tabela);

-- Índice para otimizar join com produtos
CREATE INDEX IF NOT EXISTS idx_tabelaspre_idprod 
ON cad_tabelaspre(itab_idprod);

-- Índice para otimizar ordenação por código do produto
CREATE INDEX IF NOT EXISTS idx_prod_codprod 
ON cad_prod(pro_codprod);
