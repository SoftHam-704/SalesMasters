const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function checkSchema() {
    const tables = ['cli_aniv', 'itens_ped', 'contato_for'];
    const results = {};

    try {
        const client = await pool.connect();
        await client.query('SET search_path TO repsoma');

        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'repsoma' AND table_name = '${table}'
            `);
            results[table] = res.rows.map(r => r.column_name);
        }

        console.log(JSON.stringify(results, null, 2));
        client.release();
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
