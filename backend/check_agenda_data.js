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
        console.log('--- Verificando Campos e Dados na ro_consult.agenda ---');

        // 1. Verificar registros do usuário Camila (codigo 11)
        const resCamila = await pool.query("SELECT * FROM ro_consult.agenda WHERE usuario_id = '11' OR usuario_id = 11;");
        console.log(`Registros para usuario_id 11: ${resCamila.rowCount}`);
        if (resCamila.rowCount > 0) {
            console.log('Exemplo de registro:', resCamila.rows[0]);
        }

        // 2. Se não encontrou, ver se há QUALQUER registro na agenda desse schema
        const resAny = await pool.query("SELECT * FROM ro_consult.agenda LIMIT 5;");
        console.log(`Total de registros na tabela (amostra): ${resAny.rowCount}`);
        if (resAny.rowCount > 0) {
            console.log('Amostra de registros:', resAny.rows);
        }

        // 3. Verificar se existe a tabela empresas no schema master para entender o tenant
        const resEmpresas = await pool.query("SELECT * FROM ro_consult.user_nomes WHERE nome ILIKE '%Camila%';");
        console.log('Dados da Camila no user_nomes:', resEmpresas.rows);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

checkAgenda();
