
const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function checkDefaults() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Checking defaults for repsoma.pedidos ---');
        const res = await pool.query(`
            SELECT column_name, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'repsoma' AND table_name = 'pedidos'
        `);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('--- Checking defaults for repsoma.itens_ped ---');
        const res2 = await pool.query(`
            SELECT column_name, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'repsoma' AND table_name = 'itens_ped'
        `);
        console.log(JSON.stringify(res2.rows, null, 2));
    } finally {
        await pool.end();
    }
}

checkDefaults();
