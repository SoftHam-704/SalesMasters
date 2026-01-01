const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT 
                column_name, 
                data_type, 
                column_default,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'cli_aniv'
        `);
        console.table(res.rows);

        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'cli_aniv'::regclass;
        `);
        console.table(constraints.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
