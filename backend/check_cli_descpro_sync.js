
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
        const schemas = ['ro_consult', 'rimef', 'markpress', 'brasil_wl', 'target', 'remap', 'ndsrep', 'repsoma', 'barrosrep'];

        console.log('--- CLI_DESCPRO Table Counts ---');
        for (const schema of schemas) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${schema}.cli_descpro`);
                console.log(`${schema}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${schema}: Table NOT FOUND`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
