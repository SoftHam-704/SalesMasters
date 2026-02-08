
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT tgname, pg_get_triggerdef(t.oid) 
            FROM pg_trigger t 
            JOIN pg_class c ON c.oid = t.tgrelid 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'markpress' AND c.relname = 'cad_prod'
        `);
        console.log('Triggers em cad_prod:');
        res.rows.forEach(row => console.log(` - ${row.tgname}: ${row.pg_get_triggerdef}`));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
