require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function revertPort() {
    console.log('🔄 Revertendo porta para 5432...');

    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        // Voltar para porta 5432
        const updateQuery = `
            UPDATE empresas 
            SET db_porta = 5432
            WHERE db_host = $1
        `;

        await pool.query(updateQuery, [hostTarget]);
        console.log('✅ Porta revertida para 5432.');

        // Vamos verificar se o "webadmin" funciona na porta 5432
        // Se funcionar, pelo menos o acesso volta.
        // Se não, teremos que descobrir o usuário original.

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

revertPort();
