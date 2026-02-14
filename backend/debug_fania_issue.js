const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function checkData() {
    try {
        await pool.query('SET search_path TO ndsrep, public');
        console.log('--- Checking Client DK C.GRANDE ---');

        const clientRes = await pool.query("SELECT cli_codigo, cli_nome, cli_nomred FROM clientes WHERE cli_nomred ILIKE '%DK C.GRANDE%'");
        console.table(clientRes.rows);

        if (clientRes.rows.length > 0) {
            const cliCodigo = clientRes.rows[0].cli_codigo;
            console.log(`Checking orders for client: ${cliCodigo}`);

            const ordersRes = await pool.query(`
                SELECT p.ped_pedido, p.ped_data, p.ped_totliq, p.ped_industria, f.for_nomered
                FROM pedidos p
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_cliente = $1
                ORDER BY p.ped_data DESC
                LIMIT 20
            `, [cliCodigo]);
            console.table(ordersRes.rows);
        }

        console.log('--- Checking Order FN904967 specifically ---');
        const orderSpecific = await pool.query(`
            SELECT p.ped_pedido, p.ped_cliente, c.cli_nomred, p.ped_industria, f.for_nomered 
            FROM pedidos p
            LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
            LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_pedido = 'FN904967'
        `);
        console.table(orderSpecific.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
