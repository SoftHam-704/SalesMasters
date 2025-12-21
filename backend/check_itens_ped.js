const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkItensPedStructure() {
    const client = await pool.connect();
    try {
        console.log('🔍 Verificando estrutura da tabela itens_ped...\n');

        const result = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'itens_ped'
            ORDER BY ordinal_position
        `);

        console.log('Colunas encontradas:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''})`);
        });

        console.log('\n🔍 Verificando dados de exemplo...\n');
        const sample = await client.query('SELECT * FROM itens_ped LIMIT 3');
        console.log('Exemplo de dados:');
        console.log(sample.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkItensPedStructure().catch(console.error);
