const { Pool } = require('pg');
require('dotenv').config();

async function probe() {
    const host = 'salesmaster.sp1.br.saveincloud.net.br';
    const ports = [13062, 5432, 9999];

    for (const port of ports) {
        console.log(`\n--- Probing ${host}:${port} ---`);
        const pool = new Pool({
            host,
            port,
            user: 'webadmin',
            password: 'ytAyO0u043',
            database: 'salesmasters_master',
            connectionTimeoutMillis: 5000
        });

        try {
            const res = await pool.query("SELECT pg_is_in_recovery() as recovery, current_setting('transaction_read_only') as ro");
            console.log(`✅ Success! Recovery: ${res.rows[0].recovery}, RO: ${res.rows[0].ro}`);

            if (!res.rows[0].recovery) {
                console.log('🚀 WRITABLE MASTER FOUND!');
            }
        } catch (err) {
            console.error(`❌ Failed: ${err.message}`);
        } finally {
            await pool.end();
        }
    }
}

probe();
