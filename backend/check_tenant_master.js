const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false
});

async function checkTenant() {
    try {
        const res = await pool.query("SELECT * FROM empresas WHERE db_schema = 'repsoma' OR db_nome = 'repsoma' OR cnpj LIKE '%2916629%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

checkTenant();
