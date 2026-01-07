// Script resumido para resolver o problema da tabela de preços DEFINITIVAMENTE
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function fixFinal() {
    try {
        console.log('\n🎯 SOLUÇÃO DEFINITIVA - TABELA DE PREÇOS\n');

        // 1. Verificar status dos produtos
        console.log('1️⃣ Verificando produtos da Indústria 1...\n');
        const statusCheck = await pool.query(`
            SELECT 
                pro_status,
                COUNT(*) as total
            FROM cad_prod
            WHERE pro_industria = 1
            GROUP BY pro_status
        `);
        console.table(statusCheck.rows);

        if (statusCheck.rows.length === 0 || !statusCheck.rows.some(r => r.pro_status === true)) {
            console.log('\n⚠️ PROBLEMA: Produtos da indústria 1 estão com status=false!');
            console.log('💡 Ativando produtos...\n');

            await pool.query(`
                UPDATE cad_prod 
                SET pro_status = true 
                WHERE pro_industria = 1
            `);

            console.log('✅ Produtos ativados!\n');
        }

        // 2. Recriar view SEM filtro de status
        console.log('2️⃣ Recriando view SEM filtro de pro_status...\n');

        await pool.query(`DROP VIEW IF EXISTS vw_produtos_precos CASCADE`);

        await pool.query(`
            CREATE OR REPLACE VIEW vw_produtos_precos AS
            SELECT 
                p.pro_id,
                p.pro_industria,
                COALESCE(f.for_nomered, 'Indústria ' || p.pro_industria) as industria_nome,
                p.pro_codprod,
                p.pro_codigonormalizado,
                p.pro_nome,
                p.pro_grupo,
                p.pro_ncm,
                t.itab_tabela,
                t.itab_precobruto,
                t.itab_precopromo,
                t.itab_precoespecial,
                t.itab_ipi,
                t.itab_st,
                t.itab_grupodesconto,
                t.itab_datatabela,
                t.itab_datavencimento,
                t.itab_status,
                ROUND(CAST(t.itab_precobruto * (1 + COALESCE(t.itab_ipi, 0) / 100) AS numeric), 2) as preco_com_ipi
            FROM cad_tabelaspre t
            INNER JOIN cad_prod p ON p.pro_id = t.itab_idprod
            LEFT JOIN fornecedores f ON f.for_codigo = p.pro_industria
        `);

        console.log('✅ View recriada!\n');

        // 3. Teste Final
        console.log('3️⃣ TESTE FINAL - Todas as tabelas:\n');
        const finalTest = await pool.query(`
            SELECT 
                pro_industria,
                itab_tabela,
                COUNT(*) as total_produtos
            FROM vw_produtos_precos
            GROUP BY pro_industria, itab_tabela
            ORDER BY pro_industria, itab_tabela
        `);

        console.table(finalTest.rows);

        console.log(`\n✅ TOTAL: ${finalTest.rows.reduce((sum, r) => sum + parseInt(r.total_produtos), 0)} produtos em ${finalTest.rows.length} tabelas!\n`);

        // 4. Testar consulta específica (Ind 1)
        console.log('4️⃣ Teste específico - Indústria 1, Tabela LP SAMPEL 29 OUT:\n');
        const ind1Test = await pool.query(`
            SELECT 
                pro_codprod,
                pro_nome,
                itab_precobruto as preco,
                itab_ipi as ipi
            FROM vw_produtos_precos
            WHERE pro_industria = 1 AND itab_tabela = 'LP SAMPEL 29 OUT'
            LIMIT 5
        `);

        if (ind1Test.rows.length > 0) {
            console.table(ind1Test.rows);
            console.log(`\n🎉 SUCESSO! ${ind1Test.rows.length} produtos carregados!\n`);
        } else {
            console.log('❌ Ainda sem produtos. Investigar mais a fundo.\n');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

fixFinal();
