-- =====================================================
-- FUNÇÃO 1: PERFORMANCE COMPLETA DE VENDEDORES
-- =====================================================
-- Retorna ranking de performance com todas as métricas
-- Alimenta o dashboard principal de colaboradores
-- =====================================================

-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_performance(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_performance(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    total_vendas_mes NUMERIC,
    total_vendas_mes_anterior NUMERIC,
    variacao_mom_percent NUMERIC,
    qtd_pedidos INTEGER,
    ticket_medio NUMERIC,
    meta_mes NUMERIC,
    perc_atingimento_meta NUMERIC,
    ranking INTEGER,
    clientes_ativos INTEGER,
    clientes_novos INTEGER,
    clientes_perdidos INTEGER,
    dias_desde_ultima_venda INTEGER,
    total_interacoes_crm INTEGER,
    status VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_mes_anterior INTEGER;
    v_ano_anterior INTEGER;
BEGIN
    -- Calcula mês e ano anterior
    IF p_mes = 1 THEN
        v_mes_anterior := 12;
        v_ano_anterior := p_ano - 1;
    ELSE
        v_mes_anterior := p_mes - 1;
        v_ano_anterior := p_ano;
    END IF;

    RETURN QUERY
    WITH vendas_mes_atual AS (
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_pedido) AS qtd_pedidos,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_cliente) AS clientes_unicos,
            MAX(ped_data) AS ultima_venda
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM ped_data) = p_mes)  -- p_mes=0 means all months
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    vendas_mes_anterior AS (
        SELECT 
            ped_vendedor,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = v_ano_anterior
          AND (p_mes = 0 OR EXTRACT(MONTH FROM ped_data) = v_mes_anterior)  -- p_mes=0 means compare full years
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_ativos AS (
        -- Clientes que compraram nos últimos 90 dias
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_novos AS (
        -- Clientes que fizeram primeira compra neste período
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS qtd
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM p.ped_data) = p_mes)  -- p_mes=0 means full year
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
          AND NOT EXISTS (
              SELECT 1 FROM pedidos p2
              WHERE p2.ped_cliente = p.ped_cliente
                AND p2.ped_data < DATE_TRUNC('year', MAKE_DATE(p_ano, COALESCE(NULLIF(p_mes, 0), 1), 1))
                AND p2.ped_situacao IN ('P', 'F')
          )
        GROUP BY p.ped_vendedor
    ),
    clientes_perdidos AS (
        -- Clientes que não compram há mais de 90 dias
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data < CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
          AND ped_cliente NOT IN (
              SELECT DISTINCT ped_cliente 
              FROM pedidos 
              WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
                AND ped_situacao IN ('P', 'F')
          )
        GROUP BY ped_vendedor
    ),
    metas AS (
        SELECT 
            met_vendedor,
            CASE 
                WHEN p_mes = 0 THEN  -- Full year: sum all months
                    SUM(COALESCE(met_jan, 0) + COALESCE(met_fev, 0) + COALESCE(met_mar, 0) + 
                        COALESCE(met_abr, 0) + COALESCE(met_mai, 0) + COALESCE(met_jun, 0) +
                        COALESCE(met_jul, 0) + COALESCE(met_ago, 0) + COALESCE(met_set, 0) +
                        COALESCE(met_out, 0) + COALESCE(met_nov, 0) + COALESCE(met_dez, 0))
                ELSE
                    SUM(CASE p_mes
                        WHEN 1 THEN met_jan
                        WHEN 2 THEN met_fev
                        WHEN 3 THEN met_mar
                        WHEN 4 THEN met_abr
                        WHEN 5 THEN met_mai
                        WHEN 6 THEN met_jun
                        WHEN 7 THEN met_jul
                        WHEN 8 THEN met_ago
                        WHEN 9 THEN met_set
                        WHEN 10 THEN met_out
                        WHEN 11 THEN met_nov
                        WHEN 12 THEN met_dez
                    END)
            END AS meta_mes
        FROM vend_metas
        WHERE met_ano = p_ano
          AND (p_vendedor IS NULL OR met_vendedor = p_vendedor)
        GROUP BY met_vendedor
    ),
    interacoes_crm AS (
        SELECT 
            ven_codigo,
            COUNT(*) AS total_interacoes
        FROM crm_interacao
        WHERE EXTRACT(YEAR FROM data_hora) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM data_hora) = p_mes)  -- p_mes=0 means full year
          AND (p_vendedor IS NULL OR ven_codigo = p_vendedor)
        GROUP BY ven_codigo
    ),
    metricas AS (
        SELECT 
            v.ven_codigo,
            v.ven_nome,
            CAST(COALESCE(vma.total, 0) AS NUMERIC) AS vendas_mes,
            CAST(COALESCE(vme.total, 0) AS NUMERIC) AS vendas_mes_anterior,
            CAST(COALESCE(vma.qtd_pedidos, 0) AS INTEGER) AS qtd_pedidos,
            CASE 
                WHEN COALESCE(vma.qtd_pedidos, 0) = 0 THEN 0::NUMERIC
                ELSE ROUND(CAST(COALESCE(vma.total, 0) / vma.qtd_pedidos AS NUMERIC), 2)
            END AS ticket_medio,
            CAST(COALESCE(m.meta_mes, 0) AS NUMERIC) AS meta,
            CAST(COALESCE(ca.qtd, 0) AS INTEGER) AS clientes_ativos,
            CAST(COALESCE(cn.qtd, 0) AS INTEGER) AS clientes_novos,
            CAST(COALESCE(cp.qtd, 0) AS INTEGER) AS clientes_perdidos,
            CAST(COALESCE(CURRENT_DATE - vma.ultima_venda, 999) AS INTEGER) AS dias_sem_venda,
            CAST(COALESCE(crm.total_interacoes, 0) AS INTEGER) AS interacoes,
            -- Variação MoM
            CASE 
                WHEN COALESCE(vme.total, 0) = 0 THEN 
                    CASE WHEN COALESCE(vma.total, 0) > 0 THEN 100.0::NUMERIC ELSE 0.0::NUMERIC END
                ELSE 
                    ROUND(CAST((COALESCE(vma.total, 0) - vme.total) / vme.total * 100 AS NUMERIC), 2)
            END AS mom,
            -- % Atingimento
            CASE 
                WHEN COALESCE(m.meta_mes, 0) = 0 THEN 0::NUMERIC
                ELSE ROUND(CAST(COALESCE(vma.total, 0) / m.meta_mes * 100 AS NUMERIC), 2)
            END AS perc_meta
        FROM vendedores v
        LEFT JOIN vendas_mes_atual vma ON vma.ped_vendedor = v.ven_codigo
        LEFT JOIN vendas_mes_anterior vme ON vme.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_ativos ca ON ca.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_novos cn ON cn.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_perdidos cp ON cp.ped_vendedor = v.ven_codigo
        LEFT JOIN metas m ON m.met_vendedor = v.ven_codigo
        LEFT JOIN interacoes_crm crm ON crm.ven_codigo = v.ven_codigo
        WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    )
    SELECT 
        metricas.ven_codigo,
        metricas.ven_nome,
        metricas.vendas_mes,
        metricas.vendas_mes_anterior,
        metricas.mom AS variacao_mom_percent,
        metricas.qtd_pedidos,
        metricas.ticket_medio,
        metricas.meta,
        metricas.perc_meta AS perc_atingimento_meta,
        CAST(RANK() OVER (ORDER BY metricas.vendas_mes DESC) AS INTEGER) AS ranking,
        metricas.clientes_ativos,
        metricas.clientes_novos,
        metricas.clientes_perdidos,
        metricas.dias_sem_venda AS dias_desde_ultima_venda,
        metricas.interacoes AS total_interacoes_crm,
        -- Status baseado em performance
        CAST(CASE 
            WHEN metricas.perc_meta >= 100 THEN '🏆 Acima da Meta'
            WHEN metricas.perc_meta >= 80 THEN '✅ Na Meta'
            WHEN metricas.perc_meta >= 60 THEN '⚠️ Em Risco'
            ELSE '🔴 Crítico'
        END AS VARCHAR) AS status
    FROM metricas
    ORDER BY metricas.vendas_mes DESC;
END;
$$;

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
-- Todos os vendedores em dezembro/2025:
-- SELECT * FROM fn_vendedores_performance(2025, 12, NULL);

-- Vendedor específico:
-- SELECT * FROM fn_vendedores_performance(2025, 12, 1);

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- vendedor_codigo | vendedor_nome  | total_vendas_mes | variacao_mom | ranking | status
-- 1               | RODRIGO ODON   | 19625027         | 5.17         | 1       | 🏆 Acima da Meta
-- 2               | CAMILA ALMEIDA | 16313464         | 11.56        | 2       | ✅ Na Meta
-- 3               | FERNANDA       | 1957442          | 7.08         | 3       | ⚠️ Em Risco
