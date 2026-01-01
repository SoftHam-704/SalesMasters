require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkAutoIncrement() {
    try {
        const query = `
            SELECT table_name, column_name, column_default, is_identity
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND (
                (table_name = 'transportadora' AND column_name = 'tra_codigo') OR
                (table_name = 'clientes' AND column_name = 'cli_codigo')
              );
        `;
        const res = await pool.query(query);
        console.log('Columns Info:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkAutoIncrement();
