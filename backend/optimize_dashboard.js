const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false
});

async function optimizeDashboardQueries() {
    console.log('⚡ Iniciando otimização severa de performance nas funções de Dashboard...');

    try {
        await client.connect();

        const res = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            AND schema_name NOT LIKE 'pg_temp_%'
            AND schema_name NOT LIKE 'pg_toast_temp_%'
        `);

        const schemas = res.rows.map(r => r.schema_name);
        console.log(`📌 Otimizando em ${schemas.length} schemas...`);

        for (const schema of schemas) {
            console.log(`🚀 Otimizando Schema: ${schema}...`);

            const statements = [
                `DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_vendas_mensais(integer, integer, integer);`,

                `CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_vendas_mensais(
                    p_ano_atual integer, p_ano_anterior integer, p_for_codigo integer DEFAULT NULL
                ) RETURNS TABLE(mes integer, mes_nome character varying, vendas_ano_atual numeric, vendas_ano_anterior numeric)
                LANGUAGE plpgsql AS $$
                BEGIN RETURN QUERY 
                    WITH meses AS ( 
                        SELECT m as mes, 
                        CASE m WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março' 
                               WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho' 
                               WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro' 
                               WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro' 
                        END::varchar as mes_nome 
                        FROM generate_series(1, 12) m 
                    ),
                    atual AS (
                        SELECT EXTRACT(MONTH FROM ped_data) as mes_agg, SUM(ped_totliq) as total
                        FROM ${schema}.pedidos
                        WHERE EXTRACT(YEAR FROM ped_data) = p_ano_atual
                          AND ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR ped_industria = p_for_codigo)
                        GROUP BY EXTRACT(MONTH FROM ped_data)
                    ),
                    anterior AS (
                        SELECT EXTRACT(MONTH FROM ped_data) as mes_agg, SUM(ped_totliq) as total
                        FROM ${schema}.pedidos
                        WHERE EXTRACT(YEAR FROM ped_data) = p_ano_anterior
                          AND ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR ped_industria = p_for_codigo)
                        GROUP BY EXTRACT(MONTH FROM ped_data)
                    )
                    SELECT m.mes, m.mes_nome, COALESCE(ca.total, 0)::numeric, COALESCE(pa.total, 0)::numeric
                    FROM meses m
                    LEFT JOIN atual ca ON m.mes = ca.mes_agg
                    LEFT JOIN anterior pa ON m.mes = pa.mes_agg
                    ORDER BY m.mes;
                END; $$;`,

                `DROP FUNCTION IF EXISTS ${schema}.fn_comparacao_quantidades_mensais(integer, integer, integer);`,

                `CREATE OR REPLACE FUNCTION ${schema}.fn_comparacao_quantidades_mensais(
                    p_ano_atual integer, p_ano_anterior integer, p_for_codigo integer DEFAULT NULL
                ) RETURNS TABLE(mes integer, mes_nome character varying, qtd_ano_atual numeric, qtd_ano_anterior numeric)
                LANGUAGE plpgsql AS $$
                BEGIN RETURN QUERY 
                    WITH meses AS ( 
                        SELECT m as mes, 
                        CASE m WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março' 
                               WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho' 
                               WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro' 
                               WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro' 
                        END::varchar as mes_nome 
                        FROM generate_series(1, 12) m 
                    ),
                    atual AS (
                        SELECT EXTRACT(MONTH FROM p.ped_data) as mes_agg, SUM(i.ite_quant) as total
                        FROM ${schema}.itens_ped i 
                        JOIN ${schema}.pedidos p ON trim(i.ite_pedido) = trim(p.ped_pedido) AND i.ite_industria = p.ped_industria
                        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                        GROUP BY EXTRACT(MONTH FROM p.ped_data)
                    ),
                    anterior AS (
                        SELECT EXTRACT(MONTH FROM p.ped_data) as mes_agg, SUM(i.ite_quant) as total
                        FROM ${schema}.itens_ped i 
                        JOIN ${schema}.pedidos p ON trim(i.ite_pedido) = trim(p.ped_pedido) AND i.ite_industria = p.ped_industria
                        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior
                          AND p.ped_situacao IN ('P', 'F')
                          AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                        GROUP BY EXTRACT(MONTH FROM p.ped_data)
                    )
                    SELECT m.mes, m.mes_nome, COALESCE(ca.total, 0)::numeric, COALESCE(pa.total, 0)::numeric
                    FROM meses m
                    LEFT JOIN atual ca ON m.mes = ca.mes_agg
                    LEFT JOIN anterior pa ON m.mes = pa.mes_agg
                    ORDER BY m.mes;
                END; $$;`
            ];

            for (let i = 0; i < statements.length; i++) {
                await client.query(statements[i]);
            }
        }

    } catch (error) {
        console.error('❌ Erro na execução:', error);
    } finally {
        await client.end();
        console.log('\n✅ Script Finalizado com Sucesso.');
    }
}

optimizeDashboardQueries();
