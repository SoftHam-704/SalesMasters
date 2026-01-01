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
        console.log("Testing execution of fn_comparativo_clientes...");
        // Parameters based on user's screenshot: Ind=25, Ref=12, Alvo=28
        const values = [25, 12, 28, '2024-01-01', '2025-12-28', 'GAP'];

        console.log("Params:", values);
        const res = await pool.query(
            `SELECT * FROM fn_comparativo_clientes($1, $2, $3, $4, $5, $6)`,
            values
        );

        console.log(`✅ Success! Returned ${res.rowCount} rows.`);
        if (res.rowCount > 0) {
            console.log("First row:", res.rows[0]);
        }
    } catch (e) {
        console.error("❌ Execution Error:", e.message);
        if (e.detail) console.error("Detail:", e.detail);
        if (e.hint) console.error("Hint:", e.hint);
        if (e.position) console.error("Position:", e.position);
    } finally {
        pool.end();
    }
}
run();
