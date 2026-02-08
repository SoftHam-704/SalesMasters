
-- Final fix for get_dashboard_metrics to support 3 arguments and industry filtering
-- This version merges the logic from both previous scripts to ensure compatibility

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing versions of get_dashboard_metrics in all relevant schemas
    FOR r IN (
        SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_dashboard_metrics'
          AND n.nspname IN ('public', 'brasil_wl', 'ro_consult', 'target', 'somarep', 'soma')
    ) 
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION ' || r.nspname || '.' || r.proname || '(' || r.args || ') CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %.%(%)', r.nspname, r.proname, r.args;
        END;
    END LOOP;
END $$;

-- 2. Create the MASTER version in public
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
    p_ano INTEGER, 
    p_mes INTEGER DEFAULT NULL,
    p_industria INTEGER DEFAULT NULL
)
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
    v_mes_int INTEGER;
BEGIN
    -- Handle mes = 0 or NULL
    v_mes_int := CASE WHEN p_mes = 0 THEN NULL ELSE p_mes END;

    -- Period definition
    IF v_mes_int IS NOT NULL AND v_mes_int > 0 THEN
        v_inicio_atual := TO_DATE(p_ano || '-' || v_mes_int || '-01', 'YYYY-MM-DD');
        v_fim_atual := (v_inicio_atual + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        v_inicio_anterior := (v_inicio_atual - INTERVAL '1 year')::DATE;
        v_fim_anterior := (v_inicio_anterior + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE
        v_inicio_atual := TO_DATE(p_ano || '-01-01', 'YYYY-MM-DD');
        v_fim_atual := TO_DATE(p_ano || '-12-31', 'YYYY-MM-DD');
        v_inicio_anterior := (v_inicio_atual - INTERVAL '1 year')::DATE;
        v_fim_anterior := (v_fim_atual - INTERVAL '1 year')::DATE;
    END IF;

    -- Current Metrics
    SELECT 
        COALESCE(SUM(p.ped_totliq), 0), 
        COUNT(DISTINCT p.ped_cliente), 
        COUNT(DISTINCT p.ped_pedido)
    INTO v_total_atual, v_cli_atual, v_ped_atual
    FROM pedidos p
    WHERE p.ped_data BETWEEN v_inicio_atual AND v_fim_atual 
      AND p.ped_situacao <> 'C'
      AND (p_industria IS NULL OR p_industria = 0 OR p.ped_industria = p_industria);

    -- Current Quantity (from items)
    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_qtd_atual
    FROM itens_ped i
    JOIN pedidos p ON p.ped_pedido = i.ite_pedido
    WHERE p.ped_data BETWEEN v_inicio_atual AND v_fim_atual 
      AND p.ped_situacao <> 'C'
      AND (p_industria IS NULL OR p_industria = 0 OR p.ped_industria = p_industria);

    -- Previous Metrics
    SELECT 
        COALESCE(SUM(p.ped_totliq), 0), 
        COUNT(DISTINCT p.ped_cliente), 
        COUNT(DISTINCT p.ped_pedido)
    INTO v_total_anterior, v_cli_anterior, v_ped_anterior
    FROM pedidos p
    WHERE p.ped_data BETWEEN v_inicio_anterior AND v_fim_anterior 
      AND p.ped_situacao <> 'C'
      AND (p_industria IS NULL OR p_industria = 0 OR p.ped_industria = p_industria);

    -- Previous Quantity
    SELECT COALESCE(SUM(i.ite_quant), 0)
    INTO v_qtd_anterior
    FROM itens_ped i
    JOIN pedidos p ON p.ped_pedido = i.ite_pedido
    WHERE p.ped_data BETWEEN v_inicio_anterior AND v_fim_anterior 
      AND p.ped_situacao <> 'C'
      AND (p_industria IS NULL OR p_industria = 0 OR p.ped_industria = p_industria);

    RETURN QUERY SELECT 
        COALESCE(v_total_atual, 0.0),
        CASE WHEN COALESCE(v_total_anterior, 0) > 0 THEN ((v_total_atual - v_total_anterior) / v_total_anterior) * 100.0 ELSE 0.0 END,
        COALESCE(v_qtd_atual, 0.0),
        CASE WHEN COALESCE(v_qtd_anterior, 0) > 0 THEN ((v_qtd_atual - v_qtd_anterior) / v_qtd_anterior) * 100.0 ELSE 0.0 END,
        COALESCE(v_cli_atual, 0::bigint),
        CASE WHEN COALESCE(v_cli_anterior, 0) > 0 THEN ((v_cli_atual - v_cli_anterior)::DOUBLE PRECISION / v_cli_anterior) * 100.0 ELSE 0.0 END,
        COALESCE(v_ped_atual, 0::bigint),
        CASE WHEN COALESCE(v_ped_anterior, 0) > 0 THEN ((v_ped_atual - v_ped_anterior)::DOUBLE PRECISION / v_ped_anterior) * 100.0 ELSE 0.0 END;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply to all schemas
DO $$ 
DECLARE 
    schema_name TEXT;
BEGIN
    FOR schema_name IN SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast') LOOP
        -- Skip if it's the public schema because it's already created
        IF schema_name = 'public' THEN CONTINUE; END IF;
        
        -- Create a wrapper function in each schema that calls the public version
        -- This ensures that when called without schema qualification, it uses the correct search_path behavior
        -- Actually, it's better to just create the same function in each schema to avoid cross-schema permission issues if any
        EXECUTE format('
            CREATE OR REPLACE FUNCTION %I.get_dashboard_metrics(
                p_ano INTEGER, 
                p_mes INTEGER DEFAULT NULL,
                p_industria INTEGER DEFAULT NULL
            )
            RETURNS TABLE (
                total_vendido_current DOUBLE PRECISION,
                vendas_percent_change DOUBLE PRECISION,
                quantidade_vendida_current DOUBLE PRECISION,
                quantidade_percent_change DOUBLE PRECISION,
                clientes_atendidos_current BIGINT,
                clientes_percent_change DOUBLE PRECISION,
                total_pedidos_current BIGINT,
                pedidos_percent_change DOUBLE PRECISION
            ) AS $func$
            BEGIN
                RETURN QUERY SELECT * FROM public.get_dashboard_metrics(p_ano, p_mes, p_industria);
            END;
            $func$ LANGUAGE plpgsql;', schema_name);
    END LOOP;
END $$;
