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
        const countRes = await pool.query('SELECT COUNT(*) FROM fornecedores');
        console.log('Total Suppliers:', countRes.rows[0].count);

        const listRes = await pool.query('SELECT for_codigo, for_nomered, for_situacao FROM fornecedores ORDER BY for_nomered');
        console.log('List of Suppliers:');
        listRes.rows.forEach(r => console.log(`${r.for_codigo}: ${r.for_nomered} (${r.for_situacao})`));

        pool.end();
    } catch (err) {
        console.error(err);
    }
}

check();
