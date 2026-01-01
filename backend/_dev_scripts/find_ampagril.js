const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findAmpagril() {
    try {
        const clients = await pool.query(`SELECT cli_codigo, cli_nomred FROM clientes WHERE cli_nomred LIKE '%AMPAGRIL%'`);
        console.log('AMPAGRIL clients:');
        console.table(clients.rows);

        if (clients.rows.length > 0) {
            const clientId = clients.rows[0].cli_codigo;
            const discounts = await pool.query(`
                SELECT ci.*, f.for_nomered, gd.gde_nome 
                FROM cli_ind ci
                LEFT JOIN fornecedores f ON f.for_codigo = ci.cli_forcodigo
                LEFT JOIN grupo_desc gd ON gd.gde_id = ci.cli_grupodesc
                WHERE ci.cli_codigo = $1 AND ci.cli_grupodesc IS NOT NULL
            `, [clientId]);

            console.log(`\nDiscount groups for client ${clientId}:`);
            console.table(discounts.rows);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

findAmpagril();
