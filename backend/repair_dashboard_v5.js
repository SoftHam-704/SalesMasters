const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false
});

async function repairFunctions() {
    const schemasResult = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    const schemas = schemasResult.rows.map(r => r.schema_name);

    for (const schema of schemas) {
        console.log(`🛠️ V5 PERFORMANCE FIX no schema: ${schema}`);
        try {
            // ========================================
            // PASSO 0: CRIAR ÍNDICES PARA PERFORMANCE
            // ========================================
            const indexes = [
                `CREATE INDEX IF NOT EXISTS idx_pedidos_data_sit ON ${schema}.pedidos (ped_data, ped_situacao)`,
                `CREATE INDEX IF NOT EXISTS idx_pedidos_industria ON ${schema}.pedidos (ped_industria)`,
                `CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON ${schema}.pedidos (ped_cliente)`,
                `CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido ON ${schema}.itens_ped (ite_pedido, ite_industria)`,
            ];
            for (const idx of indexes) {
                try { await pool.query(idx); } catch (e) { /* index may already exist */ }
            }

            // ========================================
            // 1. fn_comparacao_vendas_mensais (SEM TRIM - RÁPIDA)
            // ========================================
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_vendas_mensais(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_vendas_mensais(p_ano_atual integer, p_ano_anterior integer, p_for_codigo integer DEFAULT NULL)
                RETURNS TABLE(mes integer, mes_nome text, vendas_ano_atual numeric, vendas_ano_anterior numeric) AS $$
                BEGIN
                    RETURN QUERY
                    WITH meses AS (
                        SELECT m AS mes_num, 
                               CASE m 
                                   WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
                                   WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
                                   WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
                                   WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
                               END::text AS nome_mes
                        FROM generate_series(1, 12) m
                    ),
                    vendas_agg AS (
                        SELECT 
                            EXTRACT(YEAR FROM ped_data)::integer as ano,
                            EXTRACT(MONTH FROM ped_data)::integer as mes,
                            SUM(ped_totliq) as total
                        FROM ${schema}.pedidos
                        WHERE ped_data >= make_date(p_ano_anterior, 1, 1) 
                          AND ped_data <= make_date(p_ano_atual, 12, 31)
                          AND ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR ped_industria = p_for_codigo)
                        GROUP BY 1, 2
                    )
                    SELECT 
                        m.mes_num,
                        m.nome_mes,
                        COALESCE((SELECT va.total FROM vendas_agg va WHERE va.ano = p_ano_atual AND va.mes = m.mes_num), 0)::numeric,
                        COALESCE((SELECT va.total FROM vendas_agg va WHERE va.ano = p_ano_anterior AND va.mes = m.mes_num), 0)::numeric
                    FROM meses m
                    ORDER BY m.mes_num;
                END;
                $$ LANGUAGE plpgsql;
            `);

            // ========================================
            // 2. fn_comparacao_quantidades_mensais (SEM TRIM, SEM LATERAL - RÁPIDA)
            // ========================================
            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_quantidades_mensais(integer, integer, integer) CASCADE`);
            await pool.query(`
                CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_quantidades_mensais(p_ano_atual integer, p_ano_anterior integer, p_for_codigo integer DEFAULT NULL)
                RETURNS TABLE(mes integer, mes_nome text, quantidade_ano_atual numeric, quantidade_ano_anterior numeric) AS $$
                BEGIN
                    RETURN QUERY
                    WITH meses AS (
                        SELECT m AS mes_num, 
                               CASE m 
                                   WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
                                   WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
                                   WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
                                   WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
                               END::text AS nome_mes
                        FROM generate_series(1, 12) m
                    ),
                    qtd_agg AS (
                        SELECT 
                            EXTRACT(YEAR FROM p.ped_data)::integer as ano,
                            EXTRACT(MONTH FROM p.ped_data)::integer as mes,
                            SUM(i.ite_quant) as total
                        FROM ${schema}.pedidos p
                        INNER JOIN ${schema}.itens_ped i 
                            ON i.ite_pedido = p.ped_pedido 
                            AND i.ite_industria = p.ped_industria
                        WHERE p.ped_data >= make_date(p_ano_anterior, 1, 1)
                          AND p.ped_data <= make_date(p_ano_atual, 12, 31)
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                        GROUP BY 1, 2
                    )
                    SELECT 
                        m.mes_num,
                        m.nome_mes,
                        COALESCE((SELECT q.total FROM qtd_agg q WHERE q.ano = p_ano_atual AND q.mes = m.mes_num), 0)::numeric,
                        COALESCE((SELECT q.total FROM qtd_agg q WHERE q.ano = p_ano_anterior AND q.mes = m.mes_num), 0)::numeric
                    FROM meses m
                    ORDER BY m.mes_num;
                END;
                $$ LANGUAGE plpgsql;
            `);

            // ========================================
            // 3. get_top_clients (SEM TRIM - RÁPIDA)
            // ========================================
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
                END;
                $$ LANGUAGE plpgsql;
            `);

            // ========================================
            // 4. get_industry_revenue (SEM TRIM - RÁPIDA)
            // ========================================
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
                END;
                $$ LANGUAGE plpgsql;
            `);

            // ========================================
            // 5. get_dashboard_metrics_v2 (SEM TRIM, JOIN DIRETO - RÁPIDA)
            // ========================================
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
                END;
                $$ LANGUAGE plpgsql;
            `);

            console.log(`✅ ${schema} reparado.`);
        } catch (err) {
            console.error(`❌ Erro em ${schema}:`, err.message);
        }
    }

    // BENCHMARK
    console.log('\n--- BENCHMARK ---');
    const t0 = Date.now();
    await pool.query('SELECT * FROM target.fn_comparacao_quantidades_mensais(2026, 2025)');
    console.log(`fn_comparacao_quantidades_mensais (sem filtro): ${Date.now() - t0}ms`);

    const t1 = Date.now();
    await pool.query('SELECT * FROM target.fn_comparacao_quantidades_mensais(2026, 2025, 23)');
    console.log(`fn_comparacao_quantidades_mensais (com filtro): ${Date.now() - t1}ms`);

    const t2 = Date.now();
    await pool.query('SELECT * FROM target.get_dashboard_metrics_v2(2026)');
    console.log(`get_dashboard_metrics_v2 (sem filtro): ${Date.now() - t2}ms`);

    const t3 = Date.now();
    await pool.query('SELECT * FROM target.get_dashboard_metrics_v2(2026, 0, 23)');
    console.log(`get_dashboard_metrics_v2 (com filtro): ${Date.now() - t3}ms`);

    const t4 = Date.now();
    await pool.query('SELECT * FROM target.get_top_clients(2026, 0, 15)');
    console.log(`get_top_clients: ${Date.now() - t4}ms`);

    await pool.end();
}

repairFunctions();
