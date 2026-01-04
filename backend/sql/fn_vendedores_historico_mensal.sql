-- =====================================================
-- FUNÇÃO 3: HISTÓRICO MENSAL DE VENDAS
-- =====================================================
-- Retorna últimos 12 meses de vendas por vendedor
-- Para alimentar IA com previsão de vendas
-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_historico_mensal(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_historico_mensal(
    p_vendedor INTEGER,
    p_meses_retroativos INTEGER DEFAULT 12
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    ano INTEGER,
    mes INTEGER,
    mes_nome VARCHAR,
    total_vendas NUMERIC,
    qtd_pedidos INTEGER,
    qtd_clientes INTEGER,
    ticket_medio NUMERIC,
    meta_mes NUMERIC,
    perc_atingimento NUMERIC,
    tendencia VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH meses_series AS (
        SELECT 
            date_trunc('month', CURRENT_DATE - (n || ' months')::interval) AS mes_ref,
            EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS ano,
            EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS mes
        FROM generate_series(0, p_meses_retroativos - 1) AS n
    ),
    vendas_por_mes AS (
        SELECT 
            ped_vendedor,
            EXTRACT(YEAR FROM ped_data)::INTEGER AS ano,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_pedido) AS qtd_pedidos,
            COUNT(DISTINCT ped_cliente) AS qtd_clientes
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
          AND ped_vendedor = p_vendedor
          AND ped_data >= CURRENT_DATE - (p_meses_retroativos || ' months')::interval
        GROUP BY ped_vendedor, EXTRACT(YEAR FROM ped_data), EXTRACT(MONTH FROM ped_data)
    ),
    metas_por_mes AS (
        SELECT 
            met_vendedor,
            met_ano,
            UNNEST(ARRAY[
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ]) AS meta_valor,
            UNNEST(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]) AS mes
        FROM vend_metas
        WHERE met_vendedor = p_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome::VARCHAR,
        ms.ano,
        ms.mes,
        CAST(CASE ms.mes
            WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END AS VARCHAR) AS mes_nome,
        COALESCE(vpm.total, 0)::NUMERIC AS total_vendas,
        COALESCE(vpm.qtd_pedidos, 0)::INTEGER AS qtd_pedidos,
        COALESCE(vpm.qtd_clientes, 0)::INTEGER AS qtd_clientes,
        CASE 
            WHEN COALESCE(vpm.qtd_pedidos, 0) = 0 THEN 0::NUMERIC
            ELSE ROUND((vpm.total / vpm.qtd_pedidos)::NUMERIC, 2)
        END AS ticket_medio,
        COALESCE(m.meta_valor, 0)::NUMERIC AS meta_mes,
        CASE 
            WHEN COALESCE(m.meta_valor, 0) = 0 THEN 0::NUMERIC
            ELSE ROUND((COALESCE(vpm.total, 0) / m.meta_valor * 100)::NUMERIC, 2)
        END AS perc_atingimento,
        -- Tendência comparando com mês anterior
        CAST(CASE 
            WHEN LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) IS NULL THEN '→'
            WHEN vpm.total > LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 1.05 THEN '📈 Subindo'
            WHEN vpm.total < LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 0.95 THEN '📉 Caindo'
            ELSE '→ Estável'
        END AS VARCHAR) AS tendencia
    FROM vendedores v
    CROSS JOIN meses_series ms
    LEFT JOIN vendas_por_mes vpm ON vpm.ped_vendedor = v.ven_codigo 
        AND vpm.ano = ms.ano AND vpm.mes = ms.mes
    LEFT JOIN metas_por_mes m ON m.met_vendedor = v.ven_codigo 
        AND m.met_ano = ms.ano AND m.mes = ms.mes
    WHERE v.ven_codigo = p_vendedor
    ORDER BY ms.ano DESC, ms.mes DESC;
END;
$$;

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
-- Últimos 12 meses do vendedor 1:
-- SELECT * FROM fn_vendedores_historico_mensal(1, 12);

-- Últimos 6 meses:
-- SELECT * FROM fn_vendedores_historico_mensal(1, 6);

-- =====================================================
-- RESULTADO ESPERADO (para alimentar IA):
-- =====================================================
-- ano  | mes | mes_nome  | total_vendas | meta_mes | perc_atingimento | tendencia
-- 2025 | 12  | Dezembro  | 19625027     | 18000000 | 109.03           | 📈 Subindo
-- 2025 | 11  | Novembro  | 18500000     | 18000000 | 102.78           | → Estável
-- 2025 | 10  | Outubro   | 18200000     | 18000000 | 101.11           | 📉 Caindo
-- ...

-- =====================================================
-- USO PARA IA - PREVISÃO:
-- =====================================================
/*
A IA pode usar este histórico para:
1. Identificar tendência (subindo, caindo, sazonal)
2. Calcular média móvel
3. Prever próximo mês
4. Calcular probabilidade de bater meta
5. Identificar meses atípicos (outliers)

Exemplo de prompt para IA:
"Baseado neste histórico de 12 meses, preveja as vendas 
do próximo mês e a probabilidade de bater a meta de R$ 18.000.000"
*/
