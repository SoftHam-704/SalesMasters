const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkGrupoDesc() {
    const schema = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'grupo_desc'
        ORDER BY ordinal_position
    `);
    console.log('Colunas na tabela grupo_desc:');
    schema.rows.forEach(r => console.log(`  ${r.column_name.padEnd(20)} ${r.data_type}`));
    await pool.end();
}

checkGrupoDesc();
