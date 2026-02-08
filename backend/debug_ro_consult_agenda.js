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
        console.log('--- Checking ro_consult.agenda table records ---');
        const countRes = await pool.query("SELECT COUNT(*) FROM ro_consult.agenda;");
        console.log('Total records in ro_consult.agenda:', countRes.rows[0].count);

        const lastRes = await pool.query("SELECT * FROM ro_consult.agenda ORDER BY created_at DESC LIMIT 5;");
        console.log('Last 5 entries:', JSON.stringify(lastRes.rows, null, 2));

        const usuarios = await pool.query("SELECT * FROM ro_consult.user_nomes WHERE nome ILIKE '%Camila%';");
        console.log('\n--- Camila in ro_consult.user_nomes ---');
        console.log(JSON.stringify(usuarios.rows, null, 2));

        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

findCamila();
