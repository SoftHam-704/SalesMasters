const { Pool } = require('pg');
require('dotenv').config();

async function promote() {
    const node = { id: '254557', host: 'node254557-salesmaster.sp1.br.saveincloud.net.br' };
    console.log(`\n--- Attempting to Promote Node ${node.id} (${node.host}) ---`);

    const pool = new Pool({
        host: node.host,
        port: 13062,
        user: 'webadmin',
        password: 'ytAyO0u043',
        database: 'postgres',
        connectionTimeoutMillis: 5000
    });

    try {
        console.log('Running pg_promote()...');
        const res = await pool.query('SELECT pg_promote()');
        console.log('✅ Promotion result:', res.rows[0].pg_promote);

        console.log('Verifying status...');
        const status = await pool.query("SELECT pg_is_in_recovery(), current_setting('transaction_read_only')");
        console.table(status.rows);

    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
    } finally {
        await pool.end();
    }
}

promote();
