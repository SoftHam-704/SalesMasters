
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
            SELECT routine_definition 
            FROM information_schema.routines 
            WHERE routine_schema = 'markpress' AND routine_name = 'fn_normalizar_codigo'
        `);
        console.log('Definição da função fn_normalizar_codigo:');
        console.log(res.rows[0].routine_definition);
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
