
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
        console.log('--- cli_descpro for 16 in REPSOMA ---');
        const res = await pool.query("SELECT cli_codigo, cli_forcodigo, cli_grupo FROM repsoma.cli_descpro WHERE cli_codigo::text::int = 16");
        console.log(`Found ${res.rows.length} rows.`);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
