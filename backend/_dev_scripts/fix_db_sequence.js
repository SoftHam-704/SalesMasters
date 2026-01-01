require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixSequence() {
    const client = await pool.connect();
    try {
        console.log('Fixing sequence for ite_lancto...');
        await client.query("CREATE SEQUENCE IF NOT EXISTS itens_ped_ite_lancto_seq");
        await client.query("ALTER TABLE itens_ped ALTER COLUMN ite_lancto SET DEFAULT nextval('itens_ped_ite_lancto_seq')");

        // Sync sequence value
        const res = await client.query("SELECT MAX(ite_lancto) as max_val FROM itens_ped");
        const maxVal = res.rows[0].max_val || 0;
        await client.query("SELECT setval('itens_ped_ite_lancto_seq', $1)", [maxVal]);

        console.log(`Sequence fixed! Current max value: ${maxVal}`);
    } catch (err) {
        console.error('Error fixing sequence:', err);
    } finally {
        client.release();
        pool.end();
    }
}

fixSequence();
