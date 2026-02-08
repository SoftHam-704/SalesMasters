const { Pool } = require('pg');
const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function check() {
    try {
        const res = await pool.query('SELECT count(*) FROM ro_consult.itens_ped');
        console.log('Current items in DB:', res.rows[0].count);

        const struct = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' AND table_name = 'itens_ped'
            ORDER BY ordinal_position
        `);
        console.log('Table structure:');
        struct.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
