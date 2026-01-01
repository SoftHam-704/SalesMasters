const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkAllConstraints() {
    try {
        const res = await pool.query(`
            SELECT
                conname,
                contype,
                pg_get_constraintdef(oid) as def
            FROM pg_constraint
            WHERE conrelid = 'cad_prod'::regclass
            ORDER BY conname
        `);

        console.log('Todas as constraints em cad_prod:');
        res.rows.forEach(r => {
            console.log(`\n${r.conname} (${r.contype}):`);
            console.log(`  ${r.def}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkAllConstraints();
