const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function checkClients() {
    try {
        const res = await pool.query('SELECT count(*) FROM clientes');
        console.log('Count:', res.rows[0].count);
        const sample = await pool.query('SELECT cli_codigo, cli_nome, cli_nomred FROM clientes LIMIT 5');
        console.log('Sample:', sample.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkClients();
