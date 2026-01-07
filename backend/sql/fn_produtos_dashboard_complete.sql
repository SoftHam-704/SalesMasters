
-- =====================================================
-- 1. fn_produtos_ranking (Already verified)
-- =====================================================
DROP FUNCTION IF EXISTS fn_produtos_ranking(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_produtos_ranking(
    p_ano INTEGER,
    p_mes_inicio INTEGER DEFAULT 1,
    p_mes_fim INTEGER DEFAULT 12,
    p_industria INTEGER DEFAULT NULL,
    p_cliente INTEGER DEFAULT NULL
)
RETURNS TABLE (
    produto_id INTEGER,
    produto_codigo VARCHAR,
    produto_nome VARCHAR,
    grupo_codigo INTEGER,
    grupo_nome VARCHAR,
    qtd_total DOUBLE PRECISION,
    percentual_acumulado DOUBLE PRECISION,
    classificacao_abc VARCHAR,
    ranking BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vendas AS (
        SELECT 
            i.ite_idproduto,
            SUM(i.ite_quant) AS qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
          AND (p_cliente IS NULL OR p.ped_cliente = p_cliente)
        GROUP BY i.ite_idproduto
    ),
    totais AS (
        SELECT 
            v.ite_idproduto,
            v.qtd,
            SUM(v.qtd) OVER () AS total_geral,
            SUM(v.qtd) OVER (ORDER BY v.qtd DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS qtd_acumulada
        FROM vendas v
    )
    SELECT 
        cp.pro_id,
        CAST(cp.pro_codprod AS VARCHAR),
        CAST(cp.pro_nome AS VARCHAR),
        g.gru_codigo,
        CAST(g.gru_nome AS VARCHAR),
        CAST(t.qtd AS DOUBLE PRECISION),
        ROUND(CAST(t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100 AS NUMERIC), 2)::DOUBLE PRECISION AS perc_acum,
        CAST(CASE 
            WHEN (t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100) <= 80 THEN 'A'
            WHEN (t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100) <= 95 THEN 'B'
            ELSE 'C'
        END AS VARCHAR) AS abc,
        ROW_NUMBER() OVER (ORDER BY t.qtd DESC) AS rank
    FROM totais t
    INNER JOIN cad_prod cp ON cp.pro_id = t.ite_idproduto
    LEFT JOIN grupos g ON g.gru_codigo = cp.pro_grupo
    ORDER BY t.qtd DESC;
END;
$$;


-- =====================================================
-- 2. fn_produtos_familias
-- =====================================================
DROP FUNCTION IF EXISTS fn_produtos_familias(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_produtos_familias(
    p_ano INTEGER,
    p_mes_inicio INTEGER DEFAULT 1,
    p_mes_fim INTEGER DEFAULT 12,
    p_industria INTEGER DEFAULT NULL,
    p_cliente INTEGER DEFAULT NULL
)
RETURNS TABLE (
    familia_codigo INTEGER,
    familia_nome VARCHAR,
    qtd_total DOUBLE PRECISION,
    skus_vendidos BIGINT,
    percentual DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vendas_familia AS (
        SELECT 
            g.gru_codigo,
            g.gru_nome,
            SUM(i.ite_quant) AS qtd,
            COUNT(DISTINCT i.ite_idproduto) as skus
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN cad_prod cp ON cp.pro_id = i.ite_idproduto
        LEFT JOIN grupos g ON g.gru_codigo = cp.pro_grupo
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
          AND (p_cliente IS NULL OR p.ped_cliente = p_cliente)
        GROUP BY g.gru_codigo, g.gru_nome
    ),
    total_geral AS (
        SELECT SUM(qtd) as total FROM vendas_familia
    )
    SELECT 
        COALESCE(gru_codigo, 0),
        CAST(COALESCE(gru_nome, 'SEM GRUPO') AS VARCHAR),
        CAST(qtd AS DOUBLE PRECISION),
        skus,
        ROUND(CAST(qtd / NULLIF((SELECT total FROM total_geral), 0) * 100 AS NUMERIC), 2)::DOUBLE PRECISION
    FROM vendas_familia
    ORDER BY qtd DESC;
END;
$$;


-- =====================================================
-- 3. fn_produtos_portfolio_vendas
-- =====================================================
DROP FUNCTION IF EXISTS fn_produtos_portfolio_vendas(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_produtos_portfolio_vendas(
    p_ano INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    mes_num INTEGER,
    mes_nome TEXT,
    portfolio_total BIGINT,
    itens_vendidos BIGINT,
    percentual_cobertura DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH mes_series AS (
        SELECT generate_series(1, 12) as m
    ),
    portfolio AS (
        SELECT COUNT(*) as total_skus
        FROM cad_prod cp
        WHERE cp.pro_status = true
          AND (p_industria IS NULL OR cp.pro_industria = p_industria)
    ),
    vendas_mes AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            COUNT(DISTINCT i.ite_idproduto) as skus_vendidos
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN cad_prod cp ON cp.pro_id = i.ite_idproduto
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    )
    SELECT 
        CAST(ms.m AS INTEGER),
        CAST(to_char(to_date(ms.m::text, 'MM'), 'TMMon') AS TEXT), -- Jan, Fev...
        (SELECT total_skus FROM portfolio),
        COALESCE(vm.skus_vendidos, 0),
        ROUND(CAST(COALESCE(vm.skus_vendidos, 0)::numeric / NULLIF((SELECT total_skus FROM portfolio), 0) * 100 AS NUMERIC), 1)::DOUBLE PRECISION
    FROM mes_series ms
    LEFT JOIN vendas_mes vm ON ms.m = vm.m
    ORDER BY ms.m;
END;
$$;


-- =====================================================
-- 4. fn_produtos_desempenho_mensal
-- =====================================================
DROP FUNCTION IF EXISTS fn_produtos_desempenho_mensal(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_produtos_desempenho_mensal(
    p_produto_id INTEGER,
    p_ano INTEGER
)
RETURNS TABLE (
    mes_num INTEGER,
    mes_nome TEXT,
    qtd_atual DOUBLE PRECISION,
    qtd_anterior DOUBLE PRECISION,
    variacao DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH mes_series AS (
        SELECT generate_series(1, 12) as m
    ),
    vendas_atual AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            SUM(i.ite_quant) as qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    vendas_anterior AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            SUM(i.ite_quant) as qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano - 1
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    )
    SELECT 
        CAST(ms.m AS INTEGER),
        CAST(to_char(to_date(ms.m::text, 'MM'), 'TMMon') AS TEXT),
        COALESCE(va.qtd, 0)::DOUBLE PRECISION,
        COALESCE(van.qtd, 0)::DOUBLE PRECISION,
        CAST(CASE 
            WHEN COALESCE(van.qtd, 0) = 0 THEN 0 
            ELSE ((COALESCE(va.qtd, 0) - van.qtd) / van.qtd * 100) 
        END AS DOUBLE PRECISION)
    FROM mes_series ms
    LEFT JOIN vendas_atual va ON ms.m = va.m
    LEFT JOIN vendas_anterior van ON ms.m = van.m
    ORDER BY ms.m;
END;
$$;


-- =====================================================
-- 5. fn_produtos_clientes (Quem comprou vs Quem não)
-- =====================================================
DROP FUNCTION IF EXISTS fn_produtos_clientes(INTEGER, BOOLEAN, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_produtos_clientes(
    p_produto_id INTEGER,
    p_compraram BOOLEAN, -- TRUE=Quem comprou, FALSE=Quem NÃO comprou
    p_ano INTEGER DEFAULT NULL,
    p_mes_inicio INTEGER DEFAULT 1,
    p_mes_fim INTEGER DEFAULT 12
)
RETURNS TABLE (
    cliente_codigo INTEGER,
    cliente_nome VARCHAR,
    qtd_comprada DOUBLE PRECISION,
    ultima_compra TIMESTAMP,
    status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_compraram THEN
        -- Retorna quem COMPROU no período
        RETURN QUERY
        SELECT 
            c.cli_codigo,
            CAST(c.cli_nomred AS VARCHAR) as nome,
            SUM(i.ite_quant)::DOUBLE PRECISION as total,
            MAX(p.ped_data)::TIMESTAMP as ult_compra,
            CAST('Ativo' AS VARCHAR)
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND (p_ano IS NULL OR EXTRACT(YEAR FROM p.ped_data) = p_ano)
          AND (p_ano IS NULL OR EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim)
        GROUP BY c.cli_codigo, c.cli_nomred
        ORDER BY total DESC;
    ELSE
        -- Retorna quem NÃO comprou (mas comprou qualquer outra coisa no ano => base ativa)
        RETURN QUERY
        SELECT DISTINCT
            c.cli_codigo,
            CAST(c.cli_nomred AS VARCHAR) as nome,
            0::DOUBLE PRECISION as total,
            NULL::TIMESTAMP as ult_compra,
            CAST('Oportunidade' AS VARCHAR) as status
        FROM pedidos p
        INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
        WHERE p.ped_situacao IN ('P', 'F')
          AND (p_ano IS NULL OR EXTRACT(YEAR FROM p.ped_data) = p_ano)
          AND c.cli_codigo NOT IN (
              -- Subquery: Clientes que compraram este produto
              SELECT DISTINCT p2.ped_cliente
              FROM pedidos p2
              INNER JOIN itens_ped i2 ON i2.ite_pedido = p2.ped_pedido
              WHERE i2.ite_idproduto = p_produto_id
                AND p2.ped_situacao IN ('P', 'F')
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM p2.ped_data) = p_ano)
                AND (p_ano IS NULL OR EXTRACT(MONTH FROM p2.ped_data) BETWEEN p_mes_inicio AND p_mes_fim)
          )
        ORDER BY nome;
    END IF;
END;
$$;
