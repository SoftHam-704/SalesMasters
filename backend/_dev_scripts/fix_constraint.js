const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function fixConstraint() {
    try {
        console.log('🔧 Removendo constraint incorreta...');
        await pool.query(`DROP INDEX IF EXISTS uk_prod_industria_normalizado`);

        console.log('✅ Criando constraint CORRETA (industria + codigo)...');
        await pool.query(`
            CREATE UNIQUE INDEX uk_prod_industria_normalizado 
            ON cad_prod (pro_industria, pro_codigonormalizado)
            WHERE pro_codigonormalizado IS NOT NULL
        `);

        console.log('✅ Constraint recriada!');

        // Testar
        console.log('\n🧪 Testando...');
        const test1 = await pool.query(`
            INSERT INTO cad_prod (pro_industria, pro_codprod, pro_codigonormalizado, pro_nome)
            VALUES (999, 'TEST123', 'TEST123', 'Produto Teste 1')
            RETURNING pro_id
        `);
        console.log(`   ✅ Inserido produto na indústria 999: pro_id=${test1.rows[0].pro_id}`);

        const test2 = await pool.query(`
            INSERT INTO cad_prod (pro_industria, pro_codprod, pro_codigonormalizado, pro_nome)
            VALUES (998, 'TEST123', 'TEST123', 'Produto Teste 2')
            RETURNING pro_id
        `);
        console.log(`   ✅ Inserido MESMO código na indústria 998: pro_id=${test2.rows[0].pro_id}`);

        //Cleanup
        await pool.query(`DELETE FROM cad_prod WHERE pro_industria IN (998, 999)`);
        console.log('   ✅ Teste concluído - produtos de teste removidos\n');

    } catch (e) {
        console.error('❌ Erro:', e.message);
    } finally {
        await pool.end();
    }
}

fixConstraint();
