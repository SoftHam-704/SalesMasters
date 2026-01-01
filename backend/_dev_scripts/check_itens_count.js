const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkItensPed() {
    try {
        const count = await pool.query('SELECT COUNT(*) FROM itens_ped');
        console.log(`📊 Registros em itens_ped: ${count.rows[0].count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkItensPed();
