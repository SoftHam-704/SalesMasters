CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
    p_year integer, 
    p_month integer DEFAULT NULL, 
    p_industry_id integer DEFAULT NULL
)
RETURNS TABLE (
    total_vendido_current numeric,
    vendas_percent_change numeric,
    quantidade_vendida_current numeric,
    quantidade_percent_change numeric,
    clientes_atendidos_current bigint,
    clientes_percent_change numeric,
    total_pedidos_current bigint,
    pedidos_percent_change numeric
) AS $$
DECLARE
    v_current_start_date DATE;
    v_current_end_date DATE;
    v_previous_start_date DATE;
    v_previous_end_date DATE;
    
    -- Current Period
    v_total_curr numeric := 0;
    v_qty_curr numeric := 0;
    v_cli_curr bigint := 0;
    v_ped_curr bigint := 0;
    
    -- Previous Period
    v_total_prev numeric := 0;
    v_qty_prev numeric := 0;
    v_cli_prev bigint := 0;
    v_ped_prev bigint := 0;
BEGIN
    -- 1. Definição dos Períodos (Lógica idêntica ao LOCAL)
    IF p_month IS NULL OR p_month = 0 THEN
        v_current_start_date := make_date(p_year, 1, 1);
        v_current_end_date := make_date(p_year, 12, 31);
        v_previous_start_date := make_date(p_year - 1, 1, 1);
        v_previous_end_date := make_date(p_year - 1, 12, 31);
    ELSE
        v_current_start_date := make_date(p_year, p_month, 1);
        v_current_end_date := (v_current_start_date + INTERVAL '1 month - 1 day')::DATE;
        
        -- Mês anterior
        IF p_month = 1 THEN
            v_previous_start_date := make_date(p_year - 1, 12, 1);
            v_previous_end_date := make_date(p_year - 1, 12, 31);
        ELSE
            v_previous_start_date := make_date(p_year, p_month - 1, 1);
            v_previous_end_date := (v_previous_start_date + INTERVAL '1 month - 1 day')::DATE;
        END IF;
    END IF;

    -- 2. Métricas do Período Atual (Usando ite_totliquido dos itens para precisão)
    SELECT
        COALESCE(SUM(i.ite_totliquido), 0),
        COALESCE(SUM(i.ite_quant), 0),
        COUNT(DISTINCT p.ped_cliente),
        COUNT(DISTINCT p.ped_pedido)
    INTO v_total_curr, v_qty_curr, v_cli_curr, v_ped_curr
    FROM pedidos p
    LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data >= v_current_start_date
      AND p.ped_data <= v_current_end_date
      AND p.ped_situacao IN ('P', 'F')
      AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id);

    -- 3. Métricas do Período Anterior 
    SELECT
        COALESCE(SUM(i.ite_totliquido), 0),
        COALESCE(SUM(i.ite_quant), 0),
        COUNT(DISTINCT p.ped_cliente),
        COUNT(DISTINCT p.ped_pedido)
    INTO v_total_prev, v_qty_prev, v_cli_prev, v_ped_prev
    FROM pedidos p
    LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data >= v_previous_start_date
      AND p.ped_data <= v_previous_end_date
      AND p.ped_situacao IN ('P', 'F')
      AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id);

    -- 4. Cálculo de Variações e Retorno Final
    RETURN QUERY SELECT
        v_total_curr,
        CASE WHEN v_total_prev > 0 THEN ((v_total_curr - v_total_prev) / v_total_prev * 100) ELSE 0 END,
        v_qty_curr,
        CASE WHEN v_qty_prev > 0 THEN ((v_qty_curr - v_qty_prev) / v_qty_prev * 100) ELSE 0 END,
        v_cli_curr,
        CASE WHEN v_cli_prev > 0 THEN ((v_cli_curr::numeric - v_cli_prev::numeric) / v_cli_prev::numeric * 100) ELSE 0 END,
        v_ped_curr,
        CASE WHEN v_ped_prev > 0 THEN ((v_ped_curr::numeric - v_ped_prev::numeric) / v_ped_prev::numeric * 100) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Limpeza de Versões em outros Schemas para garantir que o Public seja o mestre
DROP FUNCTION IF EXISTS public.get_dashboard_metrics(integer, integer); -- Drop 2-param version
DROP FUNCTION IF EXISTS brasil_wl.get_dashboard_metrics(integer, integer);
DROP FUNCTION IF EXISTS ro_consult.get_dashboard_metrics(integer, integer);
DROP FUNCTION IF EXISTS target.get_dashboard_metrics(integer, integer);
DROP FUNCTION IF EXISTS brasil_wl.get_dashboard_metrics(integer, integer, integer);
DROP FUNCTION IF EXISTS ro_consult.get_dashboard_metrics(integer, integer, integer);
DROP FUNCTION IF EXISTS target.get_dashboard_metrics(integer, integer, integer);

-- Wrappers para os Schemas (agora com 3 parâmetros)
CREATE OR REPLACE FUNCTION brasil_wl.get_dashboard_metrics(p_year integer, p_month integer DEFAULT NULL, p_ind integer DEFAULT NULL) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2, $3); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION ro_consult.get_dashboard_metrics(p_year integer, p_month integer DEFAULT NULL, p_ind integer DEFAULT NULL) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2, $3); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION target.get_dashboard_metrics(p_year integer, p_month integer DEFAULT NULL, p_ind integer DEFAULT NULL) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2, $3); $$ LANGUAGE sql;
