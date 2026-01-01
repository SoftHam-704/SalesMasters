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

async function listColumns() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'");
        console.log(res.rows.map(r => r.column_name).sort());
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listColumns();
