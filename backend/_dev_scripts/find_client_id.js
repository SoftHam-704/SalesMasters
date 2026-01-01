const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log("🔍 Searching for Clients...");

        const q1 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_fantasia ILIKE '%CAPITAL%' OR cli_nome ILIKE '%CAPITAL%' LIMIT 10");
        console.log("--- Results for 'CAPITAL' ---");
        console.table(q1.rows);

        const q2 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_fantasia ILIKE '%ROLPAR%' OR cli_nome ILIKE '%ROLPAR%' LIMIT 10");
        console.log("--- Results for 'ROLPAR' ---");
        console.table(q2.rows);

        const q3 = await pool.query("SELECT ind_codigo, ind_nome FROM industrias WHERE ind_nome ILIKE '%ARCA%' LIMIT 5");
        console.log("--- Results for 'ARCA' ---");
        console.table(q3.rows);

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}
run();
