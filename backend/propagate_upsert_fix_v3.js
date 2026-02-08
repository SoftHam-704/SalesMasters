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

async function updateAllSchemas() {
    try {
        console.log('🚀 Iniciando atualização multi-schema (V3 - Limpeza por OID)...');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Investigando schema: ${schema}...`);

            // Buscar OIDs das variações da função fn_upsert_preco no schema
            const findFuncsQuery = `
                SELECT p.oid, pg_get_function_arguments(p.oid) as args 
                FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = $1 AND p.proname = 'fn_upsert_preco';
            `;
            const funcs = await pool.query(findFuncsQuery, [schema]);

            for (const row of funcs.rows) {
                // Ao invés de usar DROP FUNCTION com argumentos (que pode vir com DEFAULTs problemáticos),
                // vamos construir o DROP apenas com os TIPOS dos argumentos, que é o padrão do Postgres.

                const findTypesQuery = `
                    SELECT format_type(t, NULL) as type 
                    FROM unnest((SELECT proargtypes FROM pg_proc WHERE oid = $1)) t;
                `;
                const types = await pool.query(findTypesQuery, [row.oid]);
                const argTypes = types.rows.map(r => r.type).join(', ');

                console.log(`   🗑️ Removendo: ${schema}.fn_upsert_preco(${argTypes})`);
                await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_upsert_preco(${argTypes}) CASCADE`);
            }

            // Aplicar o arquivo SQL
            const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', '11_create_upsert_functions.sql');
            let baseSql = fs.readFileSync(sqlPath, 'utf8');

            // Remover DROP manual problemático do SQL
            baseSql = baseSql.replace(/DROP FUNCTION IF EXISTS fn_upsert_preco[^;]+;/gi, '');

            console.log(`   ⚙️ Aplicando novas definições no schema ${schema}...`);
            await pool.query(`SET search_path TO ${schema}, public`);
            await pool.query(baseSql);

            console.log(`✅ Schema ${schema} atualizado!`);
        }

        console.log('✨ Sincronização multi-schema CLOUD finalizada!');
    } catch (err) {
        console.error('❌ Erro na sincronização:', err);
    } finally {
        await pool.end();
    }
}

updateAllSchemas();
