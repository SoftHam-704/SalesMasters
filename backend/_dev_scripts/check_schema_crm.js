const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432
});

async function run() {
    try {
        console.log('Checking crm_interacao columns...');
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'crm_interacao'");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
