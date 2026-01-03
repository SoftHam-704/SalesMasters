-- FUNÇÃO 9: ANÁLISE SEMANAL PIVOTADA (CORRIGIDA)
DROP FUNCTION IF EXISTS fn_metas_analise_semanal_pivot(INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_metas_analise_semanal_pivot(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_metas_analise_semanal_pivot(
    p_ano INTEGER,
    p_mes INTEGER,
    p_industria INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_codigo INTEGER,
    industria_nome VARCHAR,
    semana_1 NUMERIC,
    semana_2 NUMERIC,
    semana_3 NUMERIC,
    semana_4 NUMERIC,
    total NUMERIC
) 
LANGUAGE sql
AS $$
    WITH vendas_semanal AS (
        SELECT 
            ped_industria,
            CASE 
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 7 THEN 1
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 14 THEN 2
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 21 THEN 3
                ELSE 4
            END AS semana,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria, semana
    ),
    pivot AS (
        SELECT 
            f.for_codigo,
            f.for_nomered,
            COALESCE(SUM(CASE WHEN vs.semana = 1 THEN vs.total ELSE 0 END), 0) AS s1,
            COALESCE(SUM(CASE WHEN vs.semana = 2 THEN vs.total ELSE 0 END), 0) AS s2,
            COALESCE(SUM(CASE WHEN vs.semana = 3 THEN vs.total ELSE 0 END), 0) AS s3,
            COALESCE(SUM(CASE WHEN vs.semana = 4 THEN vs.total ELSE 0 END), 0) AS s4
        FROM fornecedores f
        LEFT JOIN vendas_semanal vs ON vs.ped_industria = f.for_codigo
        WHERE f.for_tipo2 <> 'I' -- Apenas indústrias ativas
          AND (p_industria IS NULL OR f.for_codigo = p_industria)
        GROUP BY f.for_codigo, f.for_nomered
    )
    SELECT 
        for_codigo::INTEGER,
        for_nomered::VARCHAR,
        s1::NUMERIC,
        s2::NUMERIC,
        s3::NUMERIC,
        s4::NUMERIC,
        (s1 + s2 + s3 + s4)::NUMERIC AS total
    FROM pivot
    ORDER BY total DESC;
$$;
