// Script para diagnosticar problema na view vw_produtos_precos
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function diagnose() {
    try {
        console.log('🔍 DIAGNÓSTICO DA VIEW vw_produtos_precos\n');

        // 1. Verificar estrutura da view
        console.log('1️⃣ Verificando definição da view...');
        const viewDef = await pool.query(`
            SELECT pg_get_viewdef('vw_produtos_precos', true) as definition
        `);
        console.log('\n📝 Definição da View:\n');
        console.log(viewDef.rows[0].definition);

        // 2. Testar SELECT direto da tabela cad_tabelaspre
        console.log('\n2️⃣ Testando dados brutos de cad_tabelaspre...');
        const rawData = await pool.query(`
            SELECT 
                itab_idindustria,
                itab_tabela,
                itab_idprod,
                COUNT(*) as total
            FROM cad_tabelaspre
            WHERE itab_idindustria = 1 AND itab_tabela = 'LP SAMPEL 29 OUT'
            GROUP BY itab_idindustria, itab_tabela, itab_idprod
            LIMIT 5
        `);
        console.log(`\n✅ Registros na tabela: ${rawData.rows.length}`);
        console.table(rawData.rows);

        // 3. Testar JOIN com produtos
        console.log('\n3️⃣ Testando JOIN com cad_prod...');
        const joinTest = await pool.query(`
            SELECT 
                t.itab_idindustria,
                t.itab_tabela,
                t.itab_idprod,
                p.pro_id,
                p.pro_nome,
                COUNT(*) as total
            FROM cad_tabelaspre t
            LEFT JOIN cad_prod p ON p.pro_id = t.itab_idprod
            WHERE t.itab_idindustria = 1 AND t.itab_tabela = 'LP SAMPEL 29 OUT'
            GROUP BY t.itab_idindustria, t.itab_tabela, t.itab_idprod, p.pro_id, p.pro_nome
            LIMIT 5
        `);
        console.log(`\n✅ Registros após JOIN: ${joinTest.rows.length}`);
        console.table(joinTest.rows);

        // 4. Verificar colunas da view
        console.log('\n4️⃣ Verificando colunas da view...');
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vw_produtos_precos'
            ORDER BY ordinal_position
        `);
        console.log(`\n📊 Colunas da view (${columns.rows.length}):`);
        console.table(columns.rows);

        // 5. Testar query da view directamente
        console.log('\n5️⃣ Testando SELECT da view...');
        const viewTest = await pool.query(`
            SELECT * FROM vw_produtos_precos
            WHERE pro_industria = 1 AND itab_tabela = 'LP SAMPEL 29 OUT'
            LIMIT 5
        `);
        console.log(`\n${viewTest.rows.length === 0 ? '❌' : '✅'} Registros retornados pela view: ${viewTest.rows.length}`);
        if (viewTest.rows.length > 0) {
            console.table(viewTest.rows);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

diagnose();
