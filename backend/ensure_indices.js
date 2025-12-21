require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function ensureIndices() {
    try {
        console.log('Verificando índices...');
        const client = await pool.connect();

        // 1. Index on cidades.cid_codigo (Should be PK, but ensuring index exists)
        console.log('Verificando índice em cidades(cid_codigo)...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cidades_cid_codigo ON cidades (cid_codigo);
        `);
        console.log('✓ Índice idx_cidades_cid_codigo verificado/criado.');

        // 2. Index on cidades.cid_nome (For search performance)
        console.log('Verificando índice em cidades(cid_nome)...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_cidades_cid_nome ON cidades (cid_nome);
        `);
        console.log('✓ Índice idx_cidades_cid_nome verificado/criado.');

        // 3. Index on clientes.cli_idcidade (Foreign Key column)
        console.log('Verificando índice em clientes(cli_idcidade)...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_clientes_cli_idcidade ON clientes (cli_idcidade);
        `);
        console.log('✓ Índice idx_clientes_cli_idcidade verificado/criado.');

        // 4. Verify FK Relationship (Optional but good practice)
        // Checking if constraint exists would be complex, just trusting the index for now as requested.

        console.log('Concluído! Todos os índices foram verificados.');
        client.release();
        process.exit(0);

    } catch (error) {
        console.error('Erro ao criar índices:', error);
        process.exit(1);
    }
}

ensureIndices();
