
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runCompare() {
    try {
        console.log('--- Comparando PUBLIC vs SEVENREP ---');

        // 1. Tabelas faltando
        const missingTablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name NOT IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'sevenrep')
              AND table_type = 'BASE TABLE'
        `);
        console.log('Tabelas faltando em sevenrep:', missingTablesRes.rows.map(r => r.table_name));

        // 2. Colunas faltando em tabelas existentes
        const missingColsRes = await pool.query(`
            SELECT p.table_name, p.column_name, p.data_type
            FROM information_schema.columns p
            WHERE p.table_schema = 'public'
              AND p.table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'sevenrep')
              AND NOT EXISTS (
                  SELECT 1 FROM information_schema.columns s 
                  WHERE s.table_schema = 'sevenrep' 
                    AND s.table_name = p.table_name 
                    AND s.column_name = p.column_name
              )
            ORDER BY p.table_name
        `);

        const grouped = {};
        missingColsRes.rows.forEach(r => {
            if (!grouped[r.table_name]) grouped[r.table_name] = [];
            grouped[r.table_name].push(r.column_name);
        });
        console.log('Colunas faltando em tabelas existentes:', JSON.stringify(grouped, null, 2));

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

runCompare();
