const { masterPool } = require('./utils/db');

const sql = `
DO $$ 
DECLARE 
    schema_name TEXT;
    r RECORD;
BEGIN
    -- 1. ATUALIZA AS FUNÇÕES MESTRE NO SCHEMA PUBLIC
    
    -- Vendas Mensais
    CREATE OR REPLACE FUNCTION public.fn_comparacao_vendas_mensais(p_ano_atual integer, p_ano_anterior integer, p_industria integer DEFAULT NULL)
    RETURNS TABLE(mes integer, mes_nome character varying, vendas_ano_atual numeric, vendas_ano_anterior numeric) LANGUAGE plpgsql AS $f$
    BEGIN
        RETURN QUERY
        WITH meses AS (
            SELECT m as mes,
                   CASE m
                     WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
                     WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
                     WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
                     WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
                   END::varchar as mes_nome
            FROM generate_series(1, 12) m
        )
        SELECT m.mes, m.mes_nome,
            COALESCE((SELECT SUM(ped_totliq) FROM public.pedidos WHERE EXTRACT(YEAR FROM ped_data) = p_ano_atual AND EXTRACT(MONTH FROM ped_data) = m.mes AND ped_situacao IN ('P', 'F') AND ($3 IS NULL OR ped_industria = $3)), 0)::numeric as vendas_ano_atual,
            COALESCE((SELECT SUM(ped_totliq) FROM public.pedidos WHERE EXTRACT(YEAR FROM ped_data) = p_ano_anterior AND EXTRACT(MONTH FROM ped_data) = m.mes AND ped_situacao IN ('P', 'F') AND ($3 IS NULL OR ped_industria = $3)), 0)::numeric as vendas_ano_anterior
        FROM meses m ORDER BY m.mes;
    END; $f$;

    -- Quantidades Mensais
    CREATE OR REPLACE FUNCTION public.fn_comparacao_quantidades_mensais(p_ano_atual integer, p_ano_anterior integer, p_industria integer DEFAULT NULL)
    RETURNS TABLE(mes integer, mes_nome character varying, quantidade_ano_atual numeric, quantidade_ano_anterior numeric) LANGUAGE plpgsql AS $f$
    BEGIN
        RETURN QUERY
        WITH meses AS (
            SELECT m as mes,
                   CASE m
                     WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
                     WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
                     WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
                     WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
                   END::varchar as mes_nome
            FROM generate_series(1, 12) m
        )
        SELECT m.mes, m.mes_nome,
            COALESCE((SELECT SUM(ite_quant) FROM public.pedidos p JOIN public.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual AND EXTRACT(MONTH FROM p.ped_data) = m.mes AND p.ped_situacao IN ('P', 'F') AND ($3 IS NULL OR p.ped_industria = $3)), 0)::numeric as quantidade_ano_atual,
            COALESCE((SELECT SUM(ite_quant) FROM public.pedidos p JOIN public.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior AND EXTRACT(MONTH FROM p.ped_data) = m.mes AND p.ped_situacao IN ('P', 'F') AND ($3 IS NULL OR p.ped_industria = $3)), 0)::numeric as quantidade_ano_anterior
        FROM meses m ORDER BY m.mes;
    END; $f$;

    -- Performance de Vendedores
    CREATE OR REPLACE FUNCTION public.get_sales_performance_v2(p_year integer, p_month integer DEFAULT NULL, p_industria integer DEFAULT NULL)
    RETURNS TABLE(ven_codigo integer, ven_nome character varying, total_value_current numeric, total_value_previous numeric, mom_value_percent numeric, total_qty_current numeric, total_qty_previous numeric, mom_qty_percent numeric, clients_previous integer, clients_current integer) LANGUAGE plpgsql AS $f$
    DECLARE
        v_current_start_date DATE; v_current_end_date DATE; v_previous_start_date DATE; v_previous_end_date DATE;
    BEGIN
        IF p_month IS NULL OR p_month = 0 THEN
            v_current_start_date := make_date(p_year, 1, 1); v_current_end_date := make_date(p_year, 12, 31);
            v_previous_start_date := make_date(p_year - 1, 1, 1); v_previous_end_date := make_date(p_year - 1, 12, 31);
        ELSE
            v_current_start_date := make_date(p_year, p_month, 1); v_current_end_date := (v_current_start_date + INTERVAL '1 month - 1 day')::DATE;
            IF p_month = 1 THEN v_previous_start_date := make_date(p_year - 1, 12, 1); v_previous_end_date := make_date(p_year - 1, 12, 31);
            ELSE v_previous_start_date := make_date(p_year, p_month - 1, 1); v_previous_end_date := (v_previous_start_date + INTERVAL '1 month - 1 day')::DATE;
            END IF;
        END IF;
        RETURN QUERY
        WITH current_period AS (
            SELECT p.ped_vendedor, COALESCE(SUM(i.ite_totliquido), 0) as total_value, COALESCE(SUM(i.ite_quant), 0) as total_qty, COUNT(DISTINCT p.ped_cliente) as unique_clients
            FROM public.pedidos p LEFT JOIN public.itens_ped i ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_data >= v_current_start_date AND p.ped_data <= v_current_end_date AND p.ped_situacao IN ('P', 'F') AND p.ped_vendedor IS NOT NULL AND ($3 IS NULL OR p.ped_industria = $3)
            GROUP BY p.ped_vendedor
        ),
        previous_period AS (
            SELECT p.ped_vendedor, COALESCE(SUM(i.ite_totliquido), 0) as total_value, COALESCE(SUM(i.ite_quant), 0) as total_qty, COUNT(DISTINCT p.ped_cliente) as unique_clients
            FROM public.pedidos p LEFT JOIN public.itens_ped i ON i.ite_pedido = p.ped_pedido
            WHERE p.ped_data >= v_previous_start_date AND p.ped_data <= v_previous_end_date AND p.ped_situacao IN ('P', 'F') AND p.ped_vendedor IS NOT NULL AND ($3 IS NULL OR p.ped_industria = $3)
            GROUP BY p.ped_vendedor
        )
        SELECT v.ven_codigo, v.ven_nome, COALESCE(cp.total_value, 0)::NUMERIC, COALESCE(pp.total_value, 0)::NUMERIC,
            CASE WHEN COALESCE(pp.total_value, 0) = 0 THEN CASE WHEN COALESCE(cp.total_value, 0) > 0 THEN 100.0 ELSE 0.0 END ELSE ((COALESCE(cp.total_value, 0) - COALESCE(pp.total_value, 0)) / COALESCE(pp.total_value, 1) * 100)::NUMERIC END,
            COALESCE(cp.total_qty, 0)::NUMERIC, COALESCE(pp.total_qty, 0)::NUMERIC,
            CASE WHEN COALESCE(pp.total_qty, 0) = 0 THEN CASE WHEN COALESCE(cp.total_qty, 0) > 0 THEN 100.0 ELSE 0.0 END ELSE ((COALESCE(cp.total_qty, 0) - COALESCE(pp.total_qty, 0)) / COALESCE(pp.total_qty, 1) * 100)::NUMERIC END,
            COALESCE(pp.unique_clients, 0)::INTEGER, COALESCE(cp.unique_clients, 0)::INTEGER
        FROM public.vendedores v
        LEFT JOIN current_period cp ON v.ven_codigo = cp.ped_vendedor
        LEFT JOIN previous_period pp ON v.ven_codigo = pp.ped_vendedor
        WHERE COALESCE(cp.total_value, 0) > 0 OR COALESCE(pp.total_value, 0) > 0
        ORDER BY total_value_current DESC;
    END; $f$;

    -- Clientes MoM (Atual vs Anterior)
    CREATE OR REPLACE FUNCTION public.fn_clientes_mom(p_mes integer, p_ano integer, p_industria integer, p_ano_todo boolean, p_rede_lojas boolean)
    RETURNS TABLE(cliente_nome text, valor_prev numeric, qtd_prev numeric, valor_curr numeric, qtd_curr numeric, perc_valor numeric, perc_qtd numeric) LANGUAGE plpgsql AS $f$
    DECLARE
        v_data_ini_curr date; v_data_fim_curr date; v_data_ini_prev date; v_data_fim_prev date;
    BEGIN
        IF p_ano_todo THEN
            v_data_ini_curr := make_date(p_ano, 1, 1); v_data_fim_curr := make_date(p_ano, 12, 31);
            v_data_ini_prev := make_date(p_ano - 1, 1, 1); v_data_fim_prev := make_date(p_ano - 1, 12, 31);
        ELSE
            v_data_ini_curr := make_date(p_ano, p_mes, 1); v_data_fim_curr := (v_data_ini_curr + interval '1 month' - interval '1 day')::date;
            v_data_ini_prev := make_date(p_ano - 1, p_mes, 1); v_data_fim_prev := (v_data_ini_prev + interval '1 month' - interval '1 day')::date;
        END IF;
        RETURN QUERY
        WITH vendas AS (
            SELECT 
                CASE WHEN p_rede_lojas THEN COALESCE(NULLIF(c.cli_redeloja, ''), c.cli_nomred) ELSE c.cli_nomred END::text as cli_key,
                p.ped_data, p.ped_totliq, i.ite_quant
            FROM public.pedidos p
            JOIN public.itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            JOIN public.clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_industria = p_industria AND p.ped_situacao IN ('P', 'F')
              AND (p.ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr OR p.ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev)
        ),
        agrupado AS (
            SELECT cli_key,
                SUM(CASE WHEN ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev THEN ped_totliq ELSE 0 END)::numeric as v_prev,
                SUM(CASE WHEN ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev THEN ite_quant ELSE 0 END)::numeric as q_prev,
                SUM(CASE WHEN ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr THEN ped_totliq ELSE 0 END)::numeric as v_curr,
                SUM(CASE WHEN ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr THEN ite_quant ELSE 0 END)::numeric as q_curr
            FROM vendas GROUP BY cli_key
        )
        SELECT cli_key, v_prev, q_prev, v_curr, q_curr,
            CASE WHEN v_prev = 0 AND v_curr > 0 THEN 100.0 WHEN v_prev = 0 AND v_curr = 0 THEN 0.0 ELSE ROUND(((v_curr - v_prev) / v_prev) * 100.0, 2) END as p_valor,
            CASE WHEN q_prev = 0 AND q_curr > 0 THEN 100.0 WHEN q_prev = 0 AND q_curr = 0 THEN 0.0 ELSE ROUND(((q_curr - q_prev) / q_prev) * 100.0, 2) END as p_qtd
        FROM agrupado WHERE v_prev <> 0 OR v_curr <> 0 ORDER BY q_curr DESC, cli_key;
    END; $f$;

    -- 2. PERCORRE TODOS OS OUTROS SCHEMAS E CRIA WRAPPERS
    FOR schema_name IN SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public') LOOP
        
        -- Drop versões locais se existirem para evitar conflitos de tipos/assinaturas
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_vendas_mensais(integer, integer, integer)', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_quantidades_mensais(integer, integer, integer)', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.get_sales_performance_v2(integer, integer, integer)', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_clientes_mom(integer, integer, integer, boolean, boolean)', schema_name);

        -- Cria wrappers
        EXECUTE format('
            CREATE OR REPLACE FUNCTION %1$I.fn_comparacao_vendas_mensais(p1 integer, p2 integer, p3 integer DEFAULT NULL) 
            RETURNS TABLE(mes integer, mes_nome varchar, v1 numeric, v2 numeric) AS $w$
            BEGIN RETURN QUERY SELECT * FROM public.fn_comparacao_vendas_mensais(p1, p2, p3); END; $w$ LANGUAGE plpgsql;', schema_name);

        EXECUTE format('
            CREATE OR REPLACE FUNCTION %1$I.fn_comparacao_quantidades_mensais(p1 integer, p2 integer, p3 integer DEFAULT NULL) 
            RETURNS TABLE(mes integer, mes_nome varchar, q1 numeric, q2 numeric) AS $w$
            BEGIN RETURN QUERY SELECT * FROM public.fn_comparacao_quantidades_mensais(p1, p2, p3); END; $w$ LANGUAGE plpgsql;', schema_name);

        EXECUTE format('
            CREATE OR REPLACE FUNCTION %1$I.get_sales_performance_v2(p1 integer, p2 integer DEFAULT NULL, p3 integer DEFAULT NULL) 
            RETURNS TABLE(v1 integer, v2 varchar, v3 numeric, v4 numeric, v5 numeric, v6 numeric, v7 numeric, v8 numeric, v9 integer, v10 integer) AS $w$
            BEGIN RETURN QUERY SELECT * FROM public.get_sales_performance_v2(p1, p2, p3); END; $w$ LANGUAGE plpgsql;', schema_name);

        EXECUTE format('
            CREATE OR REPLACE FUNCTION %1$I.fn_clientes_mom(p1 integer, p2 integer, p3 integer, p4 boolean, p5 boolean) 
            RETURNS TABLE(c1 text, v1 numeric, q1 numeric, v2 numeric, q2 numeric, p1 numeric, p2 numeric) AS $w$
            BEGIN RETURN QUERY SELECT * FROM public.fn_clientes_mom(p1, p2, p3, p4, p5); END; $w$ LANGUAGE plpgsql;', schema_name);
            
        RAISE NOTICE 'Schema % atualizado.', schema_name;
    END LOOP;
END $$;
`;

async function apply() {
    try {
        console.log('🚀 Iniciando atualização global de todos os schemas...');
        await masterPool.query(sql);
        console.log('✅ Todos os schemas foram atualizados com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro crítico ao atualizar schemas:', err);
        process.exit(1);
    }
}

apply();
