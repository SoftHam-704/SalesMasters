const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function deployInsightAllSchemas() {
    console.log('🔍 Iniciando implantação Multi-Tenant do Aura Client Insight...');

    try {
        const sqlTemplate = fs.readFileSync(path.join(__dirname, 'sql', 'fn_gerencial_clientes.sql'), 'utf8');

        // List all relevant schemas
        const schemasResult = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            AND schema_name NOT LIKE 'pg_temp_%'
            AND schema_name NOT LIKE 'pg_toast_temp_%'
        `);

        const schemas = schemasResult.rows.map(r => r.schema_name);
        console.log(`Foram encontrados ${schemas.length} schemas.`);

        for (const schema of schemas) {
            // Check if essential tables exist in this schema
            const tableCheck = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = $1 
                AND table_name IN ('clientes', 'pedidos', 'itens_ped')
            `, [schema]);

            if (tableCheck.rowCount < 3) {
                // console.log(`⏩ Ignorando schema ${schema} (faltam tabelas essenciais).`);
                continue;
            }

            try {
                // Ensure function is schema-scoped by setting search_path during creation
                await pool.query(`SET search_path TO ${schema}, public`);

                // CRITICAL: Drop existing function first because changing RETURN TABLE signature 
                // requires a full drop in PostgreSQL.
                await pool.query(`DROP FUNCTION IF EXISTS fn_gerencial_clientes()`);

                await pool.query(sqlTemplate);
                console.log(`✅ Função fn_gerencial_clientes aplicada no schema: ${schema}`);
            } catch (err) {
                console.error(`❌ Erro ao aplicar no schema ${schema}:`, err.message);
            }
        }
    } catch (err) {
        console.error('❌ Erro fatal durante a implantação:', err.message);
    } finally {
        await pool.end();
    }
}

deployInsightAllSchemas();
