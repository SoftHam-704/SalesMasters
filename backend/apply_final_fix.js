require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function applyFix() {
    console.log('🚀 Aplicando correção de Roteamento Interno (Localhost + app_internal)...');

    // Conecta no Master usando credenciais de ADMIN (Externo)
    const masterPool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        // Atualiza todas as empresas para usar o caminho interno (localhost)
        // Usando o usuário 'app_internal' que criamos e sabemos a senha
        // Porta 5432 (Padrão interna do Postgres)

        const updateQuery = `
            UPDATE empresas 
            SET db_host = 'localhost',
                db_porta = 5432,
                db_usuario = 'app_internal',
                db_senha = 'SoftHam@2026'
            WHERE db_host IS NOT NULL
        `;

        const res = await masterPool.query(updateQuery);
        console.log(`✅ ${res.rowCount} configurações de empresas corrigidas.`);

        console.log('🔄 Reiniciando serviços simulados...');

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await masterPool.end();
    }
}

applyFix();
