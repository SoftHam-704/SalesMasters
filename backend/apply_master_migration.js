const { masterPool } = require('./utils/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
    try {
        console.log("🔌 Conectando ao Banco Master...");
        const client = await masterPool.connect();

        console.log("📂 Lendo arquivo SQL add_feature_flags_master.sql...");
        const sqlPath = path.join(__dirname, 'migrations', 'add_feature_flags_master.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Executando SQL para criar flags de recursos...");
        await client.query(sql);

        console.log("✅ Colunas de Features criadas/atualizadas com sucesso!");

        // Verifica o resultado
        const res = await client.query("SELECT razao_social, modulo_bi_ativo, modulo_whatsapp_ativo, plano_ia_nivel FROM empresas");
        console.table(res.rows);

        client.release();
    } catch (err) {
        console.error("❌ Erro:", err);
    } finally {
        await masterPool.end();
    }
}

run();
