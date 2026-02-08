const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkTodayTasks() {
    try {
        console.log('--- Checking ro_consult.agenda for tasks created today (2026-02-06) ---');
        const res = await pool.query(`
            SELECT * FROM ro_consult.agenda 
            WHERE created_at >= '2026-02-06'
            ORDER BY created_at DESC
        `);
        console.log('Results:', JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkTodayTasks();
