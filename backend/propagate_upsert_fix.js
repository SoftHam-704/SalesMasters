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
    const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', '11_create_upsert_functions.sql');
    const baseSql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('🚀 Iniciando atualização multi-schema...');

        for (const schema of SCHEMAS_TO_UPDATE) {
            console.log(`📦 Atualizando schema: ${schema}...`);

            // Ajustar o SQL para o schema específico
            // Removemos declarações de schema fixas se houver, ou forçamos o search_path
            await pool.query(`SET search_path TO ${schema}, public`);

            // Executar o SQL para atualizar as funções no schema atual
            await pool.query(baseSql);

            console.log(`✅ Schema ${schema} atualizado!`);
        }

        console.log('✨ Todos os schemas foram sincronizados com a nova lógica de UPSERT!');
    } catch (err) {
        console.error('❌ Erro durante a atualização multi-schema:', err);
    } finally {
        await pool.end();
    }
}

updateAllSchemas();
