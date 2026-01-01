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
        console.log('--- Checking Clients Status ---');

        const resStats = await pool.query("SELECT cli_tipopes, COUNT(*) FROM clientes GROUP BY cli_tipopes");
        console.table(resStats.rows);

        const resSample = await pool.query("SELECT cli_nomred, cli_tipopes FROM clientes LIMIT 10");
        console.table(resSample.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
