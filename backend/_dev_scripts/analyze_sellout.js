const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function analyze() {
    try {
        // Get table structure
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'crm_sellout' 
            ORDER BY ordinal_position
        `);

        console.log('\n📊 ESTRUTURA DA TABELA crm_sellout:\n');
        console.table(structure.rows);

        // Get sample data
        const sample = await pool.query('SELECT * FROM crm_sellout LIMIT 5');
        console.log('\n📋 AMOSTRA DE DADOS:\n');
        console.table(sample.rows);

        // Get count
        const count = await pool.query('SELECT COUNT(*) as total FROM crm_sellout');
        console.log('\n📈 Total de registros:', count.rows[0].total);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        pool.end();
    }
}

analyze();
