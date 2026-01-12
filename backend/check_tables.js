const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkTables() {
    try {
        const tables = ['grupos', 'grupo_desc', 'categoria_prod', 'area_atu', 'regioes', 'transportadora', 'pedidos'];
        console.log('🔍 Checking tables in local database "basesales"...');

        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT count(*) FROM ${table}`);
                console.log(`✅ Table "${table}" exists. Count: ${res.rows[0].count}`);
            } catch (err) {
                console.log(`❌ Table "${table}" DOES NOT EXIST or error: ${err.message}`);
            }
        }
    } catch (err) {
        console.error('❌ Error connecting to database:', err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
