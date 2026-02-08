const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function findCamila() {
    try {
        console.log('--- Searching for Camila in ro_consult.user_nomes ---');
        const res = await pool.query("SELECT * FROM ro_consult.user_nomes WHERE nome ILIKE '%Camila%';");
        console.log('Result:', JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            const userId = res.rows[0].id || res.rows[0].usu_codigo; // Guessing column name
            console.log(`\n--- Searching for agenda entries for user ID: ${userId} ---`);
            const agendaRes = await pool.query(`
                SELECT * FROM ro_consult.agenda 
                WHERE usuario_id = $1 
                ORDER BY created_at DESC LIMIT 5
            `, [userId]);
            console.log('Recent agenda entries:', JSON.stringify(agendaRes.rows, null, 2));
        }

        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

findCamila();
