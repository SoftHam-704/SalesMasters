const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function inspect() {
    try {
        const res = await pool.query(`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'fornecedores'
        `);
        console.log('Columns:', res.rows.map(r => r.column_name));
        pool.end();
    } catch (err) {
        console.error(err);
    }
}

inspect();
