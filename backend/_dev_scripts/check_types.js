
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTypes() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pedidos' 
            AND column_name IN ('ped_cliind', 'ped_nffat');
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkTypes();
