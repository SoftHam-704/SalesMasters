require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTables() {
    try {
        const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%trans%';");
        console.log('Tables found:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkTables();
