const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function testQuery() {
    try {
        console.log('🔍 Testing Carriers Query...');
        const query = 'SELECT tra_codigo, tra_nome, tra_cgc, tra_cidade, tra_uf, tra_fone FROM transportadora ORDER BY tra_nome LIMIT 100';
        const result = await pool.query(query);
        console.log(`✅ Success! Found ${result.rows.length} records.`);
        console.log('Sample:', result.rows[0]);
    } catch (err) {
        console.error('❌ QUERY FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

testQuery();
