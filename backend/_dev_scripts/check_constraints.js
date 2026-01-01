const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkConstraints() {
    try {
        const res = await pool.query(`
            SELECT conname, contype
            FROM pg_constraint
            WHERE conrelid = 'itens_ped'::regclass
        `);
        console.log('Constraints em itens_ped:');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkConstraints();
