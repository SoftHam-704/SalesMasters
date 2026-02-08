require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function listEmpresas() {
    try {
        const result = await pool.query('SELECT id, cnpj, razao_social, status, db_schema FROM empresas');
        console.table(result.rows);
        await pool.end();
    } catch (err) {
        console.error(err);
        await pool.end();
    }
}

listEmpresas();
