
const { Pool } = require('pg');

const config = {
    host: '10.100.28.17',
    port: 5432,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 5000
};

async function listSchemas() {
    const pool = new Pool(config);
    try {
        const res = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'");
        console.log('Schemas encontrados:');
        res.rows.forEach(row => console.log(`- ${row.schema_name}`));
    } catch (err) {
        console.error('❌ ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

listSchemas();
