const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkColumns() {
    try {
        // Check fornecedores table structure
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'fornecedores' 
            AND column_name LIKE '%tipo%'
            ORDER BY ordinal_position;
        `);
        
        console.log('Columns with "tipo" in fornecedores table:');
        console.table(result.rows);
        
        // Also check for all columns to understand structure
        const allCols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fornecedores' 
            ORDER BY ordinal_position;
        `);
        
        console.log('\nAll columns in fornecedores:');
        console.log(allCols.rows.map(r => r.column_name).join(', '));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkColumns();
