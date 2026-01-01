const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function createSalesAnalysisFunctions() {
    const client = await pool.connect();
    try {
        console.log('📝 Criando funções de análise de vendas...\n');

        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, '../scripts_bancodedados/13_create_sales_analysis_functions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Funções criadas com sucesso!\n');

        // Testar as funções
        console.log('🧪 Testando fn_analise_vendas_produto...');
        const testSales = await client.query(
            "SELECT * FROM fn_analise_vendas_produto(20, '11002048', '2024-01-01', '2024-12-31', 'F')"
        );
        console.log(`   ✅ Retornou ${testSales.rows.length} registros`);
        if (testSales.rows.length > 0) {
            console.log('   Exemplo:', testSales.rows[0]);
        }

        console.log('\n🧪 Testando fn_clientes_compraram_produto...');
        const testCustomers = await client.query(
            "SELECT * FROM fn_clientes_compraram_produto(20, '11002048', '2024-01-01', '2024-12-31') LIMIT 5"
        );
        console.log(`   ✅ Retornou ${testCustomers.rows.length} clientes`);

        console.log('\n🧪 Testando fn_clientes_nunca_compraram_produto...');
        const testNever = await client.query(
            "SELECT * FROM fn_clientes_nunca_compraram_produto(20, '11002048') LIMIT 5"
        );
        console.log(`   ✅ Retornou ${testNever.rows.length} clientes`);

        console.log('\n✅ SUCESSO! Todas as funções estão funcionando.');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createSalesAnalysisFunctions().catch(console.error);
