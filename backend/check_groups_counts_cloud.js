
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
        const schemas = ['public', 'rimef', 'markpress', 'brasil_wl', 'ro_consult', 'target', 'remap', 'ndsrep', 'repsoma', 'barrosrep'];
        for (const s of schemas) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${s}.grupo_desc`);
                console.log(`${s}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${s}: error or not found`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
