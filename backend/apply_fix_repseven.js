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
    ssl: false
});

async function run() {
    try {
        console.log("🔌 Conectando ao banco de dados...");
        const client = await pool.connect();

        console.log("📂 Lendo arquivo SQL fix_dashboard_metrics_v5.sql...");
        const sqlPath = path.join(__dirname, 'sql', 'fix_dashboard_metrics_v5.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executando SQL para corrigir get_dashboard_metrics em TODOS os schemas (incluindo repseven)...");
        await client.query(sql);

        console.log("✅ Sucesso! Função recriada.");
        client.release();
    } catch (err) {
        console.error("❌ Erro:", err);
    } finally {
        await pool.end();
    }
}

run();
