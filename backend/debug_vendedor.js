
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
        const res = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'vendedores'");
        console.log("Table 'vendedores' exists:", res.rows.length > 0);

        if (res.rows.length > 0) {
            const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendedores'");
            console.log("Columns:", cols.rows.map(r => r.column_name));

            const data = await pool.query("SELECT * FROM vendedores LIMIT 5");
            console.log("Data sample:", data.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
