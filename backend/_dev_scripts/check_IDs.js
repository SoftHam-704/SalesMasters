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
        console.log("🔍 Checking specific IDs and Names...");

        // Check ID 233
        const q1 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_codigo = 233");
        console.log("--- ID 233 ---");
        if (q1.rows.length) console.table(q1.rows);
        else console.log("ID 233 not found.");

        // Check 'CEL ANTONINO'
        const q2 = await pool.query("SELECT cli_codigo, cli_fantasia, cli_nome FROM clientes WHERE cli_fantasia ILIKE '%CEL%' OR cli_nome ILIKE '%CEL%'");
        console.log("--- Results for 'CEL' ---");
        console.table(q2.rows);

        // Check 'ARCA' in 'industrias' (Wait, previous error said 'industrias' relation does not exist?)
        // Let's check 'cad_prod' for an industry example or 'fornecedor' table?
        // Actually, backend usually uses 'fornecedor' table for industries based on 'suppliers' endpoint?
        // Let's check 'fornecedor' table.
        const q3 = await pool.query("SELECT for_codigo, for_razsoc FROM fornecedor WHERE for_razsoc ILIKE '%ARCA%' LIMIT 5");
        console.log("--- Results for 'ARCA' (Fornecedor) ---");
        console.table(q3.rows);

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}
run();
