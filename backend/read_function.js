const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function readFunc() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'trg_fn_auto_normalizar_item'");
        if (res.rows.length > 0) {
            console.log('--- FUNCTION: trg_fn_auto_normalizar_item ---');
            console.log(res.rows[0].prosrc);
        } else {
            console.log('Function not found');
        }

        const trgs = await client.query("SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE event_object_table = 'itens_ped'");
        console.log('\n--- TRIGGERS on itens_ped ---');
        console.table(trgs.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

readFunc();
