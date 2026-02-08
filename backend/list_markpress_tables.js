
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function run() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'markpress' ORDER BY table_name");
        console.log('Tabelas no schema markpress:');
        res.rows.forEach(r => console.log(` - ${r.table_name}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
