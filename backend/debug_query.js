
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function check() {
    try {
        const id = '00016';
        const query = `
        SELECT 
            d.*, 
            f.for_nomered as industria_nome,
            g.gde_nome as grupo_nome
        FROM ro_consult.cli_descpro d
        LEFT JOIN ro_consult.fornecedores f ON d.cli_forcodigo = f.for_codigo
        LEFT JOIN ro_consult.grupo_desc g ON d.cli_grupo::text = g.gid::text
        WHERE d.cli_codigo::text::int = $1::text::int
        ORDER BY f.for_nomered, g.gde_nome
    `;
        const result = await pool.query(query, [id]);
        console.log(`Results for ${id} in ro_consult:`, result.rows.length);
        console.table(result.rows);

        // Try without schema prefix but setting search_path
        await pool.query("SET search_path TO ro_consult, public");
        const query2 = `
        SELECT 
            d.*, 
            f.for_nomered as industria_nome,
            g.gde_nome as grupo_nome
        FROM cli_descpro d
        LEFT JOIN fornecedores f ON d.cli_forcodigo = f.for_codigo
        LEFT JOIN grupo_desc g ON d.cli_grupo::text = g.gid::text
        WHERE d.cli_codigo::text::int = $1::text::int
        ORDER BY f.for_nomered, g.gde_nome
    `;
        const result2 = await pool.query(query2, [id]);
        console.log(`Results for ${id} with search_path ro_consult:`, result2.rows.length);
        console.table(result2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
