
const { Pool } = require('pg');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

const pool = new Pool(config);

async function checkCount() {
    try {
        const res = await pool.query("SELECT count(*) FROM markpress.cad_prod");
        console.log(`cad_prod no markpress: ${res.rows[0].count}`);
    } catch (err) {
        console.error('Erro cad_prod:', err.message);
    } finally {
        await pool.end();
    }
}

checkCount();
