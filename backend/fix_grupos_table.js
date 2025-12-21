require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function fixGruposTable() {
    try {
        console.log('Corrigindo tabela GRUPOS...\n');

        // Drop existing table
        await pool.query('DROP TABLE IF EXISTS grupos CASCADE');
        console.log('✅ Tabela antiga removida');

        // Create correct structure
        await pool.query(`
            CREATE TABLE GRUPOS (
                GRU_CODIGO INTEGER NOT NULL,
                GRU_NOME VARCHAR(50),
                GRU_PERCOMISS DOUBLE PRECISION,
                GID VARCHAR(38)
            )
        `);
        console.log('✅ Tabela GRUPOS criada com estrutura correta');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

fixGruposTable();
