
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function fixAndImport() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 30000 // 30 seconds
    });

    try {
        console.log('--- Removendo NOT NULL de repsoma.itens_ped.ite_idproduto ---');
        await pool.query('ALTER TABLE repsoma.itens_ped ALTER COLUMN ite_idproduto DROP NOT NULL');
        console.log('✅ NOT NULL removido.');
    } catch (err) {
        console.error('❌ Erro ao alterar tabela:', err.message);
        // Se o erro for que a coluna já é nullable ou algo assim, podemos continuar
    } finally {
        await pool.end();
    }
}

fixAndImport();
