require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSuppliers() {
    try {
        const res = await pool.query('SELECT for_codigo, for_nome, for_nomered FROM fornecedores LIMIT 5');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSuppliers();
