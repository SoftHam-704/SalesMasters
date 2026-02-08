require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixTenantHost() {
    console.log('🔄 Alterando host para localhost...');

    // Conecta no Master
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        // Atualiza para 'localhost' e mantém porta 5432
        // Isso força a aplicação a se conectar localmente no banco, evitando loop externo
        const updateQuery = `
            UPDATE empresas 
            SET db_host = 'localhost'
            WHERE db_host = $1
        `;

        const res = await pool.query(updateQuery, [hostTarget]);
        console.log(`✅ ${res.rowCount} empresas atualizadas para localhost.`);

        // Verifica resultado
        const resAll = await pool.query("SELECT id, razao_social, db_host, db_porta, db_usuario FROM empresas");
        console.table(resAll.rows);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

fixTenantHost();
