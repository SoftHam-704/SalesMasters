const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function findUsers() {
    try {
        console.log('--- Checking users in ro_consult.user_nomes ---');
        const res = await pool.query("SELECT * FROM ro_consult.user_nomes;");
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

findUsers();
