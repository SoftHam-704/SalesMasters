
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
        console.log('--- grupos table in ro_consult ---');
        const res = await pool.query("SELECT * FROM information_schema.columns WHERE table_name = 'grupos' AND table_schema = 'ro_consult'");
        console.table(res.rows.map(r => ({ column: r.column_name, type: r.data_type })));

        const res2 = await pool.query("SELECT gru_codigo, gru_nome FROM ro_consult.grupos LIMIT 5");
        console.table(res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
