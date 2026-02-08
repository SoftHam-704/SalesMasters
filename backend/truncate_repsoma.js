
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function run() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Realizando TRUNCATE RESTART IDENTITY no schema repsoma ---');

        // Limpar pedidos (isso vai falhar se tiver itens_ped, por isso CASCADE)
        await pool.query('TRUNCATE repsoma.pedidos RESTART IDENTITY CASCADE');
        console.log('✅ Pedidos limpos e sequence resetada.');

        // Limpar itens_ped
        await pool.query('TRUNCATE repsoma.itens_ped RESTART IDENTITY CASCADE');
        console.log('✅ Itens Pedidos limpos e sequence resetada.');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

run();
