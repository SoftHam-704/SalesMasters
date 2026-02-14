const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function checkAgenda() {
    try {
        console.log('--- Verificando empresa_id na ro_consult.agenda ---');

        const resCount1 = await pool.query("SELECT COUNT(*) FROM ro_consult.agenda WHERE empresa_id = '1' OR empresa_id = 1;");
        console.log('Total com empresa_id 1:', resCount1.rows[0].count);

        const resCount5 = await pool.query("SELECT COUNT(*) FROM ro_consult.agenda WHERE empresa_id = '5' OR empresa_id = 5;");
        console.log('Total com empresa_id 5:', resCount5.rows[0].count);

        const resAll = await pool.query("SELECT DISTINCT empresa_id FROM ro_consult.agenda;");
        console.log('Todos os empresa_id na agenda:', resAll.rows.map(r => r.empresa_id));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkAgenda();
