const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function list() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const res = await pool.query(`
            SELECT sequence_schema, sequence_name 
            FROM information_schema.sequences
            WHERE sequence_schema IN ('public', 'repsoma')
            ORDER BY sequence_schema, sequence_name;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
list();
