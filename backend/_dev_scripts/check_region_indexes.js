const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkRegionIndexes() {
    try {
        console.log('--- Checking Indexes for Regions ---');

        const res = await pool.query(`
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename IN ('regioes', 'clientes')
              AND (indexdef LIKE '%cli_regiao2%' OR tablename = 'regioes')
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

checkRegionIndexes();
