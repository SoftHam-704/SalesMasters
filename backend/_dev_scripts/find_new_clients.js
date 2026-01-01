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
        console.log("🔍 Searching for 'COMAGRI' and 'CDR'...");

        const q1 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_fantasia ILIKE '%COMAGRI%' OR cli_nome ILIKE '%COMAGRI%'");
        console.log("--- Results for 'COMAGRI' ---");
        console.table(q1.rows);

        const q2 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_fantasia ILIKE '%CDR%' OR cli_nome ILIKE '%CDR%'");
        console.log("--- Results for 'CDR' ---");
        console.table(q2.rows);

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}
run();
