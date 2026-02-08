
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

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
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'markpress' AND table_name = 'pedidos'
            ORDER BY ordinal_position
        `);
        console.log('Colunas de markpress.pedidos:');
        res.rows.forEach(row => console.log(` - ${row.column_name}: ${row.data_type}`));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
