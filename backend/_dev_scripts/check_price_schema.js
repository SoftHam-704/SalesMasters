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

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cad_tabelaspre' ORDER BY column_name");
        console.log('Current Schema:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
