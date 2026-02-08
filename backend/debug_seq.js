const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkSeq() {
    try {
        console.log('--- Checking ro_consult.agenda_id_seq ---');
        const res = await pool.query("SELECT last_value, is_called FROM ro_consult.agenda_id_seq;");
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkSeq();
