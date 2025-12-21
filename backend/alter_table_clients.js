require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function alterTable() {
    const client = await pool.connect();
    try {
        console.log('🔧 Adicionando colunas faltantes em CLIENTES...');

        const queries = [
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_fone2 VARCHAR(20);", // Celular
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_fone3 VARCHAR(20);", // Fax
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_skype VARCHAR(100);", // Logotipo (Legacy reuse)
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_suframa VARCHAR(50);",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_obs TEXT;",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_dtabertura DATE;",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_cxpostal VARCHAR(50);",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_obspedido TEXT;",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_refcom TEXT;",
            "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_complemento VARCHAR(100);"
        ];

        for (const query of queries) {
            await client.query(query);
            console.log(`✅ Executado: ${query}`);
        }

        console.log('🎉 Tabela atualizada com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao alterar tabela:', err.message);
    } finally {
        client.release();
        pool.end();
    }
}

alterTable();
