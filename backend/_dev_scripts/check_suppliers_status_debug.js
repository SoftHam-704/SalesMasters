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
        console.log('--- Checking Fornecedores Status ---');

        const resStats = await pool.query("SELECT for_tipo2, COUNT(*) FROM fornecedores GROUP BY for_tipo2");
        console.table(resStats.rows);

        const resAll = await pool.query("SELECT for_nomered, for_tipo2 FROM fornecedores ORDER BY for_nomered");
        console.log("Sample Data:");
        console.table(resAll.rows.slice(0, 10));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
