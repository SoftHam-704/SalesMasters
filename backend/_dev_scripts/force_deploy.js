const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function deploy() {
    const client = await pool.connect();
    try {
        console.log("🚀 Force Deploying fn_comparativo_clientes...");

        await client.query('BEGIN');

        // Drop first because return type changed
        console.log("🔥 Dropping existing function...");
        await client.query(`DROP FUNCTION IF EXISTS fn_comparativo_clientes(INTEGER, INTEGER, INTEGER, DATE, DATE, VARCHAR)`);

        // Read new SQL
        const sqlPath = path.join(__dirname, 'sql', 'fn_comparativo_clientes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Create
        console.log("✨ Creating new function...");
        await client.query(sql);

        await client.query('COMMIT');
        console.log("✅ Function successfully deployed!");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Deployment Error:", e.message);
    } finally {
        client.release();
        pool.end();
    }
}
deploy();
