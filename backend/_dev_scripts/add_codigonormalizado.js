const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function addColumn() {
    try {
        await pool.query(`
            ALTER TABLE itens_ped 
            ADD COLUMN IF NOT EXISTS ite_codigonormalizado VARCHAR(50)
        `);
        console.log('✅ Coluna ite_codigonormalizado adicionada!');
    } catch (e) {
        console.error('❌ Erro:', e.message);
    } finally {
        await pool.end();
    }
}

addColumn();
