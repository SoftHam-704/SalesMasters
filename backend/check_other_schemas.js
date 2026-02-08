const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function checkStructure() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const schemas = ['repsoma', 'markpress', 'rimef'];

        for (const s of schemas) {
            console.log(`\nChecking Schema: ${s}`);
            const t = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [s]);
            const tables = t.rows.map(r => r.table_name);
            console.log(`Tables: ${tables.join(', ')}`);

            if (tables.includes('pedidos')) {
                const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='pedidos'`, [s]);
                console.log(`Pedidos Cols: ${cols.rows.length}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkStructure();
