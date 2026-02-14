const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function checkUsers() {
    try {
        console.log('--- Mapeando Usuários e Agenda no ro_consult ---');

        const users = await pool.query("SELECT codigo, nome FROM ro_consult.user_nomes;");
        console.log('Usuários no sistema:', users.rows);

        const agendaUsers = await pool.query("SELECT DISTINCT usuario_id FROM ro_consult.agenda;");
        console.log('IDs de usuários com registros na agenda:', agendaUsers.rows.map(r => r.usuario_id));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
