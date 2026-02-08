
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkIndexes() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 10000
    });

    try {
        const res = await pool.query(`
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'repsoma' 
              AND tablename IN ('pedidos', 'itens_ped')
        `);
        console.log('Indexes found:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkIndexes();
