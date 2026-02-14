const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'salesmasters_master',
    ssl: false
});

async function findCamila() {
    try {
        console.log('--- Buscando Camila em salesmasters_master.users ---');
        const res = await pool.query("SELECT id, name, email, tenant_id FROM users WHERE name ILIKE '%Camila%';");
        console.log('Resultados:', res.rows);
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

findCamila();
