require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkStructure() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'cli_ind'
            ORDER BY ordinal_position
        `);

        console.log('Estrutura da tabela cli_ind:');
        console.table(result.rows);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkStructure();
