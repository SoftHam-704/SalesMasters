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
        console.log('--- Checking for duplicate DK clients ---');

        const clients = await pool.query("SELECT cli_codigo, cli_nome, cli_nomred FROM clientes WHERE cli_nomred ILIKE '%DK%'");
        console.table(clients.rows);

        console.log('--- Checking for orders FN904967 and PB904991 details ---');
        const details = await pool.query(`
            SELECT p.ped_pedido, p.ped_cliente, c.cli_nomred, p.ped_industria, f.for_nomered, p.ped_data 
            FROM pedidos p
            LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
            LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_pedido IN ('FN904967', 'PB904991')
        `);
        console.table(details.rows);

        console.log('--- Checking if industry FANIA has any other orders for other clients ---');
        const faniaOrders = await pool.query(`
            SELECT p.ped_cliente, c.cli_nomred, count(*) as total
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_industria = 52
            GROUP BY p.ped_cliente, c.cli_nomred
            ORDER BY total DESC
            LIMIT 10
        `);
        console.table(faniaOrders.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
