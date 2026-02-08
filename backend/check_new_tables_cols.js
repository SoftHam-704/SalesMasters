
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
        const tables = ['transportadora', 'cli_aniv'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'markpress' AND table_name = '${table}'`);
            console.log(`Colunas de markpress.${table}:`);
            res.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
