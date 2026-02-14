const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function verify() {
    try {
        const res = await pool.query("SELECT id, titulo, usuario_id, empresa_id FROM ro_consult.agenda;");
        console.log('Dados atuais na agenda:', res.rows);
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

verify();
