const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false // Assumindo conexão local
});

async function run() {
    try {
        console.log("🔌 Conectando ao banco de dados...");
        const client = await pool.connect();

        console.log("📂 Lendo arquivo SQL enable_ia_all_schemas.sql...");
        const sqlPath = path.join(__dirname, 'migrations', 'enable_ia_all_schemas.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executando SQL para ativar IA em TODOS os schemas...");
        await client.query(sql);

        console.log("✅ Sucesso! Tabelas e Configurações criadas.");
        client.release();
    } catch (err) {
        console.error("❌ Erro:", err);
    } finally {
        await pool.end();
    }
}

run();
