
const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function listEmpresas() {
    try {
        console.log('--- Buscando empresas no Banco Master ---');
        const result = await masterPool.query('SELECT id, cnpj, razao_social, db_host, db_nome, db_schema, status FROM empresas ORDER BY id');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('❌ Erro ao listar empresas:', error.message);
    } finally {
        await masterPool.end();
    }
}

listEmpresas();
