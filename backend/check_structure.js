// Script para descobrir a estrutura da tabela cad_tabelaspre
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432,
});

async function checkTableStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela cad_tabelaspre...\n');

        const query = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'cad_tabelaspre'
            ORDER BY ordinal_position;
        `;

        const result = await pool.query(query);

        console.log('📋 Colunas da tabela cad_tabelaspre:');
        console.log('=====================================\n');
        result.rows.forEach((col, idx) => {
            console.log(`${idx + 1}. ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
        });

        // Buscar uma amostra de dados
        console.log('\n\n📊 Amostra de dados (primeiras 3 linhas):');
        console.log('==========================================\n');
        const sampleQuery = 'SELECT * FROM cad_tabelaspre LIMIT 3';
        const sampleResult = await pool.query(sampleQuery);

        if (sampleResult.rows.length > 0) {
            console.log(JSON.stringify(sampleResult.rows, null, 2));
        } else {
            console.log('⚠️ Tabela vazia');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkTableStructure();
