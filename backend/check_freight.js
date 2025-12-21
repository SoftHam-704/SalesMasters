require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkFreight() {
    try {
        const result = {};

        // 1. Column Definition
        const schemaRes = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'cli_ind' AND column_name = 'cli_frete';
        `);
        result.schema = schemaRes.rows;

        // 2. Value Distribution
        const distroRes = await pool.query(`
            SELECT cli_frete, COUNT(*) as count 
            FROM cli_ind 
            GROUP BY cli_frete
        `);
        result.distribution = distroRes.rows;

        // 3. Mercenova Check (IDs 536 and 2)
        const mercenovaRes = await pool.query(`
            SELECT cli_lancamento, cli_codigo, cli_forcodigo, cli_frete 
            FROM cli_ind 
            WHERE cli_codigo IN (536, 2)
        `);
        result.mercenova_records = mercenovaRes.rows;

        console.log(JSON.stringify(result, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkFreight();
