const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'crm_interacao'
            AND table_schema = 'public';
        `);
        console.log('Columns in public.crm_interacao:');
        console.table(res.rows);

        const res2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'crm_interacao'
            AND table_schema = 'ndsrep';
        `);
        console.log('Columns in ndsrep.crm_interacao:');
        console.table(res2.rows);
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
