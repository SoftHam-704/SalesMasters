CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_year integer, p_month integer)
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
    -- Variáveis para o período atual
    v_total_vendido_curr numeric := 0;
    v_quantidade_curr numeric := 0;
    v_clientes_curr bigint := 0;
    v_pedidos_curr bigint := 0;
    
    -- Variáveis para o período anterior (comparativo)
    v_total_vendido_prev numeric := 0;
    v_quantidade_prev numeric := 0;
    v_clientes_prev bigint := 0;
    v_pedidos_prev bigint := 0;
    
    -- Datas de referência
    v_date_start date;
    v_date_end date;
    v_prev_start date;
    v_prev_end date;
BEGIN
    -- Definir datas do período atual
    IF p_month IS NULL OR p_month = 0 THEN
        v_date_start := make_date(p_year, 1, 1);
        v_date_end := make_date(p_year, 12, 31);
        v_prev_start := make_date(p_year - 1, 1, 1);
        v_prev_end := make_date(p_year - 1, 12, 31);
    ELSE
        v_date_start := make_date(p_year, p_month, 1);
        v_date_end := (v_date_start + interval '1 month' - interval '1 day')::date;
        v_prev_start := (v_date_start - interval '1 month')::date;
        v_prev_end := (v_date_start - interval '1 day')::date;
    END IF;

    -- 1. CÁLCULO DO PERÍODO ATUAL (Sem JOIN com itens para o Valor)
    SELECT 
        COALESCE(SUM(ped_totliq), 0),
        COUNT(DISTINCT ped_cliente),
        COUNT(ped_pedido)
    INTO v_total_vendido_curr, v_clientes_curr, v_pedidos_curr
    FROM public.pedidos
    WHERE ped_data BETWEEN v_date_start AND v_date_end
      AND ped_situacao <> 'C';

    -- Quantidade do período atual (Usa Pedidos para filtrar, mas soma Itens)
    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_quantidade_curr
    FROM public.itens_ped i
    JOIN public.pedidos p ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data BETWEEN v_date_start AND v_date_end
      AND p.ped_situacao <> 'C';

    -- 2. CÁLCULO DO PERÍODO ANTERIOR
    SELECT 
        COALESCE(SUM(ped_totliq), 0),
        COUNT(DISTINCT ped_cliente),
        COUNT(ped_pedido)
    INTO v_total_vendido_prev, v_clientes_prev, v_pedidos_prev
    FROM public.pedidos
    WHERE ped_data BETWEEN v_prev_start AND v_prev_end
      AND ped_situacao <> 'C';

    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_quantidade_prev
    FROM public.itens_ped i
    JOIN public.pedidos p ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data BETWEEN v_prev_start AND v_prev_end
      AND p.ped_situacao <> 'C';

    -- 3. RETORNO DOS DADOS COM CÁLCULO DE PERCENTUAL
    RETURN QUERY SELECT 
        v_total_vendido_curr,
        CASE WHEN v_total_vendido_prev > 0 THEN ((v_total_vendido_curr - v_total_vendido_prev) / v_total_vendido_prev * 100) ELSE 0 END,
        v_quantidade_curr,
        CASE WHEN v_quantidade_prev > 0 THEN ((v_quantidade_curr - v_quantidade_prev) / v_quantidade_prev * 100) ELSE 0 END,
        v_clientes_curr,
        CASE WHEN v_clientes_prev > 0 THEN ((v_clientes_curr::numeric - v_clientes_prev::numeric) / v_clientes_prev::numeric * 100) ELSE 0 END,
        v_pedidos_curr,
        CASE WHEN v_pedidos_prev > 0 THEN ((v_pedidos_curr::numeric - v_pedidos_prev::numeric) / v_pedidos_prev::numeric * 100) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Dropar funções antigas (cascata de schemas) para garantir que a nova versão pública seja soberana
DROP FUNCTION IF EXISTS public.get_dashboard_metrics(integer, integer, integer);
DROP FUNCTION IF EXISTS brasil_wl.get_dashboard_metrics(integer, integer);
DROP FUNCTION IF EXISTS ro_consult.get_dashboard_metrics(integer, integer);
DROP FUNCTION IF EXISTS target.get_dashboard_metrics(integer, integer);

-- Recriar wrappers para multitenancy
CREATE OR REPLACE FUNCTION brasil_wl.get_dashboard_metrics(p_year integer, p_month integer) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION ro_consult.get_dashboard_metrics(p_year integer, p_month integer) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION target.get_dashboard_metrics(p_year integer, p_month integer) RETURNS SETOF record AS $$ SELECT * FROM public.get_dashboard_metrics($1, $2); $$ LANGUAGE sql;
