
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function check() {
    try {
        console.log('--- cli_descpro for 16 in CLOUD ---');
        const res1 = await pool.query("SELECT cli_codigo, cli_forcodigo, cli_grupo FROM ro_consult.cli_descpro WHERE cli_codigo::text::int = 16");
        console.log(`Found ${res1.rows.length} rows.`);
        console.table(res1.rows);

        if (res1.rows.length === 0) {
            console.log('No rows found for 16. Let\'s check some data from cli_descpro:');
            const res2 = await pool.query("SELECT cli_codigo FROM ro_consult.cli_descpro LIMIT 10");
            console.table(res2.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
