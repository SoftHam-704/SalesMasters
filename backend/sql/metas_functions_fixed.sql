-- =====================================================
-- FUNÇÕES CORRIGIDAS - DASHBOARD DE METAS
-- Versão corrigida para evitar conflito de nomes
-- Execute este script no pgAdmin
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: RESUMO GERAL (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_resumo_geral(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_resumo_geral(
    p_ano INTEGER,
    p_mes INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_mes_anterior NUMERIC,
    total_mes_atual NUMERIC,
    variacao_percentual NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_mes_anterior INTEGER;
    v_ano_anterior INTEGER;
    v_total_ant NUMERIC;
    v_total_atu NUMERIC;
BEGIN
    IF p_mes = 1 THEN
        v_mes_anterior := 12;
        v_ano_anterior := p_ano - 1;
    ELSE
        v_mes_anterior := p_mes - 1;
        v_ano_anterior := p_ano;
    END IF;

    -- Mês anterior
    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_ant
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = v_ano_anterior
      AND EXTRACT(MONTH FROM ped_data) = v_mes_anterior
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    -- Mês atual
    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_atu
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = p_ano
      AND EXTRACT(MONTH FROM ped_data) = p_mes
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    RETURN QUERY
    SELECT 
        v_total_ant,
        v_total_atu,
        CASE 
            WHEN v_total_ant = 0 THEN 
                CASE WHEN v_total_atu > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((v_total_atu - v_total_ant) / v_total_ant * 100)::NUMERIC, 2)
        END;
END;
$$;

-- =====================================================
-- FUNÇÃO 2: METAS POR MÊS (CORRIGIDA) 
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_por_mes(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_por_mes(
    p_ano INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    mes INTEGER,
    mes_nome VARCHAR,
    ano_anterior NUMERIC,
    meta_ano_corrente NUMERIC,
    vendas_ano_corrente NUMERIC,
    perc_atingimento NUMERIC,
    perc_relacao_ano_ant NUMERIC
) 
LANGUAGE sql
AS $$
    WITH meses AS (
        SELECT 
            m.num AS mes,
            CASE m.num
                WHEN 1 THEN 'janeiro'
                WHEN 2 THEN 'fevereiro'
                WHEN 3 THEN 'março'
                WHEN 4 THEN 'abril'
                WHEN 5 THEN 'maio'
                WHEN 6 THEN 'junho'
                WHEN 7 THEN 'julho'
                WHEN 8 THEN 'agosto'
                WHEN 9 THEN 'setembro'
                WHEN 10 THEN 'outubro'
                WHEN 11 THEN 'novembro'
                WHEN 12 THEN 'dezembro'
            END AS mes_nome
        FROM generate_series(1, 12) AS m(num)
    ),
    industrias AS (
        SELECT 
            f.for_codigo,
            f.for_nomered
        FROM fornecedores f
        WHERE ($2 IS NULL OR f.for_codigo = $2)
          AND f.for_tipo2 <> 'I'
    ),
    vendas_ano_ant AS (
        SELECT 
            ped_industria,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1 - 1
          AND ped_situacao IN ('P', 'F')
          AND ($2 IS NULL OR ped_industria = $2)
        GROUP BY ped_industria, EXTRACT(MONTH FROM ped_data)
    ),
    vendas_ano_cor AS (
        SELECT 
            ped_industria,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND ped_situacao IN ('P', 'F')
          AND ($2 IS NULL OR ped_industria = $2)
        GROUP BY ped_industria, EXTRACT(MONTH FROM ped_data)
    ),
    metas_data AS (
        SELECT 
            met_industria,
            UNNEST(ARRAY[met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                         met_jul, met_ago, met_set, met_out, met_nov, met_dez]) AS meta_valor,
            UNNEST(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]) AS mes
        FROM ind_metas
        WHERE met_ano = $1
          AND ($2 IS NULL OR met_industria = $2)
    )
    SELECT 
        i.for_codigo::INTEGER,
        i.for_nomered::VARCHAR,
        m.mes::INTEGER,
        m.mes_nome::VARCHAR,
        COALESCE(vaa.total, 0)::NUMERIC,
        COALESCE(mt.meta_valor, 0)::NUMERIC,
        COALESCE(vac.total, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(mt.meta_valor, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(vac.total, 0) / mt.meta_valor * 100)::NUMERIC, 2)
        END::NUMERIC,
        CASE 
            WHEN COALESCE(vaa.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vac.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vac.total, 0) - vaa.total) / vaa.total * 100)::NUMERIC, 2)
        END::NUMERIC
    FROM industrias i
    CROSS JOIN meses m
    LEFT JOIN vendas_ano_ant vaa ON vaa.ped_industria = i.for_codigo AND vaa.mes = m.mes
    LEFT JOIN vendas_ano_cor vac ON vac.ped_industria = i.for_codigo AND vac.mes = m.mes
    LEFT JOIN metas_data mt ON mt.met_industria = i.for_codigo AND mt.mes = m.mes
    ORDER BY i.for_nomered, m.mes;
$$;

-- =====================================================
-- FUNÇÃO 3: ATINGIMENTO POR INDÚSTRIA (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_atingimento_industria(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_atingimento_industria(
    p_ano INTEGER,
    p_mes_ate INTEGER DEFAULT 12,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    meta_total NUMERIC,
    realizado_total NUMERIC,
    percentual_atingimento NUMERIC,
    status VARCHAR
) 
LANGUAGE sql
AS $$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1
          AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_calc AS (
        SELECT 
            ped_industria,
            SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo::INTEGER,
        f.for_nomered::VARCHAR,
        COALESCE(mc.soma_meta, 0)::NUMERIC,
        COALESCE(vc.soma_vendas, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
        END::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vc.soma_vendas, 0) < mc.soma_meta * 0.90 THEN 'Abaixo'
            WHEN COALESCE(vc.soma_vendas, 0) >= mc.soma_meta THEN 'Acima'
            ELSE 'Na Meta'
        END::VARCHAR
    FROM fornecedores f
    LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
    LEFT JOIN vendas_calc vc ON vc.ped_industria = f.for_codigo
    WHERE ($3 IS NULL OR f.for_codigo = $3)
      AND f.for_tipo2 <> 'I'
      AND (mc.soma_meta IS NOT NULL OR vc.soma_vendas IS NOT NULL)
    ORDER BY CASE 
        WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
        ELSE (COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)
    END DESC;
$$;

-- =====================================================
-- FUNÇÃO 4: VARIAÇÃO DE VENDAS (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_variacao_vendas(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_variacao_vendas(
    p_ano INTEGER,
    p_mes INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    mes_anterior NUMERIC,
    mes_atual NUMERIC,
    variacao_absoluta NUMERIC,
    variacao_percentual NUMERIC,
    participacao_percentual NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_mes_ant INTEGER;
    v_ano_ant INTEGER;
    v_total_geral NUMERIC;
BEGIN
    IF p_mes = 1 THEN
        v_mes_ant := 12;
        v_ano_ant := p_ano - 1;
    ELSE
        v_mes_ant := p_mes - 1;
        v_ano_ant := p_ano;
    END IF;

    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_geral
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = p_ano
      AND EXTRACT(MONTH FROM ped_data) = p_mes
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    RETURN QUERY
    WITH vendas_ant AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = v_ano_ant
          AND EXTRACT(MONTH FROM ped_data) = v_mes_ant
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria
    ),
    vendas_atu AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = p_ano
          AND EXTRACT(MONTH FROM ped_data) = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo,
        f.for_nomered,
        COALESCE(va.total, 0),
        COALESCE(vt.total, 0),
        COALESCE(vt.total, 0) - COALESCE(va.total, 0),
        CASE 
            WHEN COALESCE(va.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vt.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vt.total, 0) - va.total) / va.total * 100)::NUMERIC, 2)
        END,
        CASE 
            WHEN v_total_geral = 0 THEN 0
            ELSE ROUND((COALESCE(vt.total, 0) / v_total_geral * 100)::NUMERIC, 2)
        END
    FROM fornecedores f
    LEFT JOIN vendas_ant va ON va.ped_industria = f.for_codigo
    LEFT JOIN vendas_atu vt ON vt.ped_industria = f.for_codigo
    WHERE (p_industria IS NULL OR f.for_codigo = p_industria)
      AND f.for_tipo2 <> 'I'
      AND (va.total IS NOT NULL OR vt.total IS NOT NULL)
    ORDER BY COALESCE(vt.total, 0) DESC;
END;
$$;

-- =====================================================
-- FUNÇÃO 5: ANÁLISE DIÁRIA (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_analise_diaria(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_analise_diaria(
    p_ano INTEGER,
    p_mes INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    dia INTEGER,
    mes_anterior NUMERIC,
    mes_atual NUMERIC,
    variacao_percentual NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_mes_ant INTEGER;
    v_ano_ant INTEGER;
    v_ultimo_dia INTEGER;
BEGIN
    IF p_mes = 1 THEN
        v_mes_ant := 12;
        v_ano_ant := p_ano - 1;
    ELSE
        v_mes_ant := p_mes - 1;
        v_ano_ant := p_ano;
    END IF;

    v_ultimo_dia := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', MAKE_DATE(p_ano, p_mes, 1)) + INTERVAL '1 MONTH - 1 DAY'))::INTEGER;

    RETURN QUERY
    WITH dias AS (
        SELECT generate_series(1, v_ultimo_dia) AS num_dia
    ),
    vendas_ant AS (
        SELECT EXTRACT(DAY FROM ped_data + INTERVAL '1 day')::INTEGER AS num_dia, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = v_ano_ant
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = v_mes_ant
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY EXTRACT(DAY FROM ped_data + INTERVAL '1 day')
    ),
    vendas_atu AS (
        SELECT EXTRACT(DAY FROM ped_data + INTERVAL '1 day')::INTEGER AS num_dia, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY EXTRACT(DAY FROM ped_data + INTERVAL '1 day')
    )
    SELECT 
        d.num_dia::INTEGER,
        COALESCE(va.total, 0)::NUMERIC,
        COALESCE(vt.total, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(va.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vt.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vt.total, 0) - va.total) / va.total * 100)::NUMERIC, 2)
        END::NUMERIC
    FROM dias d
    LEFT JOIN vendas_ant va ON va.num_dia = d.num_dia
    LEFT JOIN vendas_atu vt ON vt.num_dia = d.num_dia
    ORDER BY d.num_dia;
END;
$$;

-- =====================================================
-- FUNÇÃO 6: ANÁLISE SEMANAL PIVOT (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_analise_semanal_pivot(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_metas_analise_semanal_pivot(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_analise_semanal_pivot(
    p_ano INTEGER,
    p_mes INTEGER
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    semana_49 NUMERIC,
    semana_50 NUMERIC,
    semana_51 NUMERIC,
    semana_52 NUMERIC,
    semana_53 NUMERIC,
    total NUMERIC
) 
LANGUAGE sql
AS $$
    WITH vendas_sem AS (
        SELECT 
            ped_industria,
            EXTRACT(WEEK FROM ped_data)::INTEGER AS semana,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) = $2
          AND ped_situacao IN ('P', 'F')
        GROUP BY ped_industria, EXTRACT(WEEK FROM ped_data)
    )
    SELECT 
        f.for_codigo::INTEGER,
        f.for_nomered::VARCHAR,
        COALESCE(SUM(CASE WHEN vs.semana = 49 THEN vs.total ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN vs.semana = 50 THEN vs.total ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN vs.semana = 51 THEN vs.total ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN vs.semana = 52 THEN vs.total ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN vs.semana = 53 THEN vs.total ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(vs.total), 0)::NUMERIC
    FROM fornecedores f
    LEFT JOIN vendas_sem vs ON vs.ped_industria = f.for_codigo
    WHERE f.for_tipo2 <> 'I'
    GROUP BY f.for_codigo, f.for_nomered
    HAVING SUM(vs.total) IS NOT NULL
    ORDER BY SUM(vs.total) DESC;
$$;

-- =====================================================
-- FUNÇÃO 7: MATRIZ DE AÇÃO (CORRIGIDA - SIMPLIFICADA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_matriz_acao(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_matriz_acao(
    p_ano INTEGER,
    p_mes_ate INTEGER DEFAULT 12,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    meta_total NUMERIC,
    realizado_total NUMERIC,
    percentual_meta NUMERIC,
    valor_realizado NUMERIC,
    quadrante VARCHAR,
    prioridade VARCHAR
) 
LANGUAGE sql
AS $$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1 AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_calc AS (
        SELECT ped_industria, SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    dados AS (
        SELECT 
            f.for_codigo,
            f.for_nomered,
            COALESCE(mc.soma_meta, 0) AS mt,
            COALESCE(vc.soma_vendas, 0) AS vd,
            CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
                 ELSE ROUND((COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
            END AS perc
        FROM fornecedores f
        LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
        LEFT JOIN vendas_calc vc ON vc.ped_industria = f.for_codigo
        WHERE ($3 IS NULL OR f.for_codigo = $3)
          AND f.for_tipo2 <> 'I'
          AND (mc.soma_meta IS NOT NULL OR vc.soma_vendas IS NOT NULL)
    ),
    avg_vendas AS (SELECT AVG(vd) AS media FROM dados)
    SELECT 
        d.for_codigo::INTEGER,
        d.for_nomered::VARCHAR,
        d.mt::NUMERIC,
        d.vd::NUMERIC,
        d.perc::NUMERIC,
        d.vd::NUMERIC,
        CASE 
            WHEN d.perc >= 100 AND d.vd >= av.media THEN 'Q1: Alta Meta + Alto Valor'
            WHEN d.perc >= 100 AND d.vd < av.media THEN 'Q2: Alta Meta + Baixo Valor'
            WHEN d.perc < 100 AND d.vd >= av.media THEN 'Q3: Baixa Meta + Alto Valor'
            ELSE 'Q4: Baixa Meta + Baixo Valor'
        END::VARCHAR,
        CASE 
            WHEN d.perc < 70 THEN 'CRÍTICO'
            WHEN d.perc < 90 THEN 'ATENÇÃO'
            WHEN d.perc >= 100 THEN 'OK'
            ELSE 'MONITORAR'
        END::VARCHAR
    FROM dados d
    CROSS JOIN avg_vendas av
    ORDER BY d.perc ASC, d.vd DESC;
$$;

-- =====================================================
-- FUNÇÃO 8: STATUS DAS INDÚSTRIAS (CORRIGIDA)
-- =====================================================
DROP FUNCTION IF EXISTS fn_metas_status_industrias(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_status_industrias(
    p_ano INTEGER,
    p_mes_ate INTEGER DEFAULT 12,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    meta_total NUMERIC,
    atual NUMERIC,
    percentual_meta NUMERIC,
    saldo NUMERIC,
    status VARCHAR,
    tendencia VARCHAR
) 
LANGUAGE sql
AS $$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1 AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_periodo AS (
        SELECT ped_industria, SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    vendas_mes_ant AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) = GREATEST($2 - 1, 1)
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    vendas_mes_atu AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) = $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo::INTEGER,
        f.for_nomered::VARCHAR,
        COALESCE(mc.soma_meta, 0)::NUMERIC,
        COALESCE(vp.soma_vendas, 0)::NUMERIC,
        CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(vp.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
        END::NUMERIC,
        (COALESCE(mc.soma_meta, 0) - COALESCE(vp.soma_vendas, 0))::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta THEN 'Atingida'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta * 0.80 THEN 'Em Risco'
            ELSE 'Abaixo'
        END::VARCHAR,
        CASE 
            WHEN COALESCE(vmu.total, 0) > COALESCE(vma.total, 0) * 1.05 THEN '↗'
            WHEN COALESCE(vmu.total, 0) < COALESCE(vma.total, 0) * 0.95 THEN '↘'
            ELSE '→'
        END::VARCHAR
    FROM fornecedores f
    LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
    LEFT JOIN vendas_periodo vp ON vp.ped_industria = f.for_codigo
    LEFT JOIN vendas_mes_ant vma ON vma.ped_industria = f.for_codigo
    LEFT JOIN vendas_mes_atu vmu ON vmu.ped_industria = f.for_codigo
    WHERE ($3 IS NULL OR f.for_codigo = $3)
      AND f.for_tipo2 <> 'I'
      AND (mc.soma_meta IS NOT NULL OR vp.soma_vendas IS NOT NULL)
    ORDER BY 
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta THEN 'Atingida'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta * 0.80 THEN 'Em Risco'
            ELSE 'Abaixo'
        END,
        CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
             ELSE (COALESCE(vp.soma_vendas, 0) / mc.soma_meta * 100)
        END DESC;
$$;

-- =====================================================
-- FIM DO SCRIPT - 8 FUNÇÕES CORRIGIDAS
-- =====================================================
-- Teste:
-- SELECT * FROM fn_metas_resumo_geral(2025, 12, NULL);
-- SELECT * FROM fn_metas_atingimento_industria(2025, 12, NULL);
-- =====================================================
