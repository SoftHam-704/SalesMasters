
const { Pool } = require('pg');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

const pool = new Pool(config);

async function check() {
    try {
        const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'produtos'");
        console.log('Tabelas "produtos" encontradas:');
        res.rows.forEach(row => console.log(` - ${row.table_schema}.${row.table_name}`));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
