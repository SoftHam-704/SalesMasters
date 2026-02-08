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

async function listTables() {
    try {
        console.log('--- START ---');
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'repsoma' 
            ORDER BY table_name
        `);
        console.log('TABELAS ENCONTRADAS:');
        console.log(res.rows.map(r => r.table_name).join('\n'));
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
        console.log('--- END ---');
    }
}

listTables();
