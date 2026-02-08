const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function inspect() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Colunas repsoma.pedidos ---');
        const ped = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='repsoma' AND table_name='pedidos'`);
        ped.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        console.log('\n--- Colunas repsoma.itens_ped ---');
        const ite = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='repsoma' AND table_name='itens_ped'`);
        ite.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        console.log('\n--- Primary Keys ---');
        const pks = await pool.query(`
            SELECT kcu.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'repsoma' AND tc.table_name IN ('pedidos', 'itens_ped')
        `);
        pks.rows.forEach(r => console.log(`  ${r.table_name} PK: ${r.column_name}`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
inspect();
