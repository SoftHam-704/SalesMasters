require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkView() {
    const client = await pool.connect();
    try {
        console.log('--- View Information for vw_produtos_precos ---');
        const res = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'vw_produtos_precos'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);

        const def = await client.query(`
            SELECT pg_get_viewdef('vw_produtos_precos') as definition;
        `);
        console.log('\n--- View Definition ---');
        console.log(def.rows[0].definition);

    } catch (err) {
        console.error('Error checking view:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkView();
