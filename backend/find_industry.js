const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function findIndustry() {
    try {
        console.log('🔍 Searching for 2M PLASTIC industry...\n');

        const result = await pool.query(`
            SELECT for_codigo, for_nomered, for_nome
            FROM fornecedores
            WHERE for_nomered ILIKE '%2M%' OR for_nome ILIKE '%2M%'
            ORDER BY for_codigo
        `);

        console.log(`Found ${result.rows.length} results:\n`);
        result.rows.forEach(r => {
            console.log(`ID: ${r.for_codigo} | Nome Reduzido: ${r.for_nomered} | Nome Completo: ${r.for_nome}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

findIndustry();
