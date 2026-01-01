const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkRelationship() {
    try {
        const result = await pool.query(`
            SELECT 
                ci.cli_codigo,
                ci.cli_forcodigo,
                ci.cli_grupodesc,
                c.cli_nomred,
                f.for_nomered,
                gd.gde_nome
            FROM cli_ind ci
            LEFT JOIN clientes c ON c.cli_codigo = ci.cli_codigo
            LEFT JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
            LEFT JOIN grupo_desc gd ON gd.gde_id = ci.cli_grupodesc
            WHERE c.cli_nomred = 'AMPAGRIL AMAMBAI' 
            AND ci.cli_grupodesc IS NOT NULL
            LIMIT 5
        `);

        console.log('Found:', result.rows.length, 'records');
        console.table(result.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkRelationship();
