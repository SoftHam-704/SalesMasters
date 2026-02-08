
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function findClient() {
    try {
        const schemas = ['public', 'rimef', 'markpress', 'brasil_wl', 'ro_consult', 'target', 'remap', 'ndsrep', 'repsoma', 'barrosrep'];
        for (const s of schemas) {
            try {
                const res = await pool.query(`SELECT cli_codigo, cli_nome, '${s}' as schema_name FROM ${s}.clientes WHERE cli_codigo::text::int = 16`);
                if (res.rows.length > 0) {
                    console.table(res.rows);
                }
            } catch (e) {
                // console.log(`${s}: error or not found`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findClient();
