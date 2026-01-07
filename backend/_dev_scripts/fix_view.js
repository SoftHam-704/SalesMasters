// Script para consertar a view vw_produtos_precos definitivamente
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function fix() {
    try {
        console.log('🔧 CONSERTANDO VIEW vw_produtos_precos\n');

        // 1. Dropar e recriar a view com LEFT JOIN em fornecedores
        console.log('1️⃣ Recriando view com LEFT JOIN...');

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
            FROM cad_prod p
            LEFT JOIN fornecedores f ON f.for_codigo = p.pro_industria
            LEFT JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
            WHERE p.pro_status = true
              AND t.itab_tabela IS NOT NULL
        `);

        console.log('✅ View recriada com LEFT JOIN!\n');

        // 2. Testar a view
        console.log('2️⃣ Testando view corrigida...');
        const test = await pool.query(`
            SELECT 
                pro_industria,
                itab_tabela,
                COUNT(*) as total_produtos
            FROM vw_produtos_precos
            GROUP BY pro_industria, itab_tabela
            ORDER BY pro_industria, itab_tabela
            LIMIT 10
        `);

        console.log(`\n✅ View funcionando! Total de grupos: ${test.rows.length}\n`);
        console.table(test.rows);

        // 3. Testar query específica
        console.log('\n3️⃣ Testando query específica (Indústria 1)...');
        const specific = await pool.query(`
            SELECT 
                pro_codprod,
                pro_nome,
                itab_precobruto,
                itab_ipi
            FROM vw_produtos_precos
            WHERE pro_industria = 1 AND itab_tabela = 'LP SAMPEL 29 OUT'
            LIMIT 5
        `);

        console.log(`\n✅ Produtos encontrados: ${specific.rows.length}\n`);
        console.table(specific.rows);

        console.log('\n🎉 VIEW CONSERTADA COM SUCESSO!\n');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

fix();
