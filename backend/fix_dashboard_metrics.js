
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function fixDatabase() {
    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('🧹 Dropping existing functions...');
            // Drop various signatures to ensure clean slate
            await client.query('DROP FUNCTION IF EXISTS get_dashboard_metrics(integer, integer, integer);');
            await client.query('DROP FUNCTION IF EXISTS get_dashboard_metrics(integer, integer);');
            await client.query('DROP FUNCTION IF EXISTS get_dashboard_metrics(numeric, numeric);');
            await client.query('DROP FUNCTION IF EXISTS get_dashboard_metrics(numeric, numeric, numeric);');

            console.log('📜 Reading SQL definition...');
            const sqlPath = path.join(__dirname, 'create_dashboard_metrics_function.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log('🚀 Recreating function...');
            await client.query(sql);

            console.log('✅ Function recreated successfully!');

        } catch (err) {
            console.error('❌ Error executing SQL:', err);
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ Connection error:', err);
    } finally {
        pool.end();
    }
}

fixDatabase();
