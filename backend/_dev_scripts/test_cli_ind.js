// Test CLI_IND endpoint and data
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function testCliInd() {
    try {
        console.log('🔍 Testando CLI_IND...\n');

        // 1. Verificar total de registros
        const countResult = await pool.query('SELECT COUNT(*) as total FROM cli_ind');
        console.log(`✅ Total de registros em CLI_IND: ${countResult.rows[0].total}\n`);

        // 2. Buscar um exemplo de registro
        const sampleResult = await pool.query(`
            SELECT 
                cli_codigo,
                cli_forcodigo,
                cli_desc1,
                cli_desc2,
                cli_desc3,
                cli_transportadora,
                cli_prazopg,
                cli_comprador,
                cli_frete
            FROM cli_ind 
            WHERE cli_desc1 IS NOT NULL 
            LIMIT 1
        `);

        if (sampleResult.rows.length > 0) {
            console.log('📋 Exemplo de registro:');
            console.log(JSON.stringify(sampleResult.rows[0], null, 2));
            console.log('\n✅ Estrutura da tabela OK!\n');

            // 3. Testar endpoint simulado
            console.log('🎯 Para testar o endpoint, use:');
            console.log(`   GET http://localhost:3005/api/cli-ind/${sampleResult.rows[0].cli_codigo}/${sampleResult.rows[0].cli_forcodigo}`);
        } else {
            console.log('⚠️  Nenhum registro encontrado com descontos preenchidos');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

testCliInd();
