const { Pool } = require('pg');
require('dotenv').config();

// Simular COM a correção: search_path inclui public
const schema = 'brasil_wl';
const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 10000,
    options: `-c search_path=${schema},public`  // <-- COM public
});

async function testFix() {
    try {
        const sp = await pool.query('SHOW search_path');
        console.log('Search path:', sp.rows[0].search_path);

        console.log('\nTestando fn_listar_tabelas_industria(2)...');
        const result = await pool.query('SELECT * FROM fn_listar_tabelas_industria($1)', [2]);
        console.log(`✅ SUCESSO! ${result.rows.length} tabela(s) encontrada(s):`);
        result.rows.forEach(row => console.log(`  📋 ${row.itab_tabela} (status: ${row.itab_status})`));

    } catch (error) {
        console.error('❌ Ainda deu erro:', error.message);
    } finally {
        await pool.end();
    }
}

testFix();
