const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'basesales',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: process.env.DB_PORT || 5432,
});

async function checkCgc() {
    try {
        const res = await pool.query('SELECT cli_codigo, cli_nome, cli_cgc FROM clientes ORDER BY cli_codigo LIMIT 10');
        console.log('Sample Data:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkCgc();
