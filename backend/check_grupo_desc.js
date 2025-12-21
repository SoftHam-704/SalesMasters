const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkGrupoDesc() {
    try {
        console.log('Verificando tabela grupo_desc...\n');

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'grupo_desc'
            );
        `);

        console.log('Tabela existe?', tableCheck.rows[0].exists);

        if (tableCheck.rows[0].exists) {
            // Get table structure
            const structure = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'grupo_desc'
                ORDER BY ordinal_position;
            `);

            console.log('\nEstrutura da tabela:');
            console.table(structure.rows);

            // Get row count
            const count = await pool.query('SELECT COUNT(*) FROM grupo_desc');
            console.log(`\nTotal de registros: ${count.rows[0].count}`);

            // Get sample data
            const sample = await pool.query('SELECT * FROM grupo_desc LIMIT 10');
            console.log('\nPrimeiros 10 registros:');
            console.table(sample.rows);
        }

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkGrupoDesc();
