const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkIndexes() {
    try {
        const res = await pool.query(`
            SELECT
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'cad_prod'
            ORDER BY indexname
        `);

        console.log('Indexes em cad_prod:');
        res.rows.forEach(r => {
            console.log(`\n${r.indexname}:`);
            console.log(`  ${r.indexdef}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkIndexes();
