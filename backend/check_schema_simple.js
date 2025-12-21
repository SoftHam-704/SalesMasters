require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('atua_cli', 'area_atu');
        `);
        console.log("Found tables:", res.rows.map(r => r.table_name));

        if (res.rows.length > 0) {
            const cols = await pool.query(`
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name IN ('atua_cli', 'area_atu')
                ORDER BY table_name, ordinal_position;
            `);
            console.log("Columns:", JSON.stringify(cols.rows, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
