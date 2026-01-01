const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function testMetricsEndpoint() {
    try {
        console.log('🧪 Testing Dashboard Metrics Function\n');

        // Test 1: Full year 2025
        console.log('📅 Test 1: Ano completo 2025');
        const year2025 = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2)',
            [2025, null]
        );
        const m = year2025.rows[0];
        console.log(`  Total Vendido: R$ ${parseFloat(m.total_vendido_current).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`  Quantidade: ${Math.round(parseFloat(m.quantidade_vendida_current)).toLocaleString('pt-BR')}`);
        console.log(`  Clientes: ${m.clientes_atendidos_current}`);
        console.log(`  Pedidos: ${m.qtd_pedidos_current}`);
        console.log(`  Variação Vendas: ${parseFloat(m.vendas_percent_change || 0).toFixed(2)}%\n`);

        // Test 2: Month 12 2025 (December)
        console.log('📅 Test 2: Dezembro 2025');
        const dec2025 = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2)',
            [2025, 12]
        );
        const m2 = dec2025.rows[0];
        console.log(`  Total Vendido: R$ ${parseFloat(m2.total_vendido_current).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`  Quantidade: ${Math.round(parseFloat(m2.quantidade_vendida_current)).toLocaleString('pt-BR')}`);
        console.log(`  Clientes: ${m2.clientes_atendidos_current}`);
        console.log(`  Pedidos: ${m2.qtd_pedidos_current}`);
        console.log(`  Variação Vendas vs Nov: ${parseFloat(m2.vendas_percent_change || 0).toFixed(2)}%\n`);

        console.log('✅ All tests passed!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testMetricsEndpoint();
