const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkPublicAgenda() {
    try {
        console.log('--- Checking public.agenda in basesales ---');
        const res = await pool.query("SELECT COUNT(*) FROM public.agenda;");
        console.log('Total in public.agenda:', res.rows[0].count);

        const lastRes = await pool.query("SELECT * FROM public.agenda ORDER BY created_at DESC LIMIT 5;");
        console.log('Last 5 in public.agenda:', JSON.stringify(lastRes.rows, null, 2));

        await pool.end();
    } catch (e) {
        console.log('public.agenda probably does not exist or error:', e.message);
        await pool.end();
    }
}

checkPublicAgenda();
