const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function listSchemas() {
    try {
        const res = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata
        `);
        console.log("Schemas disponíveis:");
        res.rows.forEach(row => {
            console.log(`- ${row.schema_name}`);
        });
    } catch (err) {
        console.error("Erro ao listar schemas:", err.message);
    } finally {
        await pool.end();
    }
}
listSchemas();
