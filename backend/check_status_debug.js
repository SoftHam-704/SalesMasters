require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkStatus() {
    try {
        const res = await pool.query('SELECT DISTINCT pro_status FROM cad_prod LIMIT 10');
        console.log('Distinct types:', res.rows.map(r => typeof r.pro_status));
        console.log('Distinct values:', res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

checkStatus();
