const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function compareSchemas(s1, s2) {
    try {
        const res = await pool.query(`
            WITH s1_cols AS (
                SELECT table_name, count(*) as col_count
                FROM information_schema.columns 
                WHERE table_schema = $1
                GROUP BY table_name
            ),
            s2_cols AS (
                SELECT table_name, count(*) as col_count
                FROM information_schema.columns 
                WHERE table_schema = $2
                GROUP BY table_name
            )
            SELECT 
                COALESCE(s1.table_name, s2.table_name) as table_name,
                s1.col_count as s1_count,
                s2.col_count as s2_count
            FROM s1_cols s1
            FULL OUTER JOIN s2_cols s2 ON s1.table_name = s2.table_name
            WHERE s1.col_count != s2.col_count OR s1.col_count IS NULL OR s2.col_count IS NULL
            ORDER BY table_name
        `, [s1, s2]);

        console.log(`--- Comparison: ${s1} vs ${s2} ---`);
        if (res.rowCount === 0) {
            console.log('✅ All tables match column count.');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

compareSchemas('public', 'damarep');
