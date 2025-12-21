require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkSchema() {
    try {
        console.log('Verificando colunas da tabela clientes...');
        const client = await pool.connect();

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clientes';
        `);

        console.log('Colunas encontradas:');
        res.rows.forEach(row => console.log(`${row.column_name} (${row.data_type})`));

        client.release();
        process.exit(0);

    } catch (error) {
        console.error('Erro ao verificar schema:', error);
        process.exit(1);
    }
}

checkSchema();
