
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkPK() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const res = await pool.query(`
            SELECT a.attname 
            FROM pg_index i 
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) 
            WHERE i.indrelid = 'repsoma.itens_ped'::regclass AND i.indisprimary
        `);
        console.log('Primary Key Columns:', JSON.stringify(res.rows, null, 2));

        const res2 = await pool.query(`
            SELECT conname FROM pg_constraint WHERE conrelid = 'repsoma.itens_ped'::regclass AND contype = 'p'
        `);
        console.log('Constraint Name:', JSON.stringify(res2.rows, null, 2));
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkPK();
