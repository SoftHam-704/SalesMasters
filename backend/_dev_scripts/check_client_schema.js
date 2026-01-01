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
        console.log("🔍 Checking 'clientes' table columns...");
        const res = await pool.query("SELECT * FROM clientes LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Columns:", Object.keys(res.rows[0]));
        } else {
            console.log("Table exists but is empty.");
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}
run();
