const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findTable() {
    try {
        // Find all tables with 'desc' or 'grupo' in name
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            AND (table_name LIKE '%desc%' OR table_name LIKE '%grupo%')
            ORDER BY table_name
        `);

        console.log('Tables with desc/grupo:');
        console.table(tables.rows);

        // Check if cli_descpro exists
        const cliDescPro = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' AND table_name = 'cli_descpro'
        `);

        if (cliDescPro.rows.length > 0) {
            console.log('\n✅ cli_descpro table exists!');

            // Get structure
            const struct = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name='cli_descpro' 
                ORDER BY ordinal_position
            `);

            console.log('\nStructure:');
            console.table(struct.rows);

            // Get sample data
            const sample = await pool.query('SELECT * FROM cli_descpro LIMIT 5');
            console.log('\nSample data:');
            console.table(sample.rows);
        } else {
            console.log('\n❌ cli_descpro table does NOT exist - need to create it!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

findTable();
