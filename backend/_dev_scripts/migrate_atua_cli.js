const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const filePath = path.join(__dirname, '../data/atua_cli.xlsx');

async function migrate() {
    try {
        console.log("Reading Excel file...");
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`Found ${rows.length} records in Excel.`);

        console.log("Connecting to database...");

        // Optional: Check current count
        const countRes = await pool.query('SELECT COUNT(*) FROM atua_cli');
        console.log(`Current DB count: ${countRes.rows[0].count}`);

        // Truncate table? Or just insert? Usually migration implies full replacement or initial load.
        // User said "make the migration". I'll use ON CONFLICT DO NOTHING to be safe, 
        // assuming (atu_idcli, atu_atuaid) is a unique constraint/PK.
        // If no constraint, I might get duplicates. 
        // Let's assume we want to ensure these exist.

        // Efficient batch insert or loop. Loop is fine for < 10k records usually.

        let inserted = 0;
        let errors = 0;

        for (const row of rows) {
            const cliId = row.ATU_IDCLI || row.atu_idcli;
            const areaId = row.ATU_ATUAID || row.atu_atuaid;
            const sel = row.ATU_SEL || row.atu_sel || null;
            const gid = row.GID || row.gid || null;

            if (!cliId || !areaId) {
                console.warn("Skipping invalid row:", row);
                continue;
            }

            try {
                // Determine if record exists
                const check = await pool.query(
                    'SELECT 1 FROM atua_cli WHERE atu_idcli = $1 AND atu_atuaid = $2',
                    [cliId, areaId]
                );

                if (check.rowCount === 0) {
                    await pool.query(
                        'INSERT INTO atua_cli (atu_idcli, atu_atuaid, atu_sel, gid) VALUES ($1, $2, $3, $4)',
                        [cliId, areaId, sel, gid]
                    );
                    inserted++;
                }
            } catch (err) {
                console.error(`Error inserting client ${cliId} area ${areaId}:`, err.message);
                errors++;
            }
        }

        console.log(`Migration complete.`);
        console.log(`Inserted: ${inserted}`);
        console.log(`Errors: ${errors}`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        pool.end();
    }
}

migrate();
