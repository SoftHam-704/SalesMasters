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

async function migrateAreaAtu() {
    try {
        // Read Excel file
        const filePath = path.join(__dirname, '../data/area_atu.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Sheet1'];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} areas to import`);

        // Clear existing data
        await pool.query('DELETE FROM area_atu');
        console.log('Cleared existing area_atu data');

        // Insert new data
        let inserted = 0;
        for (const row of data) {
            const { ATU_ID, ATU_DESCRICAO, ATU_SEL, GID } = row;

            if (!ATU_ID || !ATU_DESCRICAO) {
                console.log(`Skipping invalid row:`, row);
                continue;
            }

            await pool.query(
                `INSERT INTO area_atu (atu_id, atu_descricao, atu_sel, gid) 
                 VALUES ($1, $2, $3, $4)`,
                [ATU_ID, ATU_DESCRICAO, ATU_SEL || 'N', GID]
            );
            inserted++;
        }

        console.log(`✅ Successfully imported ${inserted} areas`);

        // Show sample
        const result = await pool.query('SELECT * FROM area_atu ORDER BY atu_id LIMIT 10');
        console.log('\nSample imported data:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrateAreaAtu();
