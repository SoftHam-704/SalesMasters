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

async function createQuantitiesComparisonFunction() {
    const client = await pool.connect();
    try {
        console.log('📝 Criando função de comparação de quantidades...\n');

        const sqlPath = path.join(__dirname, '../scripts_bancodedados/15_create_quantities_comparison_function.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Função criada com sucesso!\n');

        // Testar a função
        console.log('🧪 Testando fn_comparacao_quantidades_mensais(2025, 2024)...');
        const result = await client.query('SELECT * FROM fn_comparacao_quantidades_mensais(2025, 2024)');

        console.log(`   ✅ Retornou ${result.rows.length} meses\n`);

        if (result.rows.length > 0) {
            console.log('Primeiros 3 meses:');
            result.rows.slice(0, 3).forEach(row => {
                console.log(`   ${row.mes_nome}: 2025=${parseFloat(row.quantidade_ano_atual).toFixed(0)} un, 2024=${parseFloat(row.quantidade_ano_anterior).toFixed(0)} un`);
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

createQuantitiesComparisonFunction().catch(console.error);
