
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
        const res = await pool.query("SELECT for_codigo, for_nomered FROM ro_consult.fornecedores WHERE for_codigo = 8");
        console.table(res.rows);

        const res2 = await pool.query("SELECT * FROM ro_consult.grupo_desc WHERE gid = '8' OR gde_id = 8");
        console.table(res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
