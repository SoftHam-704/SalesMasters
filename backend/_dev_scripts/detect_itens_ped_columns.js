// ============================================================================
// SalesMasters - Detect ITENS_PED Table Structure
// Execute this with: node detect_itens_ped_columns.js
// ============================================================================

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function detectColumns() {
    const client = await pool.connect();

    try {
        console.log('\n========================================');
        console.log('  Detecting ITENS_PED Table Structure');
        console.log('========================================\n');

        const query = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'itens_ped'
            ORDER BY ordinal_position
        `;

        const result = await client.query(query);

        console.log(`Found ${result.rows.length} columns:\n`);

        result.rows.forEach((col, idx) => {
            console.log(`${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n========================================\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

detectColumns();
