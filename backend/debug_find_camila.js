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
        console.log('--- Searching for Camila in basesales ---');
        // Search in all schemas for a user table or similar
        const res = await pool.query(`
            SELECT schemaname, tablename 
            FROM pg_catalog.pg_tables 
            WHERE tablename ILIKE '%usu%' OR tablename ILIKE '%user%'
        `);
        console.log('Possible user tables:', res.rows);

        // Try direct searching in some common ones
        try {
            const res2 = await pool.query("SELECT * FROM public.user_nomes WHERE nome ILIKE '%Camila%';");
            console.log('Found in public.user_nomes:', res2.rows);
        } catch (e) { }

        try {
            const res3 = await pool.query("SELECT * FROM ro_consult.cad_usu WHERE usu_nome ILIKE '%Camila%';");
            console.log('Found in ro_consult.cad_usu:', res3.rows);
        } catch (e) { }

        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

findCamila();
