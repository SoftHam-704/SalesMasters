const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'basesales',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: process.env.DB_PORT || 5432,
});

async function checkIndexes() {
    try {
        console.log('--- Checking Indexes ---');
        console.log('Querying pg_indexes for "cidades" and "clientes"...\n');

        const res = await pool.query(`
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename IN ('cidades', 'clientes')
            ORDER BY tablename, indexname;
        `);

        res.rows.forEach(row => {
            console.log(`Table: ${row.tablename} | Index: ${row.indexname}`);
            console.log(`Def: ${row.indexdef}\n`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkIndexes();
