
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        const res = await pool.query(`
            ALTER TABLE pedidos 
            ADD COLUMN IF NOT EXISTS ped_pedindustria VARCHAR(50);
        `);
        console.log('Added ped_pedindustria column successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        pool.end();
    }
}

migrate();
