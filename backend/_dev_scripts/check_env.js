require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function check() {
    console.log('DB_NAME from env:', process.env.DB_NAME);
    console.log('Connecting to:', pool.options.database);

    try {
        const res = await pool.query('SELECT count(*) FROM fornecedores');
        console.log('Row count in fornecedores:', res.rows[0].count);

        const rows = await pool.query('SELECT for_nomered, for_tipo2 FROM fornecedores LIMIT 5');
        console.log('Sample rows:', rows.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
