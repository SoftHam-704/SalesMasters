require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function listSchemas() {
    try {
        const res = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')");
        console.log('Available Schemas:', res.rows.map(r => r.schema_name));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

listSchemas();
