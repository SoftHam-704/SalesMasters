
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
        const res = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'cli_descpro'");
        console.table(res.rows.map(r => ({ schema: r.table_schema, name: r.table_name })));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
