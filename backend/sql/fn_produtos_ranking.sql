-- =====================================================
-- fn_produtos_ranking
-- =====================================================
-- Ranking produtos por quantidade + classificação ABC
-- Curva Pareto: A=80%, B=95%, C=100%
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
        t.qtd, -- Already DOUBLE PRECISION in DB, no cast needed or ::float if strict
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
