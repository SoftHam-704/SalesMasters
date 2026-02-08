require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixInternalIP() {
    console.log('🔧 Configurando rota via IP Interno (10.100.28.17)...');

    const masterPool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        // IP interno descoberto na config do Mark-Press.
        // Isso evita o loopback externo e o bloqueio do localhost (que é local do node, não do db)
        const internalIP = '10.100.28.17';

        const updateQuery = `
            UPDATE empresas 
            SET db_host = $1,
                db_porta = 5432,
                db_usuario = 'app_internal', -- Usando o user novo que criamos que sabemos a senha
                db_senha = 'SoftHam@2026'
            WHERE db_host IS NOT NULL
        `;

        const res = await masterPool.query(updateQuery, [internalIP]);
        console.log(`✅ ${res.rowCount} empresas atualizadas para IP Interno ${internalIP}.`);

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await masterPool.end();
    }
}

fixInternalIP();
