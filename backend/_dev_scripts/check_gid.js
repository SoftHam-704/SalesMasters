const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkIds() {
    try {
        console.log('🔍 Checking IDs in grupo_desc...');
        const result = await pool.query('SELECT gde_id, gid FROM grupo_desc LIMIT 10');
        console.table(result.rows);
    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkIds();
