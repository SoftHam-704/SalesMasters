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

async function check() {
    try {
        const res = await pool.query(`
            SELECT n.nspname, p.proname, p.oid, pg_get_function_arguments(p.oid) as args
            FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE p.proname IN ('fn_upsert_produto', 'fn_upsert_preco');
        `);
        console.log(`Found ${res.rows.length} functions.`);
        res.rows.forEach(row => {
            console.log("Namespace:", row.nspname, "Name:", row.proname, "OID:", row.oid, "Args:", row.args);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();

