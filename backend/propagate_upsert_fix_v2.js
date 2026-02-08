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
        console.log('🚀 Iniciando atualização multi-schema (Versão Robusta)...');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Investigando schema: ${schema}...`);

            // Buscar todas as variações da função fn_upsert_preco no schema
            const findFuncsQuery = `
                SELECT pg_get_function_arguments(p.oid) as args 
                FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = $1 AND p.proname = 'fn_upsert_preco';
            `;
            const funcs = await pool.query(findFuncsQuery, [schema]);

            for (const row of funcs.rows) {
                console.log(`   🗑️ Removendo variação: fn_upsert_preco(${row.args})`);
                await pool.query(`DROP FUNCTION IF EXISTS ${schema}.fn_upsert_preco(${row.args}) CASCADE`);
            }

            // Agora aplicar o arquivo SQL configurando o search_path
            const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', '11_create_upsert_functions.sql');
            let baseSql = fs.readFileSync(sqlPath, 'utf8');

            // Remover qualquer DROP FUNCTION problemático do texto para evitar loops
            baseSql = baseSql.replace(/DROP FUNCTION IF EXISTS fn_upsert_preco[^;]+;/gi, '');

            console.log(`   ⚙️ Aplicando novas definições no schema ${schema}...`);
            await pool.query(`SET search_path TO ${schema}, public`);
            await pool.query(baseSql);

            console.log(`✅ Schema ${schema} atualizado!`);
        }

        console.log('✨ Todos os schemas foram sincronizados com sucesso!');
    } catch (err) {
        console.error('❌ Erro durante a atualização multi-schema:', err);
    } finally {
        await pool.end();
    }
}

updateAllSchemas();
