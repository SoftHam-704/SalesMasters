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
        const order = await pool.query(`
            SELECT p.ped_pedido, p.ped_data, p.ped_vendedor, v.ven_nome, p.ped_cliente, c.cli_nomred
            FROM pedidos p
            LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
            LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_pedido = 'FN904967'
        `);
        console.table(order.rows);
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
