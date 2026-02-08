
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

const pool = new Pool(config);

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = 'markpress' AND table_name = 'vendedores'
        `);
        console.log('Tipos das colunas de markpress.vendedores:');
        res.rows.forEach(row => console.log(` - ${row.column_name}: ${row.data_type}(${row.character_maximum_length || ''})`));
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
