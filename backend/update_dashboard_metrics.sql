-- 1. LIMPEZA TOTAL (Remove qualquer versão anterior em todos os schemas)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_dashboard_metrics'
          AND n.nspname IN ('public', 'brasil_wl', 'ro_consult', 'target')
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.nspname || '.' || r.proname || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- 2. CRIAR VERSÃO ÚNICA NO PUBLIC
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_ano INTEGER, p_mes INTEGER)
RETURNS TABLE (
    total_vendido_current DOUBLE PRECISION,
    vendas_percent_change DOUBLE PRECISION,
    quantidade_vendida_current DOUBLE PRECISION,
    quantidade_percent_change DOUBLE PRECISION,
    clientes_atendidos_current BIGINT,
    clientes_percent_change DOUBLE PRECISION,
    total_pedidos_current BIGINT,
    pedidos_percent_change DOUBLE PRECISION
) AS $$
DECLARE
    v_inicio_atual DATE; v_fim_atual DATE; v_inicio_anterior DATE; v_fim_anterior DATE;
    v_total_atual DOUBLE PRECISION; v_total_anterior DOUBLE PRECISION;
    v_qtd_atual DOUBLE PRECISION; v_qtd_anterior DOUBLE PRECISION;
    v_cli_atual BIGINT; v_cli_anterior BIGINT;
    v_ped_atual BIGINT; v_ped_anterior BIGINT;
BEGIN
    -- Definição dos períodos
    IF p_mes IS NOT NULL AND p_mes > 0 THEN
        v_inicio_atual := TO_DATE(p_ano || '-' || p_mes || '-01', 'YYYY-MM-DD');
        v_fim_atual := (v_inicio_atual + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        v_inicio_anterior := (v_inicio_atual - INTERVAL '1 year')::DATE;
        v_fim_anterior := (v_inicio_anterior + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
        v_inicio_atual := TO_DATE(p_ano || '-01-01', 'YYYY-MM-DD');
        v_fim_atual := TO_DATE(p_ano || '-12-31', 'YYYY-MM-DD');
        v_inicio_anterior := (v_inicio_atual - INTERVAL '1 year')::DATE;
        v_fim_anterior := (v_fim_atual - INTERVAL '1 year')::DATE;
    END IF;

    -- Query de dados Atuais (Valor Líquido, Clientes Atendidos, Total de Pedidos)
    SELECT 
        COALESCE(SUM(ped_totliq), 0), 
        COUNT(DISTINCT ped_cliente), 
        COUNT(ped_pedido)
    INTO v_total_atual, v_cli_atual, v_ped_atual
    FROM pedidos 
    WHERE ped_data BETWEEN v_inicio_atual AND v_fim_atual AND ped_situacao <> 'C';

    -- Query de Quantidade Atual (Soma do ite_quant da itens_ped)
    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_qtd_atual
    FROM itens_ped i
    JOIN pedidos p ON p.ped_pedido = i.ite_pedido
    WHERE p.ped_data BETWEEN v_inicio_atual AND v_fim_atual AND p.ped_situacao <> 'C';

    -- Query de dados Anteriores
    SELECT 
        COALESCE(SUM(ped_totliq), 0), 
        COUNT(DISTINCT ped_cliente), 
        COUNT(ped_pedido)
    INTO v_total_anterior, v_cli_anterior, v_ped_anterior
    FROM pedidos 
    WHERE ped_data BETWEEN v_inicio_anterior AND v_fim_anterior AND ped_situacao <> 'C';

    -- Query de Quantidade Anterior
    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_qtd_anterior
    FROM itens_ped i
    JOIN pedidos p ON p.ped_pedido = i.ite_pedido
    WHERE p.ped_data BETWEEN v_inicio_anterior AND v_fim_anterior AND p.ped_situacao <> 'C';

    RETURN QUERY SELECT 
        v_total_atual,
        CASE WHEN v_total_anterior > 0 THEN ((v_total_atual - v_total_anterior) / v_total_anterior) * 100.0 ELSE 0.0 END,
        v_qtd_atual,
        CASE WHEN v_qtd_anterior > 0 THEN ((v_qtd_atual - v_qtd_anterior) / v_qtd_anterior) * 100.0 ELSE 0.0 END,
        v_cli_atual,
        CASE WHEN v_cli_anterior > 0 THEN ((v_cli_atual - v_cli_anterior) / v_cli_anterior::FLOAT) * 100.0 ELSE 0.0 END,
        v_ped_atual,
        CASE WHEN v_ped_anterior > 0 THEN ((v_ped_atual - v_ped_anterior) / v_ped_anterior::FLOAT) * 100.0 ELSE 0.0 END;
END;
$$ LANGUAGE plpgsql;

-- 3. REPLICAR PARA OS OUTROS SCHEMAS
CREATE OR REPLACE FUNCTION brasil_wl.get_dashboard_metrics(p_ano INTEGER, p_mes INTEGER) 
RETURNS TABLE (total_vendido_current DOUBLE PRECISION, vendas_percent_change DOUBLE PRECISION, quantidade_vendida_current DOUBLE PRECISION, quantidade_percent_change DOUBLE PRECISION, clientes_atendidos_current BIGINT, clientes_percent_change DOUBLE PRECISION, total_pedidos_current BIGINT, pedidos_percent_change DOUBLE PRECISION) 
AS 'SELECT * FROM public.get_dashboard_metrics($1::integer, $2::integer)' LANGUAGE SQL;

CREATE OR REPLACE FUNCTION ro_consult.get_dashboard_metrics(p_ano INTEGER, p_mes INTEGER) 
RETURNS TABLE (total_vendido_current DOUBLE PRECISION, vendas_percent_change DOUBLE PRECISION, quantidade_vendida_current DOUBLE PRECISION, quantidade_percent_change DOUBLE PRECISION, clientes_atendidos_current BIGINT, clientes_percent_change DOUBLE PRECISION, total_pedidos_current BIGINT, pedidos_percent_change DOUBLE PRECISION) 
AS 'SELECT * FROM public.get_dashboard_metrics($1::integer, $2::integer)' LANGUAGE SQL;

CREATE OR REPLACE FUNCTION target.get_dashboard_metrics(p_ano INTEGER, p_mes INTEGER) 
RETURNS TABLE (total_vendido_current DOUBLE PRECISION, vendas_percent_change DOUBLE PRECISION, quantidade_vendida_current DOUBLE PRECISION, quantidade_percent_change DOUBLE PRECISION, clientes_atendidos_current BIGINT, clientes_percent_change DOUBLE PRECISION, total_pedidos_current BIGINT, pedidos_percent_change DOUBLE PRECISION) 
AS 'SELECT * FROM public.get_dashboard_metrics($1::integer, $2::integer)' LANGUAGE SQL;
