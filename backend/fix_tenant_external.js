require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixTenantConfigExternal() {
    console.log('🔧 Configurando empresas para rota EXTERNA (IP Público) pois Localhost falha...');

    // Conecta no Master
    const pool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        const pass = process.env.MASTER_DB_PASSWORD;
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        // Configura para usar o host externo e a porta externa
        const updateQuery = `
            UPDATE empresas 
            SET db_usuario = 'webadmin', 
                db_senha = $1,
                db_host = $2,
                db_porta = 13062
            WHERE db_host = 'localhost' OR db_host = $2
        `;

        const res = await pool.query(updateQuery, [pass, hostTarget]);
        console.log(`✅ ${res.rowCount} empresas atualizadas para webadmin/${hostTarget}/13062.`);

        // Verifica resultado
        const resAll = await pool.query("SELECT id, razao_social, db_host, db_porta, db_usuario FROM empresas");
        console.table(resAll.rows);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

fixTenantConfigExternal();
