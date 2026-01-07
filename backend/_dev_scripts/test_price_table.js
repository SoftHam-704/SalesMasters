// ============================================================================
// Script de Teste - Tabela de Preços (CLOUD/LOCAL)
// ============================================================================

const { Pool } = require('pg');

// Configuração para banco LOCAL (teste CNPJ 00.000.000/0001-91)
const LOCAL_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
};

// Configuração para banco CLOUD (SaveInCloud - todos os outros CNPJs)
const CLOUD_CONFIG = {
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'ytAyO0u043'
};

async function testPriceTable(config, label) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Testando: ${label}`);
    console.log(`${'='.repeat(60)}\n`);

    const pool = new Pool(config);

    try {
        // 1. Testar conexão
        await pool.query('SELECT NOW()');
        console.log('✅ Conexão estabelecida');

        // 2. Listar tabelas disponíveis
        const tablesResult = await pool.query(`
            SELECT DISTINCT 
                itab_idindustria as industria,
                itab_tabela as nome_tabela,
                COUNT(*) as total_produtos
            FROM cad_tabelaspre
            GROUP BY itab_idindustria, itab_tabela
            ORDER BY itab_idindustria, itab_tabela
            LIMIT 5
        `);

        console.log(`\n📋 Tabelas de Preço Disponíveis:`);
        console.table(tablesResult.rows);

        if (tablesResult.rows.length > 0) {
            // 3. Testar a view vw_produtos_precos com a primeira tabela
            const firstTable = tablesResult.rows[0];
            console.log(`\n🔍 Testando produtos da tabela: ${firstTable.nome_tabela} (Indústria: ${firstTable.industria})`);

            const productsResult = await pool.query(`
                SELECT * 
                FROM vw_produtos_precos
                WHERE pro_industria = $1 
                  AND itab_tabela = $2
                LIMIT 5
            `, [firstTable.industria, firstTable.nome_tabela]);

            console.log(`\n✅ Produtos carregados: ${productsResult.rows.length}`);
            if (productsResult.rows.length > 0) {
                console.log('\n📦 Primeiros produtos:');
                console.table(productsResult.rows.map(p => ({
                    codigo: p.pro_codprod,
                    nome: p.pro_nome?.substring(0, 30),
                    preco: p.itab_precobruto,
                    ipi: p.itab_ipi,
                    st: p.itab_st
                })));
            } else {
                console.log('⚠️ PROBLEMA: View retornou 0 produtos!');

                // Verificar se a view existe
                const viewCheck = await pool.query(`
                    SELECT EXISTS (
                        SELECT FROM pg_views 
                        WHERE viewname = 'vw_produtos_precos'
                    ) as exists
                `);

                if (!viewCheck.rows[0].exists) {
                    console.log('❌ View vw_produtos_precos NÃO EXISTE!');
                    console.log('💡 Execute o script: scripts_bancodedados/repair_view.sql');
                } else {
                    console.log('✅ View existe, mas pode estar com problemas de estrutura');
                }
            }
        } else {
            console.log('⚠️ Nenhuma tabela de preço encontrada no banco!');
        }

    } catch (error) {
        console.error(`❌ Erro ao testar ${label}:`, error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

async function main() {
    console.log('\n🚀 TESTE DE TABELAS DE PREÇO - CLOUD vs LOCAL\n');

    // Testar CLOUD
    await testPriceTable(CLOUD_CONFIG, 'CLOUD (SaveInCloud)');

    // Testar LOCAL
    await testPriceTable(LOCAL_CONFIG, 'LOCAL (localhost)');

    console.log('\n✅ Testes concluídos!\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
