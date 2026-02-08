const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function findRO() {
    try {
        const res = await pool.query("SELECT cnpj, nome FROM tenants WHERE db_schema = 'ro_consult';");
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

findRO();
