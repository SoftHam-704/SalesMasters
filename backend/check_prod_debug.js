require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkProd() {
    try {
        console.log('Checking cad_prod table...');

        // Check count
        const countRes = await pool.query('SELECT COUNT(*) FROM cad_prod');
        console.log('Total products:', countRes.rows[0].count);

        // Check columns
        const colRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cad_prod'
        `);
        console.log('Columns:', colRes.rows.map(r => r.column_name).join(', '));

        // Check sample for an industry
        // Let's assume STAHL ID is around. We'll list industries with product counts.
        const aggRes = await pool.query(`
            SELECT pro_industria, COUNT(*) 
            FROM cad_prod 
            GROUP BY pro_industria
            LIMIT 10
        `);
        console.log('Products per industry:', aggRes.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

checkProd();
