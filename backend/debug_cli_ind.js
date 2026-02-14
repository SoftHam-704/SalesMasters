const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function checkData() {
    try {
        await pool.query('SET search_path TO ndsrep, public');
        console.log('--- Checking cli_ind and indclientes for client 31 ---');

        const cliInd = await pool.query("SELECT * FROM cli_ind WHERE cli_codigo = 31");
        console.log('cli_ind:');
        console.table(cliInd.rows);

        const indClients = await pool.query("SELECT * FROM indclientes WHERE cli_codigo = 31");
        console.log('indclientes:');
        console.table(indClients.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

checkData();
