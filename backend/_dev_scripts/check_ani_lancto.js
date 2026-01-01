const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkAniLancto() {
    const result = await pool.query(`
        SELECT column_name, column_default, data_type
        FROM information_schema.columns
        WHERE table_name = 'cli_aniv' AND column_name = 'ani_lancto'
    `);

    console.log('Campo ani_lancto:');
    console.table(result.rows);

    const sample = await pool.query('SELECT ani_lancto, ani_nome FROM cli_aniv ORDER BY ani_lancto LIMIT 10');
    console.log('\nPrimeiros 10 valores de ani_lancto:');
    console.table(sample.rows);

    await pool.end();
}

checkAniLancto();
