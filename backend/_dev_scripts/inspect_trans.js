require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspectTransportadora() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transportadora';");
        console.log('Columns:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspectTransportadora();
