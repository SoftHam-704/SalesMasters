const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'salesmasters_v2',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkColumns() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'");
        console.log('Columns in clientes table:');
        console.log(res.rows.map(r => r.column_name).sort().join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkColumns();
