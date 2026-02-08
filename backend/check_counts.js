const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 5000
});

async function checkCount() {
    try {
        await pool.query('SET search_path TO repsoma');
        const res = await pool.query('SELECT count(*) FROM itens_ped');
        console.log('COUNT ITENS_PED:', res.rows[0].count);

        const res2 = await pool.query('SELECT count(*) FROM cad_prod');
        console.log('COUNT CAD_PROD:', res2.rows[0].count);
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkCount();
