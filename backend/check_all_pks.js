
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkPKs() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const tables = ['pedidos', 'itens_ped'];
        for (const table of tables) {
            console.log(`--- Checking PK for repsoma.${table} ---`);
            const res = await pool.query(`
                SELECT a.attname 
                FROM pg_index i 
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) 
                WHERE i.indrelid = 'repsoma.${table}'::regclass AND i.indisprimary
            `);
            console.log(`Columns:`, res.rows.map(r => r.attname));
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkPKs();
