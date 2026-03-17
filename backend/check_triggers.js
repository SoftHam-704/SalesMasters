const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 10000
});

async function checkTriggers() {
    const table = 'itens_ped';
    const schema = 'repwill';
    try {
        console.log(`Checking triggers for ${schema}.${table}...`);

        const res = await pool.query(`
            SELECT trigger_name, event_manipulation, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = $1 AND event_object_table = $2
        `, [schema, table]);

        if (res.rows.length === 0) {
            console.log('❌ No triggers found.');
        } else {
            console.table(res.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkTriggers();
