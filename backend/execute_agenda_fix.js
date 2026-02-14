const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function runUpdate() {
    try {
        console.log('--- Executando UPDATE... ---');
        const res = await pool.query("UPDATE ro_consult.agenda SET empresa_id = 5;");
        console.log('Update concluído! Linhas afetadas:', res.rowCount);

        const verify = await pool.query("SELECT id, titulo, empresa_id FROM ro_consult.agenda;");
        console.log('Verificação:', verify.rows);
    } catch (err) {
        console.err('Erro no update:', err);
    } finally {
        await pool.end();
    }
}

runUpdate();
