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

async function inspectTables() {
    try {
        await pool.query('SET search_path TO repsoma');

        const tables = ['cad_prod', 'cad_tabelaspre', 'itens_ped', 'pedidos'];

        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'repsoma' AND table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            console.log(`\n--- ${table.toUpperCase()} ---`);
            res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
        }

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

inspectTables();
