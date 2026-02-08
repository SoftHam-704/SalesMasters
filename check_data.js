
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: 'postgres',
    port: 5432,
});

async function check() {
    try {
        console.log('--- cli_descpro for 16 ---');
        const res1 = await pool.query("SELECT * FROM ro_consult.cli_descpro WHERE cli_codigo::text::int = 16");
        console.log(res1.rows);

        console.log('--- Sample grupo_desc ---');
        const res2 = await pool.query("SELECT * FROM ro_consult.grupo_desc LIMIT 5");
        console.log(res2.rows);

        console.log('--- Sample fornecedores ---');
        const res3 = await pool.query("SELECT for_codigo, for_nomered FROM fornecedores WHERE for_codigo = 8");
        console.log(res3.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
