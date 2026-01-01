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

async function recreatePriceProcedures() {
    const client = await pool.connect();
    try {
        console.log('🗑️  Removendo funções antigas...');

        // Drop existing functions
        await client.query('DROP FUNCTION IF EXISTS fn_listar_tabelas_industria(integer) CASCADE');
        await client.query('DROP FUNCTION IF EXISTS fn_listar_produtos_tabela(integer, varchar) CASCADE');

        console.log('✅ Funções antigas removidas');

        console.log('\n📝 Criando funções novas...');

        const sqlPath = path.join(__dirname, '../scripts_bancodedados/12_create_price_procedures.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Funções criadas com sucesso!');

        // Testar as funções
        console.log('\n🧪 Testando fn_listar_tabelas_industria(20)...');
        const testTables = await client.query('SELECT * FROM fn_listar_tabelas_industria(20)');
        console.log(`   ✅ Encontradas ${testTables.rows.length} tabelas`);
        if (testTables.rows.length > 0) {
            console.log('   Primeira tabela:', testTables.rows[0].itab_tabela);
        }

        if (testTables.rows.length > 0) {
            const firstTable = testTables.rows[0].itab_tabela;
            console.log(`\n🧪 Testando fn_listar_produtos_tabela(20, '${firstTable}')...`);
            const testProducts = await client.query('SELECT * FROM fn_listar_produtos_tabela($1, $2)', [20, firstTable]);
            console.log(`   ✅ Encontrados ${testProducts.rows.length} produtos`);
            if (testProducts.rows.length > 0) {
                console.log('   Primeiro produto:', testProducts.rows[0].pro_codprod, '-', testProducts.rows[0].pro_nome);
            }
        }

        console.log('\n✅ TUDO PRONTO! As funções estão funcionando corretamente.');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

recreatePriceProcedures().catch(console.error);
