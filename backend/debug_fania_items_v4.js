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
        console.log('--- Checking items of order FN904967 ---');

        const items = await pool.query(`
            SELECT i.ite_pedido, i.ite_produto, i.ite_nomeprod, i.ite_quant, i.ite_puni, i.ite_industria, f.for_nomered
            FROM itens_ped i
            LEFT JOIN fornecedores f ON i.ite_industria = f.for_codigo
            WHERE i.ite_pedido = 'FN904967'
        `);
        console.table(items.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
