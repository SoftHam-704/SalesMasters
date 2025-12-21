-- ============================================================================
-- Função para Comparação de QUANTIDADES Vendidas Mensais (Ano Atual vs Ano Anterior)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_comparacao_quantidades_mensais(
    p_ano_atual INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_ano_anterior INTEGER DEFAULT (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::INTEGER
)
RETURNS TABLE (
    mes INTEGER,
    mes_nome VARCHAR(20),
    quantidade_ano_atual DOUBLE PRECISION,
    quantidade_ano_anterior DOUBLE PRECISION,
    variacao_percentual DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH quantidades_atual AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_quant) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
          AND p.ped_situacao = 'F'
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    quantidades_anterior AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_quant) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior
          AND p.ped_situacao = 'F'
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    meses AS (
        SELECT generate_series(1, 12) AS mes
    )
    SELECT
        m.mes,
        (CASE m.mes
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END)::VARCHAR(20) AS mes_nome,
        COALESCE(qa.total, 0) AS quantidade_ano_atual,
        COALESCE(qant.total, 0) AS quantidade_ano_anterior,
        CASE
            WHEN COALESCE(qant.total, 0) = 0 THEN 0
            ELSE ((COALESCE(qa.total, 0) - COALESCE(qant.total, 0)) / COALESCE(qant.total, 1)) * 100
        END AS variacao_percentual
    FROM meses m
    LEFT JOIN quantidades_atual qa ON qa.mes = m.mes
    LEFT JOIN quantidades_anterior qant ON qant.mes = m.mes
    ORDER BY m.mes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_comparacao_quantidades_mensais(INTEGER, INTEGER) IS
'Retorna comparação de QUANTIDADES vendidas mensais entre dois anos (padrão: ano atual vs ano anterior)';
