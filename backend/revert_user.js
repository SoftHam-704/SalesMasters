require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function revertUserToSistemas() {
    console.log('🔄 Revertendo usuário para "sistemas" com a senha descoberta...');

    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const updateQuery = `
            UPDATE empresas 
            SET db_usuario = 'sistemas', db_senha = 'hamilton123'
            WHERE db_host = 'localhost' AND db_usuario = 'webadmin'
        `;

        const res = await pool.query(updateQuery);
        console.log(`✅ ${res.rowCount} empresas atualizadas para user=sistemas.`);

        // Verifica resultado
        const resAll = await pool.query("SELECT id, razao_social, db_host, db_porta, db_usuario FROM empresas");
        console.table(resAll.rows);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

revertUserToSistemas();
