const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const SCHEMAS_TO_UPDATE = ['remap', 'ro_consult', 'brasil_wl'];

async function updateMissingSchemas() {
    try {
        console.log('🚀 Iniciando atualização dos schemas faltantes (Remap, Ro_Consult, Brasil_WL)...');

        const sqlPath = path.join(__dirname, 'migrations', '20260205_add_conversao_upsert.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Processando schema: ${schema}...`);

            try {
                // Verificar se o schema existe antes de tentar atualizar
                const schemaCheck = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1", [schema]);
                if (schemaCheck.rows.length === 0) {
                    console.warn(`⚠️ Schema ${schema} não existe neste banco de dados. Pulando...`);
                    continue;
                }

                // Drop existing variations of fn_upsert_produto
                const findFuncsQuery = `
                    SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args 
                    FROM pg_proc p 
                    JOIN pg_namespace n ON p.pronamespace = n.oid 
                    WHERE n.nspname = $1 AND p.proname = 'fn_upsert_produto';
                `;
                const funcs = await pool.query(findFuncsQuery, [schema]);

                for (const row of funcs.rows) {
                    const findTypesQuery = `
                        SELECT format_type(t, NULL) as type 
                        FROM unnest((SELECT proargtypes FROM pg_proc WHERE oid = $1)) t;
                    `;
                    const types = await pool.query(findTypesQuery, [row.oid]);
                    const argTypes = types.rows.map(r => r.type).join(', ');

                    console.log(`   🗑️ Removendo versão antiga: ${schema}.${row.proname}(${argTypes})`);
                    await pool.query(`DROP FUNCTION IF EXISTS ${schema}.${row.proname}(${argTypes}) CASCADE`);
                }

                await pool.query(`SET search_path TO ${schema}, public`);

                console.log(`   ⚙️ Aplicando nova função (13 parâmetros) no schema ${schema}...`);
                await pool.query(sql);

                console.log(`✅ Schema ${schema} atualizado!`);
            } catch (schemaErr) {
                console.error(`❌ Erro no schema ${schema}:`, schemaErr.message);
            }
        }

        console.log('✨ Sincronização faltante finalizada!');
    } catch (err) {
        console.error('❌ Erro global:', err);
    } finally {
        await pool.end();
    }
}

updateMissingSchemas();
