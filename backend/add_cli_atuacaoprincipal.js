require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function addColumn() {
    try {
        console.log('Adicionando coluna cli_atuacaoprincipal à tabela clientes...');
        const client = await pool.connect();

        // Add column if not exists
        await client.query(`
            ALTER TABLE clientes 
            ADD COLUMN IF NOT EXISTS cli_atuacaoprincipal INTEGER;
        `);

        console.log('✓ Coluna cli_atuacaoprincipal criada com sucesso.');

        // Add index for performance check
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_clientes_cli_atuacaoprincipal ON clientes (cli_atuacaoprincipal);
        `);
        console.log('✓ Índice criado.');

        client.release();
        process.exit(0);

    } catch (error) {
        console.error('Erro ao adicionar coluna:', error);
        process.exit(1);
    }
}

addColumn();
