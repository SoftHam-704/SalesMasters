const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkGrupos() {
    const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'grupos'
        ORDER BY ordinal_position
    `);
    console.log('Colunas na tabela grupos:');
    result.rows.forEach(r => console.log(`  - ${r.column_name}`));
    await pool.end();
}

checkGrupos();
