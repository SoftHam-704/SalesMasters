
const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia\SalesMasters/backend/.env' });

async function findAndReset() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const schema = 'repsoma';

    try {
        console.log(`--- Procurando sequences no schema [${schema}] ---`);
        const res = await pool.query(`
            SELECT n.nspname as schema_name, c.relname as sequence_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'S' AND n.nspname = $1
        `, [schema]);

        console.log('Sequences encontradas:', JSON.stringify(res.rows, null, 2));

        for (const row of res.rows) {
            const seqName = row.sequence_name;
            if (seqName.includes('pedidos') || seqName.includes('itens_ped')) {
                console.log(`🔄 Resetando ${schema}.${seqName}...`);
                await pool.query(`ALTER SEQUENCE ${schema}.${seqName} RESTART WITH 1`);
                console.log(`✅ ${schema}.${seqName} resetada.`);
            }
        }
    } finally {
        await pool.end();
    }
}

findAndReset();
