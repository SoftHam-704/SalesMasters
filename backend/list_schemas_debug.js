require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function listSchemas() {
    console.log('🕵️ Listando schemas no banco Master...');

    // Conecta como webadmin
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'basesales',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const res = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listSchemas();
