const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'basesales',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: process.env.DB_PORT || 5432,
});

async function checkCities() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM cidades');
        console.log('Total Cities:', res.rows[0].count);

        const res2 = await pool.query('SELECT * FROM cidades LIMIT 5');
        console.log('Sample:', res2.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkCities();
