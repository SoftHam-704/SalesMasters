const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupLocalDB() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'basesales',
        user: 'postgres',
        password: '@12Pilabo',
    });

    const sqlFiles = [
        '14_create_sales_comparison_function.sql',
        '15_create_quantities_comparison_function.sql',
        '17_create_bi_intelligence_functions.sql' // Contém top-clients, metrics, etc.
    ];

    const scriptsDir = path.join(__dirname, '../../scripts_bancodedados');

    console.log('🚀 Iniciando atualização das funções do dashboard no banco LOCAL...');

    const client = await pool.connect();
    try {
        for (const file of sqlFiles) {
            const filePath = path.join(scriptsDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`📝 Aplicando: ${file}...`);
                const sql = fs.readFileSync(filePath, 'utf8');
                await client.query(sql);
                console.log(`✅ ${file} aplicado com sucesso!`);
            } else {
                console.warn(`⚠️ Arquivo não encontrado: ${filePath}`);
            }
        }

        console.log('\n✅ Todas as funções foram atualizadas no banco LOCAL.');

        // Testar se as funções existem
        console.log('\n🧪 Testando funções críticas...');
        try {
            const metrics = await client.query("SELECT * FROM get_dashboard_metrics(2025, NULL)");
            console.log('📊 get_dashboard_metrics: OK');
        } catch (e) {
            console.error('❌ get_dashboard_metrics: FALHOU', e.message);
        }

    } catch (error) {
        console.error('❌ Erro crítico no setup:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

setupLocalDB();
