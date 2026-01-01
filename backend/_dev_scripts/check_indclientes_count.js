const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function check() {
    try {
        const res = await pool.query('SELECT COUNT(DISTINCT cli_indid) as count FROM indclientes');
        console.log('Unique Industry IDs in indclientes:', res.rows[0].count);
        pool.end();
    } catch (err) {
        console.error(err);
    }
}

check();
