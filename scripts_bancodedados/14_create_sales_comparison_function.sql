-- ============================================================================
-- Função para Comparação de Vendas Mensais (Ano Atual vs Ano Anterior)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_comparacao_vendas_mensais(
    p_ano_atual INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_ano_anterior INTEGER DEFAULT (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::INTEGER
)
RETURNS TABLE (
    mes INTEGER,
    mes_nome VARCHAR(20),
    vendas_ano_atual DOUBLE PRECISION,
    vendas_ano_anterior DOUBLE PRECISION,
    variacao_percentual DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH vendas_atual AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_totliquido) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
          AND p.ped_situacao = 'F'
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    vendas_anterior AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_totliquido) AS total
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
        COALESCE(va.total, 0) AS vendas_ano_atual,
        COALESCE(vant.total, 0) AS vendas_ano_anterior,
        CASE
            WHEN COALESCE(vant.total, 0) = 0 THEN 0
            ELSE ((COALESCE(va.total, 0) - COALESCE(vant.total, 0)) / COALESCE(vant.total, 1)) * 100
        END AS variacao_percentual
    FROM meses m
    LEFT JOIN vendas_atual va ON va.mes = m.mes
    LEFT JOIN vendas_anterior vant ON vant.mes = m.mes
    ORDER BY m.mes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_comparacao_vendas_mensais(INTEGER, INTEGER) IS
'Retorna comparação de vendas mensais entre dois anos (padrão: ano atual vs ano anterior)';

-- Exemplo de uso:
-- SELECT * FROM fn_comparacao_vendas_mensais(2025, 2024);
