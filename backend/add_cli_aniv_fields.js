const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function addFields() {
    try {
        console.log('🏁 Adicionando novos campos em cli_aniv...');

        await pool.query(`
            ALTER TABLE cli_aniv 
            ADD COLUMN IF NOT EXISTS ani_timequetorce VARCHAR(50),
            ADD COLUMN IF NOT EXISTS ani_esportepreferido VARCHAR(50),
            ADD COLUMN IF NOT EXISTS ani_hobby VARCHAR(50);
        `);

        console.log('✅ Campos adicionados com sucesso!');
    } catch (err) {
        console.error('Erro ao adicionar campos:', err.message);
    } finally {
        pool.end();
    }
}

addFields();
