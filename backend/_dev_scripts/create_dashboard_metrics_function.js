const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

const fs = require('fs');
const path = require('path');

async function createFunction() {
    try {
        console.log('📊 Creating dashboard metrics function...');

        const sql = fs.readFileSync(
            path.join(__dirname, 'create_dashboard_metrics_function.sql'),
            'utf8'
        );

        await pool.query(sql);
        console.log('✅ Function created successfully!\n');

        // Test the function
        console.log('🧪 Testing function with 2025 data...\n');
        const result = await pool.query(
            'SELECT * FROM get_dashboard_metrics($1, $2)',
            [2025, null]
        );

        const metrics = result.rows[0];
        console.log('📊 Dashboard Metrics (2025 full year):');
        console.log(`  Total Vendido: R$ ${parseFloat(metrics.total_vendido_current).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`  Quantidade: ${parseFloat(metrics.quantidade_vendida_current).toLocaleString('pt-BR')}`);
        console.log(`  Clientes: ${metrics.clientes_atendidos_current}`);
        console.log(`  Pedidos: ${metrics.qtd_pedidos_current}`);
        console.log(`\n  Variações vs 2024:`);
        console.log(`  Vendas: ${metrics.vendas_percent_change?.toFixed(2)}%`);
        console.log(`  Quantidade: ${metrics.quantidade_percent_change?.toFixed(2)}%`);
        console.log(`  Clientes: ${metrics.clientes_percent_change?.toFixed(2)}%`);
        console.log(`  Pedidos: ${metrics.pedidos_percent_change?.toFixed(2)}%`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createFunction();
