const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function debugCamila() {
    try {
        console.log('--- Debugging Camila Agenda (ID 11) ---');

        // 1. Encontrar todos os registros de agenda para usuario_id 11
        const res = await pool.query("SELECT id, titulo, usuario_id, empresa_id, data_inicio, status FROM ro_consult.agenda WHERE usuario_id::text = '11';");
        console.log(`Registros totais para Camila (ID 11): ${res.rowCount}`);
        if (res.rowCount > 0) {
            console.log('Registros encontrados:', res.rows);
        } else {
            console.log('Nenhum registro encontrado com usuario_id = 11');
        }

        // 2. Verificar as empresas_id presentes na tabela agenda
        const resEmpresas = await pool.query("SELECT DISTINCT empresa_id FROM ro_consult.agenda;");
        console.log('Empresas na tabela agenda:', resEmpresas.rows.map(r => r.empresa_id));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

debugCamila();
