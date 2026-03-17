const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function cloneMissing() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME || 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false
    });

    const targetSchemas = ['lagrep', 'alcarep'];
    const missingTables = ['ia_conhecimento', 'ia_config', 'smart_importer_drafts'];
    const missingViews = ['vw_greenfield_performance', 'vw_greenfield_abc_clientes'];

    try {
        for (const schema of targetSchemas) {
            console.log(`\n🚀 Finalizando clonagem para ${schema}...`);

            // Clonar Tabelas
            for (const table of missingTables) {
                try {
                    await pool.query(`CREATE TABLE IF NOT EXISTS ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`);
                    console.log(`   - Tabela ${table} clonada.`);
                } catch (e) {
                    console.warn(`   ⚠️ Erro na tabela ${table}:`, e.message);
                }
            }

            // Clonar Views
            for (const viewName of missingViews) {
                try {
                    const res = await pool.query(`SELECT view_definition FROM information_schema.views WHERE table_schema = 'public' AND table_name = $1`, [viewName]);
                    if (res.rows.length > 0) {
                        let def = res.rows[0].view_definition;
                        // Substituir referências public. por [schema].
                        def = def.replace(/public\./g, `${schema}.`);
                        await pool.query(`CREATE OR REPLACE VIEW ${schema}.${viewName} AS ${def}`);
                        console.log(`   - View ${viewName} clonada.`);
                    }
                } catch (e) {
                    console.warn(`   ⚠️ Erro na view ${viewName}:`, e.message);
                }
            }
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

cloneMissing();
