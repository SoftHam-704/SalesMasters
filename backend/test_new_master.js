const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function test() {
    try {
        console.log('Querying empresas details...');
        const res = await p.query('SELECT razao_social, db_host, db_porta, db_nome FROM empresas');
        console.log('Empresas:', res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await p.end();
    }
}

test();
