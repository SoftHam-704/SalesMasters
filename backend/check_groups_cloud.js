
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
        console.log('--- grupo_desc details in CLOUD ---');
        const res = await pool.query("SELECT * FROM ro_consult.grupo_desc LIMIT 1");
        console.log(res.rows[0]);

        console.log('--- columns ---');
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'grupo_desc' AND table_schema = 'ro_consult'");
        console.table(cols.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
