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

const SCHEMAS_TO_UPDATE = ['public', 'repsoma', 'rimef', 'markpress', 'ndsrep', 'target'];

async function updateConversaoFunction() {
    try {
        console.log('🚀 Iniciando atualização da função fn_upsert_produto (Adição de Conversão)...');

        const sqlPath = path.join(__dirname, 'migrations', '20260205_add_conversao_upsert.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Processando schema: ${schema}...`);

            try {
                // Drop existing variations of fn_upsert_produto to avoid conflicts with new signature
                // We need to drop the specific 12-param version
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

                // In PostgreSQL, search_path affects how tables are found in the function if they are not schema-qualified.
                // Our migration uses "cad_prod" (not qualified), so we must set search_path.
                await pool.query(`SET search_path TO ${schema}, public`);

                console.log(`   ⚙️ Aplicando nova função (13 parâmetros) no schema ${schema}...`);
                await pool.query(sql);

                console.log(`✅ Schema ${schema} atualizado!`);
            } catch (schemaErr) {
                console.error(`❌ Erro no schema ${schema}:`, schemaErr.message);
            }
        }

        console.log('✨ Atualização finalizada com sucesso!');
    } catch (err) {
        console.error('❌ Erro global:', err);
    } finally {
        await pool.end();
    }
}

updateConversaoFunction();
