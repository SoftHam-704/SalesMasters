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
        console.log('🚀 Iniciando atualização multi-schema (V4 - Limpeza Total)...');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Processando schema: ${schema}...`);

            await pool.query(`SET search_path TO ${schema}, public`);

            // 1. Dropar a VIEW primeiro para evitar erros de dependência e alteração de tipos
            console.log(`   🗑️ Removendo view vw_produtos_precos...`);
            await pool.query(`DROP VIEW IF EXISTS vw_produtos_precos CASCADE`);

            // 2. Buscar OIDs das variações da função fn_upsert_preco e fn_upsert_produto
            const findFuncsQuery = `
                SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args 
                FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = $1 AND p.proname IN ('fn_upsert_preco', 'fn_upsert_produto', 'fn_buscar_preco');
            `;
            const funcs = await pool.query(findFuncsQuery, [schema]);

            for (const row of funcs.rows) {
                const findTypesQuery = `
                    SELECT format_type(t, NULL) as type 
                    FROM unnest((SELECT proargtypes FROM pg_proc WHERE oid = $1)) t;
                `;
                const types = await pool.query(findTypesQuery, [row.oid]);
                const argTypes = types.rows.map(r => r.type).join(', ');

                console.log(`   🗑️ Removendo: ${schema}.${row.proname}(${argTypes})`);
                await pool.query(`DROP FUNCTION IF EXISTS ${schema}.${row.proname}(${argTypes}) CASCADE`);
            }

            // 3. Aplicar o arquivo SQL
            const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', '11_create_upsert_functions.sql');
            let baseSql = fs.readFileSync(sqlPath, 'utf8');

            // Remover DROPs manuais do SQL para usar nossa limpeza dinâmica
            baseSql = baseSql.replace(/DROP FUNCTION IF EXISTS [^;]+;/gi, '');
            baseSql = baseSql.replace(/DROP VIEW IF EXISTS [^;]+;/gi, '');

            console.log(`   ⚙️ Aplicando novas definições no schema ${schema}...`);
            await pool.query(baseSql);

            console.log(`✅ Schema ${schema} atualizado!`);
        }

        console.log('✨ Sincronização multi-schema CLOUD finalizada com sucesso!');
    } catch (err) {
        console.error('❌ Erro na sincronização:', err);
    } finally {
        await pool.end();
    }
}

updateAllSchemas();
