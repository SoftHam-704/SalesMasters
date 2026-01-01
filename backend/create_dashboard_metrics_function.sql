-- Function to get general dashboard metrics (no industry filter)
-- Similar to order form metrics but aggregated across all data

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    p_year INTEGER,
    p_month INTEGER DEFAULT NULL,
    p_industry_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    -- Current Period
    total_vendido_current NUMERIC,
    quantidade_vendida_current NUMERIC,
    clientes_atendidos_current INTEGER,
    qtd_pedidos_current INTEGER,
    
    -- Previous Period (for comparison)
    total_vendido_previous NUMERIC,
    quantidade_vendida_previous NUMERIC,
    clientes_atendidos_previous INTEGER,
    qtd_pedidos_previous INTEGER,
    
    -- Calculated Changes (%)
    vendas_percent_change NUMERIC,
    quantidade_percent_change NUMERIC,
    clientes_percent_change NUMERIC,
    pedidos_percent_change NUMERIC
) AS $$
DECLARE
    v_current_start_date DATE;
    v_current_end_date DATE;
    v_previous_start_date DATE;
    v_previous_end_date DATE;
BEGIN
    -- Calculate date ranges
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
    WITH current_metrics AS (
        SELECT 
            COALESCE(SUM(i.ite_totliquido), 0)::NUMERIC as total_vendido,
            COALESCE(SUM(i.ite_quant), 0)::NUMERIC as quantidade_vendida,
            COUNT(DISTINCT p.ped_cliente)::INTEGER as clientes_atendidos,
            COUNT(DISTINCT p.ped_pedido)::INTEGER as qtd_pedidos
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_current_start_date
          AND p.ped_data <= v_current_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
    ),
    previous_metrics AS (
        SELECT 
            COALESCE(SUM(i.ite_totliquido), 0)::NUMERIC as total_vendido,
            COALESCE(SUM(i.ite_quant), 0)::NUMERIC as quantidade_vendida,
            COUNT(DISTINCT p.ped_cliente)::INTEGER as clientes_atendidos,
            COUNT(DISTINCT p.ped_pedido)::INTEGER as qtd_pedidos
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_previous_start_date
          AND p.ped_data <= v_previous_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
    )
    SELECT 
        -- Current
        c.total_vendido,
        c.quantidade_vendida,
        c.clientes_atendidos,
        c.qtd_pedidos,
        
        -- Previous
        prev.total_vendido,
        prev.quantidade_vendida,
        prev.clientes_atendidos,
        prev.qtd_pedidos,
        
        -- Changes (%)
        CASE 
            WHEN prev.total_vendido = 0 THEN 
                CASE WHEN c.total_vendido > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((c.total_vendido - prev.total_vendido) / prev.total_vendido * 100)::NUMERIC
        END as vendas_percent_change,
        
        CASE 
            WHEN prev.quantidade_vendida = 0 THEN 
                CASE WHEN c.quantidade_vendida > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((c.quantidade_vendida - prev.quantidade_vendida) / prev.quantidade_vendida * 100)::NUMERIC
        END as quantidade_percent_change,
        
        CASE 
            WHEN prev.clientes_atendidos = 0 THEN 
                CASE WHEN c.clientes_atendidos > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((c.clientes_atendidos - prev.clientes_atendidos)::NUMERIC / prev.clientes_atendidos * 100)::NUMERIC
        END as clientes_percent_change,
        
        CASE 
            WHEN prev.qtd_pedidos = 0 THEN 
                CASE WHEN c.qtd_pedidos > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((c.qtd_pedidos - prev.qtd_pedidos)::NUMERIC / prev.qtd_pedidos * 100)::NUMERIC
        END as pedidos_percent_change
    FROM current_metrics c, previous_metrics prev;
END;
$$ LANGUAGE plpgsql;
