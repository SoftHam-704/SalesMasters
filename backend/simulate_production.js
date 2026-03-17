const { Pool } = require('pg');
require('dotenv').config();

// Simular EXATAMENTE como db.js cria o pool para brasil_wl
const schema = 'brasil_wl';
const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 10000,
    // EXATAMENTE como db.js configura - SEM incluir public!
    options: `-c search_path=${schema}`
});

async function testExactlyLikeProduction() {
    try {
        // 1. Verificar search_path efetivo
        const sp = await pool.query('SHOW search_path');
        console.log('Search path efetivo:', sp.rows[0].search_path);

        // 2. Simular o endpoint /api/suppliers (GET /)
        console.log('\n=== Simulando /api/suppliers ===');
        const suppResult = await pool.query(`
            SELECT f.*, 
                (SELECT COUNT(*) FROM cad_prod p WHERE p.pro_industria = f.for_codigo) as total_produtos
            FROM fornecedores f
            ORDER BY f.for_nomered ASC
        `);
        console.log('Fornecedores retornados:');
        suppResult.rows.forEach(row => {
            console.log(`  for_codigo: "${row.for_codigo}" (type: ${typeof row.for_codigo}) | for_nomered: "${row.for_nomered}" | total_produtos: ${row.total_produtos}`);
        });

        // 3. Simular o endpoint /api/products/tables/:industria
        console.log('\n=== Simulando /api/products/tables/2 ===');
        try {
            const tabResult = await pool.query('SELECT * FROM fn_listar_tabelas_industria($1)', [2]);
            console.log(`Tabelas encontradas: ${tabResult.rows.length}`);
            tabResult.rows.forEach(row => console.log(`  ${row.itab_tabela}`));
        } catch (err) {
            console.error(`❌ ERRO ao chamar fn_listar_tabelas_industria: ${err.message}`);

            // Se a função não foi encontrada no search_path, tentar com schema explícito
            console.log('\n  Tentando com public.fn_listar_tabelas_industria...');
            try {
                const tabResult2 = await pool.query('SELECT * FROM public.fn_listar_tabelas_industria($1)', [2]);
                console.log(`  ✅ Funciona com prefixo public! ${tabResult2.rows.length} tabela(s)`);
                console.log('  ⚠️ PROBLEMA: A função SÓ existe no public, e o search_path do pool NÃO inclui public!');
            } catch (err2) {
                console.error(`  ❌ Também falhou com public: ${err2.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

testExactlyLikeProduction();
