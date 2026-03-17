const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000
});

async function repair() {
    console.log("🚀 Iniciando restauração global do BI-INTELLIGENCE...");
    const client = await pool.connect();

    try {
        const resSchemas = await client.query(`
            SELECT nspname FROM pg_namespace 
            WHERE nspname NOT IN ('pg_catalog', 'information_schema') 
              AND nspname NOT LIKE 'pg_toast%'
              AND nspname NOT LIKE 'pg_temp%'
        `);

        const schemas = resSchemas.rows.map(r => r.nspname);
        console.log(`📂 Encontrados ${schemas.length} schemas para processar.`);

        const $func$ = '$$'; // Auxiliary for template literal escaping

        for (const schema of schemas) {
            console.log(`\n🛠️  Processando schema: ${schema}...`);

            const biFunctionsSql = `
                -- DROPS
                DO $$
                DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (
                        SELECT p.proname, oidvectortypes(p.proargtypes) as args
                        FROM pg_proc p
                        JOIN pg_namespace n ON p.pronamespace = n.oid
                        WHERE n.nspname = '${schema}'
                          AND p.proname IN (
                            'fn_curva_abc', 'fn_churn_preditivo', 'fn_correlacao_produtos',
                            'fn_oportunidades_perdidas', 'fn_anomalias_ticket', 'fn_eficiencia_comercial',
                            'fn_comparativo_clientes', 'fn_sazonalidade', 'fn_resumo_executivo'
                          )
                    ) 
                    LOOP
                        EXECUTE 'DROP FUNCTION IF EXISTS ${schema}.' || r.proname || '(' || r.args || ') CASCADE';
                    END LOOP;
                END $$;

                -- FN_CURVA_ABC
                CREATE OR REPLACE FUNCTION ${schema}.fn_curva_abc(
                    p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
                    p_meses TEXT DEFAULT 'todos',
                    p_industria TEXT DEFAULT 'todos',
                    p_clientes TEXT DEFAULT 'todos',
                    p_metrica TEXT DEFAULT 'valor'
                )
                RETURNS TABLE (
                    produto_id INTEGER,
                    produto_nome VARCHAR,
                    total NUMERIC,
                    qtd_clientes INTEGER,
                    percentual NUMERIC,
                    percentual_acum NUMERIC,
                    curva CHAR(1),
                    ranking INTEGER
                ) AS $func$
                BEGIN
                    RETURN QUERY
                    WITH produto_totais AS (
                        SELECT 
                            i.ite_idproduto as ite_produto,
                            pr.pro_nome,
                            CASE 
                                WHEN p_metrica = 'quantidade' THEN SUM(i.ite_quant)
                                WHEN p_metrica = 'unidades' THEN COUNT(DISTINCT i.ite_pedido)
                                ELSE SUM(i.ite_totliquido)
                            END as total_calc,
                            COUNT(DISTINCT p.ped_cliente) as clientes
                        FROM ${schema}.itens_ped i
                        INNER JOIN ${schema}.pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        INNER JOIN ${schema}.cad_prod pr ON i.ite_idproduto = pr.pro_id
                        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
                          AND (p_meses = 'todos' OR EXTRACT(MONTH FROM p.ped_data)::TEXT = ANY(string_to_array(p_meses, ',')))
                          AND (p_industria = 'todos' OR p.ped_industria::TEXT = p_industria)
                          AND (p_clientes = 'todos' OR p.ped_cliente::TEXT = ANY(string_to_array(p_clientes, ',')))
                          AND p.ped_situacao IN ('P', 'F')
                        GROUP BY i.ite_idproduto, pr.pro_nome
                    ),
                    produto_acumulado AS (
                        SELECT 
                            ite_produto,
                            pro_nome,
                            total_calc,
                            clientes,
                            SUM(total_calc) OVER () as total_geral,
                            SUM(total_calc) OVER (ORDER BY total_calc DESC) as acumulado,
                            ROW_NUMBER() OVER (ORDER BY total_calc DESC) as rank_num
                        FROM produto_totais
                    )
                    SELECT 
                        ite_produto::INTEGER,
                        pro_nome::VARCHAR,
                        ROUND(total_calc::NUMERIC, 2),
                        clientes::INTEGER,
                        ROUND((total_calc / NULLIF(total_geral, 0) * 100)::NUMERIC, 2),
                        ROUND((acumulado / NULLIF(total_geral, 0) * 100)::NUMERIC, 2),
                        CASE 
                            WHEN acumulado / NULLIF(total_geral, 0) <= 0.80 THEN 'A'
                            WHEN acumulado / NULLIF(total_geral, 0) <= 0.95 THEN 'B'
                            ELSE 'C'
                        END::CHAR(1),
                        rank_num::INTEGER
                    FROM produto_acumulado
                    ORDER BY total_calc DESC;
                END;
                $func$ LANGUAGE plpgsql;

                -- OPORTUNIDADES PERDIDAS
                CREATE OR REPLACE FUNCTION ${schema}.fn_oportunidades_perdidas()
                RETURNS TABLE (
                    cliente_codigo INTEGER,
                    cliente_nome VARCHAR,
                    produto_id INTEGER,
                    produto_nome VARCHAR,
                    valor_estimado NUMERIC
                ) AS $func$
                BEGIN
                    RETURN QUERY
                    WITH produtos_curva_a AS (
                        SELECT produto_id, produto_nome FROM ${schema}.fn_curva_abc() WHERE curva = 'A' LIMIT 10
                    ),
                    clientes_com_compra AS (
                        SELECT DISTINCT ped_cliente FROM ${schema}.pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '6 months' AND ped_situacao IN ('P', 'F')
                    )
                    SELECT 
                        c.cli_codigo::INTEGER,
                        c.cli_nomred::VARCHAR,
                        p.produto_id::INTEGER,
                        p.produto_nome::VARCHAR,
                        500.00::NUMERIC -- Valor estático para exemplo
                    FROM clientes_com_compra cc
                    CROSS JOIN produtos_curva_a p
                    INNER JOIN ${schema}.clientes c ON cc.ped_cliente = c.cli_codigo
                    WHERE NOT EXISTS (
                        SELECT 1 FROM ${schema}.itens_ped i
                        INNER JOIN ${schema}.pedidos ped ON i.ite_pedido = ped.ped_pedido
                        WHERE ped.ped_cliente = cc.ped_cliente AND i.ite_idproduto = p.produto_id
                    )
                    LIMIT 20;
                END;
                $func$ LANGUAGE plpgsql;

                -- CHURN PREDITIVO
                CREATE OR REPLACE FUNCTION ${schema}.fn_churn_preditivo()
                RETURNS TABLE (
                    cliente_codigo INTEGER,
                    cliente_nome VARCHAR,
                    dias_inativo INTEGER,
                    freq_compra_dias NUMERIC,
                    total_pedidos BIGINT,
                    ticket_medio NUMERIC,
                    valor_total NUMERIC,
                    perda_mensal_est NUMERIC,
                    nivel_risco VARCHAR
                ) AS $func$
                BEGIN
                    RETURN QUERY
                    WITH client_behavior AS (
                        SELECT 
                            c.cli_codigo,
                            c.cli_nomred,
                            MAX(p.ped_data) as ultima_compra,
                            CURRENT_DATE - MAX(p.ped_data) as dias_sem_comprar,
                            COUNT(*) as qtd_pedidos,
                            AVG(p.ped_totliq) as avg_ticket,
                            SUM(p.ped_totliq) as lifetime_val,
                            CASE 
                                WHEN COUNT(*) > 1 THEN 
                                    EXTRACT(DAYS FROM (MAX(p.ped_data) - MIN(p.ped_data))) / (COUNT(*) - 1)
                                ELSE NULL
                            END as frequencia
                        FROM ${schema}.pedidos p
                        INNER JOIN ${schema}.clientes c ON p.ped_cliente = c.cli_codigo
                        WHERE p.ped_situacao IN ('P', 'F')
                        GROUP BY c.cli_codigo, c.cli_nomred
                    )
                    SELECT 
                        cli_codigo::INTEGER,
                        cli_nomred::VARCHAR,
                        dias_sem_comprar::INTEGER,
                        ROUND(frequencia::NUMERIC, 0),
                        qtd_pedidos::BIGINT,
                        ROUND(avg_ticket::NUMERIC, 2),
                        ROUND(lifetime_val::NUMERIC, 2),
                        ROUND((lifetime_val / 12.0)::NUMERIC, 2),
                        CASE 
                            WHEN dias_sem_comprar > (frequencia * 2) THEN 'CRÍTICO'
                            WHEN dias_sem_comprar > frequencia THEN 'ALERTA'
                            ELSE 'OK'
                        END::VARCHAR
                    FROM client_behavior
                    WHERE frequencia IS NOT NULL
                      AND qtd_pedidos >= 5
                      AND dias_sem_comprar > 30
                    ORDER BY 
                        CASE 
                            WHEN dias_sem_comprar > (frequencia * 2) THEN 1
                            WHEN dias_sem_comprar > frequencia THEN 2
                            ELSE 3
                        END,
                        lifetime_val DESC;
                END;
                $func$ LANGUAGE plpgsql;

                -- RESUMO EXECUTIVO
                CREATE OR REPLACE FUNCTION ${schema}.fn_resumo_executivo()
                RETURNS TABLE (
                    total_clientes_ativos BIGINT,
                    total_faturamento NUMERIC,
                    ticket_medio NUMERIC,
                    total_pedidos BIGINT,
                    produtos_ativos BIGINT,
                    clientes_em_risco BIGINT
                ) AS $func$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        (SELECT COUNT(DISTINCT ped_cliente) FROM ${schema}.pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months' AND ped_situacao IN ('P', 'F'))::BIGINT,
                        (SELECT ROUND(SUM(ped_totliq)::NUMERIC, 2) FROM ${schema}.pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month' AND ped_situacao IN ('P', 'F'))::NUMERIC,
                        (SELECT ROUND(AVG(ped_totliq)::NUMERIC, 2) FROM ${schema}.pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month' AND ped_situacao IN ('P', 'F'))::NUMERIC,
                        (SELECT COUNT(*) FROM ${schema}.pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month' AND ped_situacao IN ('P', 'F'))::BIGINT,
                        (SELECT COUNT(DISTINCT ite_idproduto) FROM ${schema}.itens_ped i INNER JOIN ${schema}.pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE p.ped_data >= CURRENT_DATE - INTERVAL '3 months' AND p.ped_situacao IN ('P', 'F'))::BIGINT,
                        (SELECT COUNT(*) FROM ${schema}.fn_churn_preditivo() WHERE nivel_risco IN ('CRÍTICO', 'ALERTA'))::BIGINT;
                END;
                $func$ LANGUAGE plpgsql;
            `;

            await client.query(biFunctionsSql);
            console.log(`✅ Functions BI criadas em ${schema}.`);

            const viewsSql = `
                DROP VIEW IF EXISTS ${schema}.vw_analise_portfolio CASCADE;
                DROP VIEW IF EXISTS ${schema}.vw_metricas_cliente CASCADE;
                DROP VIEW IF EXISTS ${schema}.vw_performance_mensal CASCADE;
                
                CREATE OR REPLACE VIEW ${schema}.vw_metricas_cliente AS
                SELECT 
                    p.ped_cliente as cliente_id,
                    c.cli_nomred as cliente_nome,
                    p.ped_industria as industry_id,
                    (CURRENT_DATE - MAX(p.ped_data)::date) as dias_sem_compra,
                    SUM(p.ped_totliq) as valor_total,
                    COUNT(p.ped_numero) as total_pedidos,
                    AVG(p.ped_totliq) as ticket_medio
                FROM ${schema}.pedidos p
                JOIN ${schema}.clientes c ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_situacao IN ('P', 'F')
                GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;

                CREATE OR REPLACE VIEW ${schema}.vw_performance_mensal AS
                SELECT 
                    EXTRACT(YEAR FROM ped_data) as ano,
                    EXTRACT(MONTH FROM ped_data) as mes,
                    ped_industria as industry_id,
                    SUM(ped_totliq) as valor_total,
                    COUNT(DISTINCT ped_numero) as qtd_pedidos,
                    COUNT(DISTINCT ped_cliente) as clientes_ativos,
                    AVG(ped_totliq) as ticket_medio
                FROM ${schema}.pedidos
                WHERE ped_situacao IN ('P', 'F')
                GROUP BY 1, 2, 3;
            `;

            await client.query(viewsSql);
            console.log(`✅ Views BI criadas em ${schema}.`);

            const indexesSql = `
                CREATE INDEX IF NOT EXISTS idx_pedidos_data_${schema} ON ${schema}.pedidos(ped_data);
                CREATE INDEX IF NOT EXISTS idx_pedidos_situacao_${schema} ON ${schema}.pedidos(ped_situacao);
                CREATE INDEX IF NOT EXISTS idx_itens_ped_join_${schema} ON ${schema}.itens_ped(ite_pedido, ite_industria);
            `;
            await client.query(indexesSql);
        }

        console.log("\n✨ Todas as correções foram aplicadas com sucesso!");

    } catch (err) {
        console.error("❌ Erro durante a restauração:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

repair();
