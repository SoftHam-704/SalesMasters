const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkUser1() {
    try {
        console.log('--- Checking tasks for usuario_id: 1 in ro_consult.agenda ---');
        const res = await pool.query("SELECT * FROM ro_consult.agenda WHERE usuario_id = 1;");
        console.log('Total tasks for user 1:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));

        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkUser1();
