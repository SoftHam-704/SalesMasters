require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function checkRimefConfig() {
    try {
        const query = `
            SELECT id, razao_social, db_host, db_porta, db_nome, db_usuario, db_schema
            FROM empresas 
            WHERE cnpj = '05122231000191'
        `;
        const result = await masterPool.query(query);
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await masterPool.end();
    }
}

checkRimefConfig();
