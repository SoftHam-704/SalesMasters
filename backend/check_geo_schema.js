const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function checkSchema() {
    try {
        const client = await pool.connect();
        await client.query('SET search_path TO repsoma');

        console.log('--- TABLE: regioes ---');
        const regioesRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'repsoma' AND table_name = 'regioes'");
        console.table(regioesRes.rows);

        console.log('--- TABLE: cidades_regioes ---');
        const crRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'repsoma' AND table_name = 'cidades_regioes'");
        console.table(crRes.rows);

        console.log('--- TABLE: cidades ---');
        const cidadesRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'repsoma' AND table_name = 'cidades'");
        console.table(cidadesRes.rows);

        client.release();
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
