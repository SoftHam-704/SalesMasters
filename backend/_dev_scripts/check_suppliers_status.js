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
        const listRes = await pool.query('SELECT for_codigo, for_nomered, for_tipo2 FROM fornecedores ORDER BY for_nomered');
        console.log('List of Suppliers:');
        listRes.rows.forEach(r => console.log(`${r.for_codigo}: ${r.for_nomered} [${r.for_tipo2}]`));

        pool.end();
    } catch (err) {
        console.error(err);
    }
}

check();
