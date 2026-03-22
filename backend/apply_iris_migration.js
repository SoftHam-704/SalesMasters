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
        console.log(`📡 DB: ${process.env.DB_DATABASE || process.env.DB_NAME} on ${process.env.DB_HOST}`);

        console.log("📂 Lendo arquivo SQL iris_v1.sql...");
        const sqlPath = path.join(__dirname, 'migrations', 'iris_v1.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executando SQL para migração Iris em TODOS os schemas...");
        await client.query(sql);

        console.log("✅ Sucesso! Migração concluída.");
        client.release();
    } catch (err) {
        console.error("❌ Erro durante a migração:", err.message);
    } finally {
        await pool.end();
    }
}

run();
