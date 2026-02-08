
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

async function listRemap() {
    try {
        const res = await pool.query("SELECT * FROM empresas WHERE cnpj = '22443147000199'");
        console.log(res.rows);
        await pool.end();
    } catch (err) {
        console.error(err);
    }
}

listRemap();
