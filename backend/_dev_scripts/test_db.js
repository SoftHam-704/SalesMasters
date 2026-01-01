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
        const res = await pool.query("SELECT * FROM vendedores LIMIT 1");
        console.log("Columns:", Object.keys(res.rows[0] || {}));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
