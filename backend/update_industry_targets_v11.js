const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 5000
});

async function upgradeIndustryRevenue() {
    const schemasResult = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    const schemas = schemasResult.rows.map(r => r.schema_name);

    for (const schema of schemas) {
        try {
            // Check if ind_metas exists in this schema
            const tableCheck = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'ind_metas'", [schema]);
            if (tableCheck.rows.length === 0) {
                console.log(`- Skipping ${schema} (missing ind_metas)`);
                continue;
            }

            console.log(`🚀 Upgrade Industry Revenue V11 globally in schema: ${schema}`);

            await pool.query(`DROP FUNCTION IF EXISTS ${schema}.get_industry_revenue(integer, integer, integer, integer) CASCADE`);

            const query = `
            CREATE OR REPLACE FUNCTION ${schema}.get_industry_revenue(p_year integer, p_month integer DEFAULT NULL, p_for_codigo integer DEFAULT NULL, p_cli_codigo integer DEFAULT NULL)
            RETURNS TABLE(industria_id integer, for_nomered text, total_faturamento numeric, total_meta numeric) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    p.ped_industria,
                    COALESCE(MIN(f.for_nomered), 'IND ' || p.ped_industria)::text,
                    SUM(p.ped_totliq)::numeric,
                    COALESCE(
                        CASE 
                            WHEN p_month = 1 THEN MIN(m.met_jan)
                            WHEN p_month = 2 THEN MIN(m.met_fev)
                            WHEN p_month = 3 THEN MIN(m.met_mar)
                            WHEN p_month = 4 THEN MIN(m.met_abr)
                            WHEN p_month = 5 THEN MIN(m.met_mai)
                            WHEN p_month = 6 THEN MIN(m.met_jun)
                            WHEN p_month = 7 THEN MIN(m.met_jul)
                            WHEN p_month = 8 THEN MIN(m.met_ago)
                            WHEN p_month = 9 THEN MIN(m.met_set)
                            WHEN p_month = 10 THEN MIN(m.met_out)
                            WHEN p_month = 11 THEN MIN(m.met_nov)
                            WHEN p_month = 12 THEN MIN(m.met_dez)
                            ELSE MIN(m.met_jan + m.met_fev + m.met_mar + m.met_abr + m.met_mai + m.met_jun + m.met_jul + m.met_ago + m.met_set + m.met_out + m.met_nov + m.met_dez)
                        END, 
                        0
                    )::numeric as total_meta
                FROM ${schema}.pedidos p
                LEFT JOIN ${schema}.fornecedores f ON f.for_codigo = p.ped_industria
                LEFT JOIN ${schema}.ind_metas m ON m.met_industria = p.ped_industria AND m.met_ano = p_year
                WHERE p.ped_data >= make_date(p_year, 1, 1)
                  AND p.ped_data <= make_date(p_year, 12, 31)
                  AND (p_month IS NULL OR p_month = 0 OR EXTRACT(MONTH FROM p.ped_data) = p_month)
                  AND p.ped_situacao IN ('P', 'F')
                  AND (p_for_codigo IS NULL OR p.ped_industria = p_for_codigo)
                  AND (p_cli_codigo IS NULL OR p.ped_cliente = p_cli_codigo)
                GROUP BY p.ped_industria
                ORDER BY 3 DESC;
            END;
            $$ LANGUAGE plpgsql;
            `;

            await pool.query(query);
            console.log(`✅ ${schema} atualizado para V11 (Ind Metas).`);
        } catch (err) {
            console.error(`❌ Erro em ${schema}:`, err.message);
        }
    }

    await pool.end();
}

upgradeIndustryRevenue();
