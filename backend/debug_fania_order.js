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
        console.log('--- Checking details of order FN904967 ---');

        const order = await pool.query(`
            SELECT p.*, v.ven_nome 
            FROM pedidos p
            LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
            WHERE p.ped_pedido = 'FN904967'
        `);
        console.table(order.rows);

        console.log('--- Checking if industry FANIA is actually mapped correctly ---');
        const faniaCheck = await pool.query("SELECT * FROM fornecedores WHERE for_nomered = 'FANIA'");
        console.table(faniaCheck.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
