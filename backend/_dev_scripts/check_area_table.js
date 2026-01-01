const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTable() {
    try {
        // Check table structure
        const struct = await pool.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'area_atu'
            ORDER BY ordinal_position
        `);

        console.log('Table structure:');
        console.table(struct.rows);

        // Check for sequences
        const seqs = await pool.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_name LIKE '%area_atu%'
        `);

        console.log('\nRelated sequences:');
        console.table(seqs.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTable();
