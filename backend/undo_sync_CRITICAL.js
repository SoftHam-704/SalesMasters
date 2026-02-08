
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function undoSync() {
    try {
        const targetSchemas = ['public', 'rimef', 'markpress', 'brasil_wl', 'target', 'remap', 'ndsrep', 'repsoma', 'barrosrep'];

        console.log('Undoing sync... cleaning up all schemas except ro_consult.');

        for (const schema of targetSchemas) {
            console.log(`Cleaning ${schema}.cli_descpro...`);
            try {
                const res = await pool.query(`DELETE FROM ${schema}.cli_descpro`);
                console.log(`Deleted ${res.rowCount} rows from ${schema}.`);
            } catch (e) {
                console.warn(`Failed to clean ${schema}: ${e.message}`);
            }
        }

        const finalCheck = await pool.query("SELECT COUNT(*) FROM ro_consult.cli_descpro");
        console.log(`Final check: ro_consult.cli_descpro has ${finalCheck.rows[0].count} rows (PROTECTED).`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

undoSync();
