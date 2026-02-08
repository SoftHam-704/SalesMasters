const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkCamilaAgenda() {
    try {
        console.log('--- Checking ro_consult.agenda table existence ---');
        const resTable = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'ro_consult' AND table_name = 'agenda'
        `);
        console.log('Table exists:', resTable.rows.length > 0);

        if (resTable.rows.length === 0) {
            console.log('❌ TABLE ro_consult.agenda DOES NOT EXIST!');
        } else {
            console.log('\n--- Checking column structure ---');
            const resCols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'ro_consult' AND table_name = 'agenda'
                ORDER BY ordinal_position
            `);
            resCols.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

            console.log('\n--- Checking recent entries for user Camila Almeida ---');
            // We need to find the user id first. In basesales, which table holds users?
            // Usually cad_usu or something.
        }

        await pool.end();
    } catch (e) {
        console.error(err);
        await pool.end();
    }
}

checkCamilaAgenda();
