const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addIndex() {
    try {
        console.log('--- Adding Index idx_clientes_cli_regiao2 ---');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_clientes_cli_regiao2 
            ON clientes (cli_regiao2);
        `);
        console.log('Index created successfully.');
    } catch (err) {
        console.error('Error creating index:', err.message);
    } finally {
        pool.end();
    }
}

addIndex();
