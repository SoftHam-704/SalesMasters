require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function createInternalUserEverywhere() {
    const config = {
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT || 13062,
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    };

    const dbs = ['basesales', 'base_student', 'salesmasters_master'];

    for (const dbName of dbs) {
        console.log(`📡 Criando/Verificando user "app_internal" no banco ${dbName}...`);
        const pool = new Pool({ ...config, database: dbName });

        try {
            const client = await pool.connect();

            // Em Postgres, ROLES são globais à instância, mas o privilégio de LOGIN e privilégios de banco são específicos.
            // Na verdade, CREATE ROLE é global. Se já criei em 'basesales', ele já existe na instância.
            // Mas as permissões (GRANT) são por banco/schema.

            await client.query("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_internal') THEN CREATE ROLE app_internal WITH LOGIN PASSWORD 'SoftHam@2026'; END IF; END $$;");
            await client.query("ALTER ROLE app_internal WITH LOGIN PASSWORD 'SoftHam@2026'");

            console.log(`✅ User app_internal verificado no banco ${dbName}.`);
            client.release();
        } catch (err) {
            console.error(`❌ Erro no banco ${dbName}:`, err.message);
        } finally {
            await pool.end();
        }
    }
}

createInternalUserEverywhere();
