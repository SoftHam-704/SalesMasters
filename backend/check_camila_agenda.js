const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function checkCamila() {
    try {
        console.log('--- Verificando Camila em ro_consult.user_nomes ---');
        const userRes = await pool.query("SELECT codigo, nome, sobrenome FROM ro_consult.user_nomes WHERE nome ILIKE '%Camila%';");
        console.log('Usuários encontrados:', userRes.rows);

        if (userRes.rows.length === 0) {
            console.log('Nenhum usuário encontrado com o nome Camila em ro_consult.user_nomes.');
            return;
        }

        const userId = userRes.rows[0].codigo;
        console.log(`\n--- Verificando Agenda para User ID ${userId} ---`);

        // Na tabela agenda, a coluna pode ser 'user_id' ou 'age_vendedor' ou something else?
        // Verificamos as colunas antes: id, tenant_id, user_id, cliente_id...
        const agendaRes = await pool.query(`SELECT * FROM ro_consult.agenda WHERE user_id = $1 ORDER BY data_inicio DESC LIMIT 10;`, [userId]);
        console.log('Registros na agenda:', agendaRes.rows);

        const totalRes = await pool.query(`SELECT COUNT(*) FROM ro_consult.agenda WHERE user_id = $1;`, [userId]);
        console.log('Total de registros na agenda para Camila:', totalRes.rows[0].count);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkCamila();
