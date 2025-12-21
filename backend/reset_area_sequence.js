const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetSequence() {
    try {
        // Get max ID
        const result = await pool.query('SELECT MAX(atu_id) as max FROM area_atu');
        const maxId = result.rows[0].max;

        console.log(`Current max ATU_ID: ${maxId}`);

        // Reset sequence
        await pool.query(`SELECT setval('area_atu_atu_id_seq', ${maxId})`);
        console.log(`✅ Sequence reset to ${maxId}`);

        // Test next value
        const next = await pool.query("SELECT nextval('area_atu_atu_id_seq')");
        console.log(`Next auto-increment ID will be: ${next.rows[0].nextval}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetSequence();
