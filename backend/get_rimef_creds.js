require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function getRimefPassword() {
    try {
        const query = `
            SELECT id, razao_social, db_usuario, db_senha, db_porta
            FROM empresas 
            WHERE cnpj = '05122231000191'
        `;
        const result = await masterPool.query(query);
        console.log('Credenciais recuperadas:', result.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await masterPool.end();
    }
}

getRimefPassword();
