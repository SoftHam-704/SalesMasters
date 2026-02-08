require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

pool.query('SELECT id, cnpj, razao_social, db_host, db_porta, db_nome, db_schema, db_usuario FROM empresas', (err, res) => {
    if (err) {
        console.error('Error executing query', err.stack);
    } else {
        console.table(res.rows);
    }
    pool.end();
});
