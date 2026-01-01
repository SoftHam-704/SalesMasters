require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        console.log('Checking cad_prod schema (Packaging & Orig Code)...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'cad_prod'
            AND column_name IN ('pro_codigooriginal', 'pro_embalagem', 'pro_emb', 'pro_multiplo', 'pro_caixa')
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
