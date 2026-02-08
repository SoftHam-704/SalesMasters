require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixTenantCredentials() {
    console.log('🔧 Atualizando credenciais das empresas para usar webadmin...');

    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    const webadminUser = process.env.MASTER_DB_USER;
    const webadminPass = process.env.MASTER_DB_PASSWORD;

    try {
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        console.log(`🛠️ Atualizando empresas no host ${hostTarget} para user: ${webadminUser}`);

        const updateQuery = `
            UPDATE empresas 
            SET db_usuario = $1, db_senha = $2
            WHERE db_host = $3
        `;

        const updateRes = await pool.query(updateQuery, [webadminUser, webadminPass, hostTarget]);
        console.log(`✅ ${updateRes.rowCount} empresas atualizadas com credenciais de admin!`);

        // Verificar
        const resAfter = await pool.query("SELECT id, razao_social, db_usuario FROM empresas WHERE db_host = $1", [hostTarget]);
        console.table(resAfter.rows);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

fixTenantCredentials();
