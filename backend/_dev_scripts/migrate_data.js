
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrateData() {
    try {
        console.log('Starting migration: ped_nffat -> ped_cliind');

        // Update ped_cliind with content of ped_nffat only if ped_cliind is empty and ped_nffat is not empty
        const query = `
            UPDATE pedidos 
            SET ped_cliind = ped_nffat, 
                ped_nffat = NULL 
            WHERE ped_nffat IS NOT NULL 
            AND ped_nffat != '' 
            AND (ped_cliind IS NULL OR ped_cliind = '')
        `;

        const res = await pool.query(query);
        console.log(`Migration completed. ${res.rowCount} rows updated.`);

    } catch (err) {
        console.error('Error migrating data:', err);
    } finally {
        pool.end();
    }
}

migrateData();
