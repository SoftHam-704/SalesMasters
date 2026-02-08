const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkAllCols() {
    try {
        console.log('--- Checking all columns in ro_consult.agenda ---');
        const res = await pool.query(`
            SELECT column_name, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' AND table_name = 'agenda'
            ORDER BY ordinal_position
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkAllCols();
