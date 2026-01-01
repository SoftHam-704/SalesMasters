const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkConstraint() {
    try {
        const res = await pool.query(`
            SELECT 
                con.conname AS constraint_name,
                pg_get_constraintdef(con.oid) AS definition
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'cad_prod'
            AND con.conname = 'uk_prod_industria_normalizado'
        `);

        console.log('Definição da constraint:');
        console.log(res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkConstraint();
