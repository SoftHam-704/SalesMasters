const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'cad_tabelaspre' 
            ORDER BY ordinal_position
        `);

        console.log('📋 Colunas da tabela cad_tabelaspre:');
        console.log('=====================================');
        result.rows.forEach(row => {
            console.log(`${row.column_name} (${row.data_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

checkColumns();
