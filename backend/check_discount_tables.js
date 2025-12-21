const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkDiscountTables() {
    try {
        // Check for discount-related tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            AND table_name LIKE '%desc%'
            ORDER BY table_name
        `);

        console.log('=== Discount-related tables ===');
        console.table(tables.rows);

        // Check grupo_desc structure
        const grupoDesc = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name='grupo_desc' 
            ORDER BY ordinal_position
        `);

        console.log('\n=== grupo_desc table structure ===');
        console.table(grupoDesc.rows);

        // Check for sample data
        const sample = await pool.query('SELECT * FROM grupo_desc LIMIT 5');
        console.log('\n=== Sample data ===');
        console.table(sample.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDiscountTables();
