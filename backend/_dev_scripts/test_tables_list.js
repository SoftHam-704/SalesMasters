const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function testTablesList() {
    const client = await pool.connect();
    try {
        console.log('🧪 Testando fn_listar_tabelas_industria para 2M PLASTIC (20)...\n');

        const result = await client.query(
            'SELECT * FROM fn_listar_tabelas_industria($1)',
            [20]
        );

        console.log(`✅ Encontradas ${result.rows.length} tabelas\n`);

        result.rows.forEach((table, i) => {
            console.log(`Tabela ${i + 1}:`);
            console.log(`  itab_idindustria: ${table.itab_idindustria}`);
            console.log(`  itab_tabela: "${table.itab_tabela}"`);
            console.log(`  itab_tabela (length): ${table.itab_tabela.length} caracteres`);
            console.log(`  itab_tabela (hex): ${Buffer.from(table.itab_tabela).toString('hex')}`);
            console.log(`  itab_datatabela: ${table.itab_datatabela}`);
            console.log(`  itab_datavencimento: ${table.itab_datavencimento}`);
            console.log(`  itab_status: ${table.itab_status}`);
            console.log('');
        });

        console.log('🧪 Testando fn_listar_tabelas_industria para STAHL (12)...\n');

        const result2 = await client.query(
            'SELECT * FROM fn_listar_tabelas_industria($1)',
            [12]
        );

        console.log(`✅ Encontradas ${result2.rows.length} tabelas\n`);

        result2.rows.forEach((table, i) => {
            console.log(`Tabela ${i + 1}: "${table.itab_tabela}"`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testTablesList().catch(console.error);
