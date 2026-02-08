const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkConstraints() {
    try {
        console.log('--- Checking constraints on ro_consult.agenda ---');
        const res = await pool.query(`
            SELECT
                conname AS constraint_name,
                contype AS constraint_type,
                pg_get_constraintdef(c.oid) AS constraint_definition
            FROM
                pg_constraint c
            JOIN
                pg_namespace n ON n.oid = c.connamespace
            WHERE
                n.nspname = 'ro_consult'
                AND conrelid = 'ro_consult.agenda'::regclass
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkConstraints();
