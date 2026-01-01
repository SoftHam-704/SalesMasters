const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkData() {
    try {
        const result = await pool.query('SELECT * FROM transportadora');
        console.table(result.rows);
    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkData();
