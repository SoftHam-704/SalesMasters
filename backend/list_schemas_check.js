const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function listSchemas() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const res = await pool.query(`
            SELECT nspname 
            FROM pg_namespace 
            WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast') 
              AND nspname NOT LIKE 'pg_temp_%'
        `);
        console.log('--- Schemas Encontrados ---');
        res.rows.forEach(r => console.log(r.nspname));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
listSchemas();
