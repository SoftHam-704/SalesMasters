const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function createSalesComparisonFunction() {
    const client = await pool.connect();
    try {
        console.log('📝 Criando função de comparação de vendas...\n');

        const sqlPath = path.join(__dirname, '../scripts_bancodedados/14_create_sales_comparison_function.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Função criada com sucesso!\n');

        // Testar a função
        console.log('🧪 Testando fn_comparacao_vendas_mensais(2025, 2024)...');
        const result = await client.query('SELECT * FROM fn_comparacao_vendas_mensais(2025, 2024)');

        console.log(`   ✅ Retornou ${result.rows.length} meses\n`);

        if (result.rows.length > 0) {
            console.log('Primeiros 3 meses:');
            result.rows.slice(0, 3).forEach(row => {
                console.log(`   ${row.mes_nome}: 2025=R$ ${parseFloat(row.vendas_ano_atual).toFixed(2)}, 2024=R$ ${parseFloat(row.vendas_ano_anterior).toFixed(2)}, Var=${parseFloat(row.variacao_percentual).toFixed(2)}%`);
            });
        }

        console.log('\n✅ SUCESSO! Função está funcionando.');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createSalesComparisonFunction().catch(console.error);
