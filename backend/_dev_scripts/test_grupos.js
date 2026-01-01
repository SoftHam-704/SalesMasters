const { Pool } = require('pg');
require('dotenv').config();

// Use a mesma configuração do server.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testGrupos() {
    try {
        console.log('Testing grupos table...\n');

        const result = await pool.query('SELECT gru_codigo, gru_descricao FROM grupos ORDER BY gru_descricao LIMIT 10');

        console.log(`Found ${result.rows.length} groups:`);
        console.table(result.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

testGrupos();
