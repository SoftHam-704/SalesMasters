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

async function runMigration() {
    const sqlPath = path.join(__dirname, 'migrations', '20260204_fix_upsert_logic.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('🚀 Iniciando migração...');
        await pool.query(sql);
        console.log('✅ Migração concluída com sucesso!');
    } catch (err) {
        console.error('❌ Erro na migração:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
