const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkTriggers() {
    try {
        console.log('--- Checking triggers on ro_consult.agenda ---');
        const res = await pool.query(`
            SELECT trigger_name, event_manipulation, event_object_table, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_schema = 'ro_consult' AND event_object_table = 'agenda'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkTriggers();
