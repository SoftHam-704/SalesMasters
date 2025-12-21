require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkTables() {
    try {
        // Check indclientes
        const indclientesCount = await pool.query('SELECT COUNT(*) as total FROM indclientes');
        console.log('📊 Tabela INDCLIENTES:', indclientesCount.rows[0].total, 'registros');

        // Check cli_ind
        const cliIndCount = await pool.query('SELECT COUNT(*) as total FROM cli_ind');
        console.log('📊 Tabela CLI_IND:', cliIndCount.rows[0].total, 'registros');

        // Show structure of indclientes
        const indclientesStructure = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'indclientes'
            ORDER BY ordinal_position
        `);
        console.log('\n📋 Estrutura INDCLIENTES:');
        indclientesStructure.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkTables();
