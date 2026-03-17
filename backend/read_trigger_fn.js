const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function readTriggerFunction() {
    try {
        const res = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'trg_fn_auto_normalizar_item' LIMIT 1;");
        if (res.rows.length > 0) {
            console.log("Trigger Function Body:");
            console.log(res.rows[0].prosrc);
        } else {
            console.log("Trigger function not found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

readTriggerFunction();
