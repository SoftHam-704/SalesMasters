// Script de teste para verificar tabelas da indústria 12
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432,
});

async function testQuery() {
    try {
        console.log('🔍 Testando query para indústria 12 (STAHL)...\n');

        const query = `
            SELECT DISTINCT 
                itab_tabela as nome_tabela,
                COUNT(*) as total_produtos,
                MIN(itab_datatabela) as data_criacao,
                MAX(itab_datavencimento) as data_vencimento,
                BOOL_AND(itab_status) as todas_ativas
            FROM cad_tabelaspre
            WHERE itab_industria = $1
            GROUP BY itab_tabela
            ORDER BY itab_tabela
        `;

        const result = await pool.query(query, [12]);

        console.log('✅ Query executada com sucesso!');
        console.log(`📊 Total de tabelas encontradas: ${result.rows.length}\n`);

        if (result.rows.length > 0) {
            console.log('📋 Tabelas encontradas:');
            result.rows.forEach((row, idx) => {
                console.log(`\n${idx + 1}. ${row.nome_tabela}`);
                console.log(`   - Total de produtos: ${row.total_produtos}`);
                console.log(`   - Data criação: ${row.data_criacao}`);
                console.log(`   - Data vencimento: ${row.data_vencimento}`);
                console.log(`   - Todas ativas: ${row.todas_ativas}`);
            });
        } else {
            console.log('⚠️ Nenhuma tabela encontrada para a indústria 12');

            // Verificar se existem dados na tabela
            const checkData = await pool.query(
                'SELECT COUNT(*) as total FROM cad_tabelaspre WHERE itab_industria = $1',
                [12]
            );
            console.log(`\n📊 Total de registros para indústria 12: ${checkData.rows[0].total}`);

            if (checkData.rows[0].total > 0) {
                const sample = await pool.query(
                    'SELECT * FROM cad_tabelaspre WHERE itab_industria = $1 LIMIT 3',
                    [12]
                );
                console.log('\n📝 Amostra de dados:');
                console.log(JSON.stringify(sample.rows, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Erro ao executar query:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

testQuery();
