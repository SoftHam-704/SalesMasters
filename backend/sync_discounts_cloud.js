
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function sync() {
    try {
        const targetSchemas = ['rimef', 'markpress', 'brasil_wl', 'target', 'remap', 'ndsrep', 'repsoma', 'barrosrep'];

        // Get data from ro_consult
        const masterData = await pool.query("SELECT * FROM ro_consult.cli_descpro");
        console.log(`Syncing ${masterData.rows.length} rows to other schemas...`);

        for (const schema of targetSchemas) {
            console.log(`Processing ${schema}...`);
            for (const row of masterData.rows) {
                const query = `
                INSERT INTO ${schema}.cli_descpro (
                    cli_codigo, cli_forcodigo, cli_grupo,
                    cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5,
                    cli_desc6, cli_desc7, cli_desc8, cli_desc9
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (cli_codigo, cli_forcodigo, cli_grupo) DO UPDATE SET
                    cli_desc1 = EXCLUDED.cli_desc1,
                    cli_desc2 = EXCLUDED.cli_desc2,
                    cli_desc3 = EXCLUDED.cli_desc3,
                    cli_desc4 = EXCLUDED.cli_desc4,
                    cli_desc5 = EXCLUDED.cli_desc5,
                    cli_desc6 = EXCLUDED.cli_desc6,
                    cli_desc7 = EXCLUDED.cli_desc7,
                    cli_desc8 = EXCLUDED.cli_desc8,
                    cli_desc9 = EXCLUDED.cli_desc9
            `;
                const values = [
                    row.cli_codigo, row.cli_forcodigo, row.cli_grupo,
                    row.cli_desc1, row.cli_desc2, row.cli_desc3, row.cli_desc4, row.cli_desc5,
                    row.cli_desc6, row.cli_desc7, row.cli_desc8, row.cli_desc9
                ];
                try {
                    await pool.query(query, values);
                } catch (e) {
                    // console.warn(`Failed to sync for ${schema}: ${e.message}`);
                }
            }
            const count = await pool.query(`SELECT COUNT(*) FROM ${schema}.cli_descpro`);
            console.log(`Sync for ${schema} finished. Total rows: ${count.rows[0].count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

sync();
