-- Function to get sales performance metrics by seller with MoM comparison
-- This function calculates sales values, quantities, and client counts for sellers
-- comparing current period with previous period (Month-over-Month)

CREATE OR REPLACE FUNCTION get_sales_performance(
    p_year INTEGER,
    p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
    ven_codigo INTEGER,
    ven_nome VARCHAR,
    total_value_current NUMERIC,
    total_value_previous NUMERIC,
    mom_value_percent NUMERIC,
    total_qty_current NUMERIC,
    total_qty_previous NUMERIC,
    mom_qty_percent NUMERIC,
    clients_previous INTEGER,
    clients_current INTEGER
) AS $$
DECLARE
    v_current_start_date DATE;
    v_current_end_date DATE;
    v_previous_start_date DATE;
    v_previous_end_date DATE;
BEGIN
    -- Calculate date ranges based on parameters
    IF p_month IS NULL THEN
        -- Full year comparison
        v_current_start_date := make_date(p_year, 1, 1);
        v_current_end_date := make_date(p_year, 12, 31);
        v_previous_start_date := make_date(p_year - 1, 1, 1);
        v_previous_end_date := make_date(p_year - 1, 12, 31);
    ELSE
        -- Month comparison
        v_current_start_date := make_date(p_year, p_month, 1);
        v_current_end_date := (v_current_start_date + INTERVAL '1 month - 1 day')::DATE;
        
        -- Previous month (handle year rollover)
        IF p_month = 1 THEN
            v_previous_start_date := make_date(p_year - 1, 12, 1);
            v_previous_end_date := make_date(p_year - 1, 12, 31);
        ELSE
            v_previous_start_date := make_date(p_year, p_month - 1, 1);
            v_previous_end_date := (v_previous_start_date + INTERVAL '1 month - 1 day')::DATE;
        END IF;
    END IF;

    RETURN QUERY
    WITH current_period AS (
        SELECT 
            p.ped_vendedor,
            COALESCE(SUM(i.ite_totliquido), 0) as total_value,
            COALESCE(SUM(i.ite_quant), 0) as total_qty,
            COUNT(DISTINCT p.ped_cliente) as unique_clients
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_current_start_date
          AND p.ped_data <= v_current_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_vendedor IS NOT NULL
        GROUP BY p.ped_vendedor
    ),
    previous_period AS (
        SELECT 
            p.ped_vendedor,
            COALESCE(SUM(i.ite_totliquido), 0) as total_value,
            COALESCE(SUM(i.ite_quant), 0) as total_qty,
            COUNT(DISTINCT p.ped_cliente) as unique_clients
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_previous_start_date
          AND p.ped_data <= v_previous_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_vendedor IS NOT NULL
        GROUP BY p.ped_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        COALESCE(cp.total_value, 0)::NUMERIC as total_value_current,
        COALESCE(pp.total_value, 0)::NUMERIC as total_value_previous,
        CASE 
            WHEN COALESCE(pp.total_value, 0) = 0 THEN 
                CASE WHEN COALESCE(cp.total_value, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((COALESCE(cp.total_value, 0) - COALESCE(pp.total_value, 0)) / COALESCE(pp.total_value, 1) * 100)::NUMERIC
        END as mom_value_percent,
        COALESCE(cp.total_qty, 0)::NUMERIC as total_qty_current,
        COALESCE(pp.total_qty, 0)::NUMERIC as total_qty_previous,
        CASE 
            WHEN COALESCE(pp.total_qty, 0) = 0 THEN 
                CASE WHEN COALESCE(cp.total_qty, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((COALESCE(cp.total_qty, 0) - COALESCE(pp.total_qty, 0)) / COALESCE(pp.total_qty, 1) * 100)::NUMERIC
        END as mom_qty_percent,
        COALESCE(pp.unique_clients, 0)::INTEGER as clients_previous,
        COALESCE(cp.unique_clients, 0)::INTEGER as clients_current
    FROM vendedores v
    LEFT JOIN current_period cp ON v.ven_codigo = cp.ped_vendedor
    LEFT JOIN previous_period pp ON v.ven_codigo = pp.ped_vendedor
    WHERE COALESCE(cp.total_value, 0) > 0 OR COALESCE(pp.total_value, 0) > 0
    ORDER BY COALESCE(cp.total_value, 0) DESC;
END;
$$ LANGUAGE plpgsql;
