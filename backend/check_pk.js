
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
async function run() {
    try {
        const res = await pool.query(`
            SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = 'markpress.cli_aniv'::regclass AND i.indisprimary;
        `);
        console.log('PK de cli_aniv:', res.rows);
    } catch (err) { console.error(err); } finally { await pool.end(); }
}
run();
