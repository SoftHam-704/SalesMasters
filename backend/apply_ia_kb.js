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

        console.log("📂 Lendo arquivo SQL create_ia_knowledge_table.sql...");
        const sqlPath = path.join(__dirname, 'migrations', 'create_ia_knowledge_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executando SQL para criar tabela de Conhecimento IA...");
        await client.query(sql);

        console.log("✅ Sucesso! Tabela criada e dados inseridos.");
        client.release();
    } catch (err) {
        console.error("❌ Erro:", err);
    } finally {
        await pool.end();
    }
}

run();
