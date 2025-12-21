require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkData() {
    try {
        console.log("--- Checking Client ---");
        const clientRes = await pool.query("SELECT cli_codigo, cli_nome, cli_nomred FROM clientes WHERE cli_nomred LIKE '%MERCENOVA%' OR cli_nome LIKE '%MERCENOVA%';");
        console.log("Clients found:", clientRes.rows);

        if (clientRes.rows.length > 0) {
            const cliCodigo = clientRes.rows[0].cli_codigo;
            console.log(`\n--- Checking Industries for Client ID: ${cliCodigo} ---`);
            const indRes = await pool.query("SELECT * FROM cli_ind WHERE cli_codigo = $1", [cliCodigo]);
            console.log(`Records in cli_ind for cli_codigo ${cliCodigo}:`, indRes.rows.length);
            if (indRes.rows.length > 0) {
                console.log("Sample Record:", indRes.rows[0]);
            } else {
                console.log("No records found in cli_ind.");
                // Check if there are ANY records
                const count = await pool.query("SELECT COUNT(*) FROM cli_ind");
                console.log("Total records in cli_ind:", count.rows[0].count);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkData();
