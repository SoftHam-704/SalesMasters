const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function research() {
    const client = await pool.connect();
    try {
        console.log('--- TABLES ---');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        console.log(JSON.stringify(tables.rows.map(r => r.table_name), null, 2));

        console.log('\n--- VIEWS ---');
        const views = await client.query(`
            SELECT viewname 
            FROM pg_views 
            WHERE schemaname = 'public'
            ORDER BY viewname;
        `);
        console.log(JSON.stringify(views.rows.map(r => r.viewname), null, 2));

        console.log('\n--- FUNCTIONS ---');
        const functions = await client.query(`
            SELECT DISTINCT p.proname
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            ORDER BY p.proname;
        `);
        console.log(JSON.stringify(functions.rows.map(r => r.proname), null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

research();
