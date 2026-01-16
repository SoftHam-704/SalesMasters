require('dotenv').config();
const { Pool } = require('pg');

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function listTenants() {
    try {
        const result = await masterPool.query('SELECT nome, cnpj, db_name, db_schema FROM tenants ORDER BY nome');
        console.table(result.rows);
        await masterPool.end();
    } catch (error) {
        console.error('Error:', error);
        await masterPool.end();
    }
}

listTenants();
