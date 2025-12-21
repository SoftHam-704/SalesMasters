require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkSchema() {
    try {
        console.log('📋 Checking cli_ind table schema...\n');

        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'cli_ind'
            ORDER BY ordinal_position
        `);

        console.log('Columns in cli_ind table:');
        console.table(result.rows);

        // Check sample data
        const sampleData = await pool.query('SELECT * FROM cli_ind LIMIT 5');
        console.log('\nSample data (first 5 rows):');
        console.table(sampleData.rows);

        // Check count
        const count = await pool.query('SELECT COUNT(*) FROM cli_ind');
        console.log(`\nTotal records: ${count.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
