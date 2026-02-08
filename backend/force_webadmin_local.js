require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function forceWebadmin() {
    console.log('🔧 Forçando user webadmin nas empresas (Porta 5432)...');

    // Conecta no Master
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const pass = process.env.MASTER_DB_PASSWORD; // ytAyO0u043

        // Atualiza para webadmin, senha correta, localhost, porta 5432
        const updateQuery = `
            UPDATE empresas 
            SET db_usuario = 'webadmin', 
                db_senha = $1,
                db_host = 'localhost',
                db_porta = 5432
            WHERE db_host = 'node254557-salesmaster.sp1.br.saveincloud.net.br' OR db_host = 'localhost'
        `;

        const res = await pool.query(updateQuery, [pass]);
        console.log(`✅ ${res.rowCount} empresas atualizadas para webadmin/localhost/5432.`);

        // Verifica resultado
        const resAll = await pool.query("SELECT id, razao_social, db_host, db_porta, db_usuario FROM empresas");
        console.table(resAll.rows);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

forceWebadmin();
