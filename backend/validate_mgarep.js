const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function validateSchema() {
    try {
        console.log("🔍 Validando Schema: mgarep");

        const tables = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'mgarep'");
        console.log(`- Tabelas: ${tables.rows[0].count}`);

        const functions = await pool.query(`
            SELECT count(*) 
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'mgarep'
        `);
        console.log(`- Funções: ${functions.rows[0].count}`);

        const views = await pool.query("SELECT count(*) FROM pg_views WHERE schemaname = 'mgarep'");
        console.log(`- Views: ${views.rows[0].count}`);

        // Teste de uma função crítica
        console.log("🧪 Testando get_dashboard_metrics_v4 no schema mgarep...");
        const testFunc = await pool.query("SELECT * FROM mgarep.get_dashboard_metrics_v4(2025, 3)");
        console.log("- Resultado da função (vazio esperado):", testFunc.rows.length > 0 ? "Com dados" : "Vazio (OK)");

        console.log("\n✅ Validação concluída.");
    } catch (err) {
        console.error("❌ Erro na validação:", err.message);
    } finally {
        await pool.end();
    }
}
validateSchema();
