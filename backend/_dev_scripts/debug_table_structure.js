require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTable() {
    const client = await pool.connect();
    try {
        console.log('--- Table Information for itens_ped ---');
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'itens_ped'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);

        console.log('\n--- Constraints for itens_ped ---');
        const cons = await client.query(`
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'itens_ped'::regclass;
        `);
        console.table(cons.rows);

        console.log('\n--- Triggers for itens_ped ---');
        const trig = await client.query(`
            SELECT tgname
            FROM pg_trigger
            WHERE tgrelid = 'itens_ped'::regclass;
        `);
        console.table(trig.rows);

    } catch (err) {
        console.error('Error checking table:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkTable();
