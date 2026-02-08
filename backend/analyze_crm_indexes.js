require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function analyzeIndices() {
    const tables = ['crm_interacao', 'crm_interacao_industria', 'crm_oportunidades', 'vendedores', 'clientes', 'fornecedores'];
    try {
        console.log(`Checking indexes in database: ${process.env.DB_NAME}\n`);

        for (const table of tables) {
            console.log(`--- Table: ${table} ---`);
            const res = await pool.query(`
                SELECT 
                    schemaname, 
                    indexname, 
                    indexdef 
                FROM pg_indexes 
                WHERE tablename = $1
                ORDER BY schemaname, indexname;
            `, [table]);

            if (res.rows.length === 0) {
                console.log('No indexes found.\n');
            } else {
                res.rows.forEach(r => {
                    console.log(`[${r.schemaname}] ${r.indexname}`);
                    console.log(`Def: ${r.indexdef}\n`);
                });
            }
        }
    } catch (err) {
        console.error('❌ Error analyzing indices:', err.message);
    } finally {
        await pool.end();
    }
}

analyzeIndices();
