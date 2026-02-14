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
        await pool.query('SET search_path TO ndsrep');
        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'ndsrep' AND table_name = 'itens_ped'
        `);
        console.table(columns.rows);
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
