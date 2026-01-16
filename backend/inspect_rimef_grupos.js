require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function inspectTable() {
    try {
        console.log('\n🔍 INSPECTING rimef.grupos...\n');

        // Check column details, specifically looking for default values (sequences)
        const result = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'rimef' AND table_name = 'grupos'
            ORDER BY ordinal_position;
        `);

        console.table(result.rows);

        // Check for existing sequences in rimef schema related to grupos
        const seqResult = await pool.query(`
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'rimef';
        `);
        console.log('\nSequences in rimef:');
        console.table(seqResult.rows);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

inspectTable();
