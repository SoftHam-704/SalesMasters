require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'process.env.DB_PASSWORD',
    ssl: false
});

async function run() {
    try {
        console.log("Dropping incorrect function OID: 19748...");
        // Explicitly drop by signature to be sure
        await pool.query(`
            DROP FUNCTION fn_upsert_produto(integer, character varying, character varying, double precision, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying);
        `);
        console.log("Function dropped successfully!");
    } catch (err) {
        console.error("Error dropping function:", err);
    } finally {
        await pool.end();
    }
}

run();

