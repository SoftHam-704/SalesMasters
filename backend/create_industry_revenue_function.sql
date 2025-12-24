-- Function to get revenue by industry for dashboard
CREATE OR REPLACE FUNCTION get_industry_revenue(
    p_ano INTEGER,
    p_mes INTEGER DEFAULT NULL
)
RETURNS TABLE (
    industria_id INTEGER,
    industria_nome VARCHAR,
    total_faturamento NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.for_codigo AS industria_id,
        f.for_nomered AS industria_nome,
        COALESCE(SUM(p.ped_totliq), 0) AS total_faturamento
    FROM 
        fornecedores f
    LEFT JOIN 
        pedidos p ON f.for_codigo = p.ped_industria
        AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
        AND p.ped_situacao IN ('P', 'F') -- Only confirmed orders and invoiced
    WHERE 
        f.tipo_tipo2 = 'A' -- Only active industries
    GROUP BY 
        f.for_codigo, f.for_nomered
    ORDER BY 
        total_faturamento DESC;
END;
$$ LANGUAGE plpgsql;
