const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function run() {
    try {
        console.log("🔌 Conectando ao banco de dados...");
        const resSchemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')");
        const schemas = resSchemas.rows.map(r => r.nspname);

        console.log(`📂 Encontrados ${schemas.length} schemas para processar: ${schemas.join(', ')}`);

        for (const schema of schemas) {
            console.log(`🛠️ Processando schema: ${schema}...`);

            // 1. get_sales_performance_v2 (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.get_sales_performance_v2(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.get_sales_performance_v2(p_year integer, p_month integer DEFAULT NULL, p_industria integer DEFAULT NULL)
                RETURNS TABLE(ven_codigo integer, ven_nome character varying, total_value_current numeric, total_value_previous numeric, mom_value_percent numeric, total_qty_current numeric, total_qty_previous numeric, mom_qty_percent numeric, clients_previous integer, clients_current integer) AS $$
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
                        FROM ${schema}.pedidos p LEFT JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido
                        WHERE p.ped_data >= v_current_start_date AND p.ped_data <= v_current_end_date AND p.ped_situacao IN ('P', 'F') AND p.ped_vendedor IS NOT NULL AND (p_industria IS NULL OR p.ped_industria = p_industria)
                        GROUP BY p.ped_vendedor
                    ),
                    previous_period AS (
                        SELECT p.ped_vendedor, COALESCE(SUM(i.ite_totliquido), 0) as total_value, COALESCE(SUM(i.ite_quant), 0) as total_qty, COUNT(DISTINCT p.ped_cliente) as unique_clients
                        FROM ${schema}.pedidos p LEFT JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido
                        WHERE p.ped_data >= v_previous_start_date AND p.ped_data <= v_previous_end_date AND p.ped_situacao IN ('P', 'F') AND p.ped_vendedor IS NOT NULL AND (p_industria IS NULL OR p.ped_industria = p_industria)
                        GROUP BY p.ped_vendedor
                    )
                    SELECT v.ven_codigo, v.ven_nome, COALESCE(cp.total_value, 0)::NUMERIC, COALESCE(pp.total_value, 0)::NUMERIC,
                        CASE WHEN COALESCE(pp.total_value, 0) = 0 THEN CASE WHEN COALESCE(cp.total_value, 0) > 0 THEN 100.0 ELSE 0.0 END ELSE ((COALESCE(cp.total_value, 0) - COALESCE(pp.total_value, 0)) / COALESCE(pp.total_value, 1) * 100)::NUMERIC END,
                        COALESCE(cp.total_qty, 0)::NUMERIC, COALESCE(pp.total_qty, 0)::NUMERIC,
                        CASE WHEN COALESCE(pp.total_qty, 0) = 0 THEN CASE WHEN COALESCE(cp.total_qty, 0) > 0 THEN 100.0 ELSE 0.0 END ELSE ((COALESCE(cp.total_qty, 0) - COALESCE(pp.total_qty, 0)) / COALESCE(pp.total_qty, 1) * 100)::NUMERIC END,
                        COALESCE(pp.unique_clients, 0)::INTEGER, COALESCE(cp.unique_clients, 0)::INTEGER
                    FROM ${schema}.vendedores v
                    LEFT JOIN current_period cp ON v.ven_codigo = cp.ped_vendedor
                    LEFT JOIN previous_period pp ON v.ven_codigo = pp.ped_vendedor
                    WHERE COALESCE(cp.total_value, 0) > 0 OR COALESCE(pp.total_value, 0) > 0
                    ORDER BY 3 DESC;
                END; $$ LANGUAGE plpgsql;
            `);

            // 2. fn_comparacao_vendas_mensais (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_vendas_mensais(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_vendas_mensais(p_ano_atual integer, p_ano_anterior integer, p_industria integer DEFAULT NULL)
                RETURNS TABLE(mes integer, mes_nome character varying, vendas_ano_atual numeric, vendas_ano_anterior numeric) LANGUAGE plpgsql AS $$
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
                        COALESCE((SELECT SUM(ped_totliq) FROM ${schema}.pedidos WHERE EXTRACT(YEAR FROM ped_data) = p_ano_atual AND EXTRACT(MONTH FROM ped_data) = m.mes AND ped_situacao IN ('P', 'F') AND (p_industria IS NULL OR ped_industria = p_industria)), 0)::numeric as vendas_ano_atual,
                        COALESCE((SELECT SUM(ped_totliq) FROM ${schema}.pedidos WHERE EXTRACT(YEAR FROM ped_data) = p_ano_anterior AND EXTRACT(MONTH FROM ped_data) = m.mes AND ped_situacao IN ('P', 'F') AND (p_industria IS NULL OR ped_industria = p_industria)), 0)::numeric as vendas_ano_anterior
                    FROM meses m ORDER BY m.mes;
                END; $$;
            `);

            // 3. fn_comparacao_quantidades_mensais (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_quantidades_mensais(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_quantidades_mensais(p_ano_atual integer, p_ano_anterior integer, p_industria integer DEFAULT NULL)
                RETURNS TABLE(mes integer, mes_nome character varying, quantidade_ano_atual numeric, quantidade_ano_anterior numeric) LANGUAGE plpgsql AS $$
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
                        COALESCE((SELECT SUM(ite_quant) FROM ${schema}.pedidos p JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual AND EXTRACT(MONTH FROM p.ped_data) = m.mes AND p.ped_situacao IN ('P', 'F') AND (p_industria IS NULL OR p.ped_industria = p_industria)), 0)::numeric as quantidade_ano_atual,
                        COALESCE((SELECT SUM(ite_quant) FROM ${schema}.pedidos p JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior AND EXTRACT(MONTH FROM p.ped_data) = m.mes AND p.ped_situacao IN ('P', 'F') AND (p_industria IS NULL OR p.ped_industria = p_industria)), 0)::numeric as quantidade_ano_anterior
                    FROM meses m ORDER BY m.mes;
                END; $$;
            `);

            // 4. get_dashboard_metrics_v2 (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.get_dashboard_metrics_v2(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.get_dashboard_metrics_v2(p_year integer, p_month integer DEFAULT 0, p_industry_id integer DEFAULT NULL)
                RETURNS TABLE(
                    total_vendido_current numeric, vendas_percent_change numeric, 
                    quantidade_vendida_current numeric, quantidade_percent_change numeric, 
                    clientes_atendidos_current integer, clientes_percent_change numeric, 
                    total_pedidos_current integer, pedidos_percent_change numeric
                ) AS $$
                DECLARE 
                    v_curr_start DATE; v_curr_end DATE; v_prev_start DATE; v_prev_end DATE;
                BEGIN
                    IF p_month IS NULL OR p_month = 0 THEN
                        v_curr_start := make_date(p_year, 1, 1); v_curr_end := make_date(p_year, 12, 31);
                        v_prev_start := make_date(p_year - 1, 1, 1); v_prev_end := make_date(p_year - 1, 12, 31);
                    ELSE
                        v_curr_start := make_date(p_year, p_month, 1); v_curr_end := (v_curr_start + INTERVAL '1 month - 1 day')::DATE;
                        v_prev_start := v_curr_start - INTERVAL '1 year'; v_prev_end := v_curr_end - INTERVAL '1 year';
                    END IF;

                    RETURN QUERY
                    WITH curr_vendas AS (
                        SELECT 
                            SUM(p.ped_totliq)::NUMERIC as v,
                            COUNT(DISTINCT p.ped_cliente)::INTEGER as c,
                            COUNT(*)::INTEGER as pedidos
                        FROM ${schema}.pedidos p
                        WHERE p.ped_data >= v_curr_start AND p.ped_data <= v_curr_end
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
                    ),
                    curr_qtd AS (
                        SELECT SUM(i.ite_quant)::NUMERIC as q
                        FROM ${schema}.pedidos p
                        INNER JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        WHERE p.ped_data >= v_curr_start AND p.ped_data <= v_curr_end
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
                    ),
                    prev_vendas AS (
                        SELECT 
                            SUM(p.ped_totliq)::NUMERIC as v,
                            COUNT(DISTINCT p.ped_cliente)::INTEGER as c,
                            COUNT(*)::INTEGER as pedidos
                        FROM ${schema}.pedidos p
                        WHERE p.ped_data >= v_prev_start AND p.ped_data <= v_prev_end
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
                    ),
                    prev_qtd AS (
                        SELECT SUM(i.ite_quant)::NUMERIC as q
                        FROM ${schema}.pedidos p
                        INNER JOIN ${schema}.itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        WHERE p.ped_data >= v_prev_start AND p.ped_data <= v_prev_end
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_industry_id IS NULL OR p.ped_industria = p_industry_id)
                    )
                    SELECT 
                        COALESCE(cv.v, 0),
                        CASE WHEN COALESCE(pv.v, 0) = 0 THEN 0 ELSE ((COALESCE(cv.v, 0) - pv.v) / pv.v * 100)::NUMERIC END,
                        COALESCE(cq.q, 0),
                        CASE WHEN COALESCE(pq.q, 0) = 0 THEN 0 ELSE ((COALESCE(cq.q, 0) - pq.q) / pq.q * 100)::NUMERIC END,
                        COALESCE(cv.c, 0),
                        CASE WHEN COALESCE(pv.c, 0) = 0 THEN 0 ELSE ((COALESCE(cv.c, 0) - pv.c)::NUMERIC / pv.c * 100)::NUMERIC END,
                        COALESCE(cv.pedidos, 0),
                        CASE WHEN COALESCE(pv.pedidos, 0) = 0 THEN 0 ELSE ((COALESCE(cv.pedidos, 0) - pv.pedidos)::NUMERIC / pv.pedidos * 100)::NUMERIC END
                    FROM curr_vendas cv, curr_qtd cq, prev_vendas pv, prev_qtd pq;
                END; $$ LANGUAGE plpgsql;
            `);

            // 5. get_top_clients (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.get_top_clients(integer, integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.get_top_clients(p_year integer, p_month integer DEFAULT 0, p_limit integer DEFAULT 10, p_for_codigo integer DEFAULT NULL)
                RETURNS TABLE(cliente_codigo integer, cliente_nome text, total_vendido numeric, quantidade_pedidos bigint) AS $$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        p.ped_cliente,
                        COALESCE(MIN(c.cli_nome), 'CLIENTE ' || p.ped_cliente)::text,
                        SUM(p.ped_totliq)::numeric,
                        COUNT(p.ped_numero)::bigint
                    FROM ${schema}.pedidos p
                    LEFT JOIN ${schema}.clientes c ON c.cli_codigo = p.ped_cliente
                    WHERE p.ped_data >= make_date(p_year, 1, 1)
                      AND p.ped_data <= make_date(p_year, 12, 31)
                      AND (p_month = 0 OR EXTRACT(MONTH FROM p.ped_data) = p_month)
                      AND p.ped_situacao IN ('P', 'F')
                      AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                    GROUP BY p.ped_cliente
                    ORDER BY 3 DESC
                    LIMIT p_limit;
                END; $$ LANGUAGE plpgsql;
            `);

            // 6. get_industry_revenue (LOCAL VERSION)
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.get_industry_revenue(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.get_industry_revenue(p_year integer, p_month integer DEFAULT NULL, p_for_codigo integer DEFAULT NULL)
                RETURNS TABLE(industria_id integer, nome_fantasia text, total_faturamento numeric) AS $$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        p.ped_industria,
                        COALESCE(MIN(f.for_nome), 'IND ' || p.ped_industria)::text,
                        SUM(p.ped_totliq)::numeric
                    FROM ${schema}.pedidos p
                    LEFT JOIN ${schema}.fornecedores f ON f.for_codigo = p.ped_industria
                    WHERE p.ped_data >= make_date(p_year, 1, 1)
                      AND p.ped_data <= make_date(p_year, 12, 31)
                      AND (p_month IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_month)
                      AND p.ped_situacao IN ('P', 'F')
                      AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                    GROUP BY p.ped_industria
                    ORDER BY 3 DESC;
                END; $$ LANGUAGE plpgsql;
            `);

            console.log(`✅ ${schema} finalizado.`);
        }

        console.log("🚀 Todos os schemas foram atualizados com isolamento completo!");
    } catch (err) {
        console.error("❌ Erro:", err);
    } finally {
        await pool.end();
    }
}

run();
