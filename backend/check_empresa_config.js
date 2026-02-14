const { Pool } = require('pg');

const poolMaster = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'salesmasters_master',
    ssl: false
});

const poolBase = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'ytAyO0u043',
    database: 'basesales',
    ssl: false
});

async function checkEmpresas() {
    try {
        console.log('--- Verificando Empresas no Master ---');
        const resMaster = await poolMaster.query("SELECT * FROM empresas WHERE db_schema = 'ro_consult';");
        console.log('Empresas no Master:', resMaster.rows);

        console.log('\n--- Verificando Empresas no Base (Public) ---');
        const resBase = await poolBase.query("SELECT * FROM empresas WHERE db_schema = 'ro_consult';");
        console.log('Empresas no Base:', resBase.rows);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await poolMaster.end();
        await poolBase.end();
    }
}

checkEmpresas();
