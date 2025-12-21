-- ============================================================================
-- Função para Análise de Vendas por Produto
-- ============================================================================
-- Descrição: Retorna quantidades vendidas de um produto por mês/ano
-- Parâmetros:
--   p_industria (INTEGER) - Código da indústria
--   p_produto (VARCHAR) - Código do produto
--   p_data_inicio (DATE) - Data inicial do período
--   p_data_fim (DATE) - Data final do período
--   p_situacao (VARCHAR) - Situação do pedido (default: 'F' = Faturado)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_analise_vendas_produto(
    p_industria INTEGER,
    p_produto VARCHAR(25),
    p_data_inicio DATE,
    p_data_fim DATE,
    p_situacao VARCHAR(1) DEFAULT 'F'
)
RETURNS TABLE (
    ano INTEGER,
    mes INTEGER,
    quantidade DOUBLE PRECISION,
    valor_total DOUBLE PRECISION,
    qtd_pedidos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(YEAR FROM p.ped_data)::INTEGER AS ano,
        EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
        SUM(i.ite_quant) AS quantidade,
        SUM(i.ite_totliquido) AS valor_total,
        COUNT(DISTINCT p.ped_pedido)::INTEGER AS qtd_pedidos
    FROM pedidos p
    INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_industria = p_industria
      AND p.ped_data BETWEEN p_data_inicio AND p_data_fim
      AND p.ped_situacao = p_situacao
      AND i.ite_produto = p_produto
    GROUP BY EXTRACT(YEAR FROM p.ped_data), EXTRACT(MONTH FROM p.ped_data)
    ORDER BY ano, mes;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Função para Listar Clientes que Compraram o Produto
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_clientes_compraram_produto(
    p_industria INTEGER,
    p_produto VARCHAR(25),
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE (
    cli_codigo INTEGER,
    cli_nome VARCHAR(100),
    quantidade_total DOUBLE PRECISION,
    valor_total DOUBLE PRECISION,
    ultima_compra DATE,
    qtd_pedidos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.cli_codigo,
        c.cli_nome,
        SUM(i.ite_quant) AS quantidade_total,
        SUM(i.ite_totliquido) AS valor_total,
        MAX(p.ped_data)::DATE AS ultima_compra,
        COUNT(DISTINCT p.ped_pedido)::INTEGER AS qtd_pedidos
    FROM pedidos p
    INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
    WHERE p.ped_industria = p_industria
      AND p.ped_data BETWEEN p_data_inicio AND p_data_fim
      AND p.ped_situacao = 'F'
      AND i.ite_produto = p_produto
    GROUP BY c.cli_codigo, c.cli_nome
    ORDER BY quantidade_total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Função para Listar Clientes que NUNCA Compraram o Produto
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_clientes_nunca_compraram_produto(
    p_industria INTEGER,
    p_produto VARCHAR(25)
)
RETURNS TABLE (
    cli_codigo INTEGER,
    cli_nome VARCHAR(100),
    cli_cidade VARCHAR(50),
    cli_uf VARCHAR(2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.cli_codigo,
        c.cli_nome,
        c.cli_cidade,
        c.cli_uf
    FROM clientes c
    WHERE NOT EXISTS (
          SELECT 1
          FROM pedidos p
          INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
          WHERE p.ped_cliente = c.cli_codigo
            AND p.ped_industria = p_industria
            AND i.ite_produto = p_produto
      )
    ORDER BY c.cli_nome
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comentários
-- ============================================================================

COMMENT ON FUNCTION fn_analise_vendas_produto(INTEGER, VARCHAR, DATE, DATE, VARCHAR) IS
'Retorna análise de vendas de um produto agrupada por mês/ano dentro de um período';

COMMENT ON FUNCTION fn_clientes_compraram_produto(INTEGER, VARCHAR, DATE, DATE) IS
'Lista clientes que compraram um produto específico no período com totais';

COMMENT ON FUNCTION fn_clientes_nunca_compraram_produto(INTEGER, VARCHAR) IS
'Lista clientes ativos que nunca compraram um produto específico';

-- ============================================================================
-- Exemplos de Uso
-- ============================================================================

-- Análise de vendas do produto '11002048' da indústria 20 em 2024
-- SELECT * FROM fn_analise_vendas_produto(20, '11002048', '2024-01-01', '2024-12-31', 'F');

-- Clientes que compraram
-- SELECT * FROM fn_clientes_compraram_produto(20, '11002048', '2024-01-01', '2024-12-31');

-- Clientes que nunca compraram
-- SELECT * FROM fn_clientes_nunca_compraram_produto(20, '11002048');
