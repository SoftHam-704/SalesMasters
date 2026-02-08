require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function grantAllPermissions() {
    // 1. Conectar via ADMIN externo para garantir poder de grant
    const config = {
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT || 13062,
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    };

    const dbs = ['basesales', 'base_student'];

    for (const dbName of dbs) {
        console.log(`📡 Conectando ao banco ${dbName} para aplicar permissões...`);
        const pool = new Pool({ ...config, database: dbName });

        try {
            const client = await pool.connect();

            // Buscar todos os schemas (exceto os do sistema)
            const schemaRes = await client.query(`
                SELECT schema_name 
                FROM information_schema.schemata 
                WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            `);

            const schemas = schemaRes.rows.map(r => r.schema_name);
            console.log(`📋 Schemas encontrados em ${dbName}: ${schemas.join(', ')}`);

            for (const schema of schemas) {
                console.log(`🔓 Garantindo permissões no schema: ${schema}`);
                await client.query(`GRANT USAGE ON SCHEMA "${schema}" TO app_internal`);
                await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "${schema}" TO app_internal`);
                await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "${schema}" TO app_internal`);
                await client.query(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "${schema}" TO app_internal`);
                // Permissões para tabelas futuras
                await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT ALL PRIVILEGES ON TABLES TO app_internal`);
            }

            client.release();
        } catch (err) {
            console.error(`❌ Erro no banco ${dbName}:`, err.message);
        } finally {
            await pool.end();
        }
    }
}

grantAllPermissions();
