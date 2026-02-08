
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function fixPK() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 30000
    });

    try {
        console.log('--- Alterando Primary Key de repsoma.itens_ped ---');

        // 1. Drop existing PK
        console.log('1. Removendo PK atual (itens_ped_pkey)...');
        await pool.query('ALTER TABLE repsoma.itens_ped DROP CONSTRAINT IF EXISTS itens_ped_pkey');

        // 2. Add new PK just with ite_lancto
        console.log('2. Definindo nova PK (ite_lancto)...');
        await pool.query('ALTER TABLE repsoma.itens_ped ADD PRIMARY KEY (ite_lancto)');

        // 3. Drop NOT NULL on ite_idproduto
        console.log('3. Removendo NOT NULL de ite_idproduto...');
        await pool.query('ALTER TABLE repsoma.itens_ped ALTER COLUMN ite_idproduto DROP NOT NULL');

        console.log('✅ Estrutura corrigida com sucesso.');
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

fixPK();
