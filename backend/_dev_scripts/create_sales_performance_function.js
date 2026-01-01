const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function createFunction() {
    try {
        console.log('📊 Creating sales performance function...');

        const sql = fs.readFileSync('create_sales_performance_function.sql', 'utf8');
        await pool.query(sql);

        console.log('✅ Function created successfully!');

        // Test the function
        console.log('\n🧪 Testing function with sample data...');
        const result = await pool.query('SELECT * FROM get_sales_performance(2025, 12) LIMIT 5');

        console.log(`\n📊 Found ${result.rows.length} sellers with data:`);
        result.rows.forEach(row => {
            console.log(`  - ${row.ven_nome}: R$ ${parseFloat(row.total_value_current).toFixed(2)} (MoM: ${parseFloat(row.mom_value_percent).toFixed(2)}%)`);
        });

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

createFunction();
