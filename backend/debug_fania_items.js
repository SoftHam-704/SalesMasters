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
            SELECT i.ite_pedido, i.ite_item, i.ite_produto, p.pro_descri, i.ite_quant, i.ite_puni, f.for_nomered as industria_produto
            FROM itens_ped i
            JOIN produtos p ON i.ite_produto = p.pro_codigo
            LEFT JOIN fornecedores f ON p.pro_fornece = f.for_codigo
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
