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

async function checkTable() {
    try {
        await pool.query('SET search_path TO ndsrep');
        const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'indclientes'");
        console.table(r.rows);

        // Also check one row to be sure of data
        const data = await pool.query("SELECT * FROM indclientes LIMIT 1");
        console.log('Sample row:');
        console.table(data.rows);
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkTable();
