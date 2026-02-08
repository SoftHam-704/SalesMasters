require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function fixInternalAccess() {
    console.log('🔧 Criando usuário "app_internal" para garantir acesso local...');

    // 1. Conectar como Super Admin (Webadmin) no banco de dados dos Tenants (basesales)
    // Usamos a conexão externa que sabemos que funciona DAQUI
    const limitsConfig = {
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT || 13062,
        database: 'basesales', // Banco onde ficam os schemas
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    };

    const pool = new Pool(limitsConfig);

    try {
        const client = await pool.connect();

        // 2. Criar ou atualizar usuário 'app_internal'
        // Damos permissão de superuser ou apenas connect/usage para garantir
        try {
            console.log('👤 Criando role app_internal...');
            await client.query("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_internal') THEN CREATE ROLE app_internal WITH LOGIN PASSWORD 'SoftHam@2026'; END IF; END $$;");
            await client.query("ALTER ROLE app_internal WITH LOGIN PASSWORD 'SoftHam@2026'");
            // Garantir permissões em todos os schemas
            await client.query("GRANT USAGE ON SCHEMA rimef TO app_internal");
            await client.query("GRANT USAGE ON SCHEMA public TO app_internal");
            // Liberar select em todas as tabelas (simplificação para resolver rápido)
            await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rimef TO app_internal");
            await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_internal");
            console.log('✅ Usuário app_internal configurado.');
        } catch (e) {
            console.log('⚠️ Aviso ao criar user:', e.message);
        }

        client.release();
        await pool.end();

        // 3. Atualizar a tabela de empresas no Master para usar esse novo user LOCALHOST
        const masterPool = new Pool({
            host: process.env.MASTER_DB_HOST,
            port: process.env.MASTER_DB_PORT,
            database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
            user: process.env.MASTER_DB_USER,
            password: process.env.MASTER_DB_PASSWORD
        });

        console.log('📝 Atualizando configurações das empresas para usar localhost + app_internal...');
        const hostTarget = 'node254557-salesmaster.sp1.br.saveincloud.net.br';

        // Atualiza todas que estão no servidor cloud (seja via IP externo ou localhost)
        const updateQuery = `
            UPDATE empresas 
            SET db_host = 'localhost',
                db_porta = 5432,
                db_usuario = 'app_internal',
                db_senha = 'SoftHam@2026'
            WHERE db_host = $1 OR db_host = 'localhost'
        `;

        const res = await masterPool.query(updateQuery, [hostTarget]);
        console.log(`✅ ${res.rowCount} empresas atualizadas.`);
        await masterPool.end();

    } catch (err) {
        console.error('❌ Erro CRÍTICO:', err);
    }
}

fixInternalAccess();
