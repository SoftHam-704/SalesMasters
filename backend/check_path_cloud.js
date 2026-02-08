
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function check() {
    try {
        const res = await pool.query("SHOW search_path");
        console.log(`Default search_path: ${res.rows[0].search_path}`);

        // Let's see what schemas are in the search path by default
        const res2 = await pool.query("SELECT current_schema()");
        console.log(`Current schema: ${res2.rows[0].current_schema}`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
