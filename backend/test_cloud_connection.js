const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
});

async function testConnection() {
    try {
        console.log('--- TESTE DE CONEXÃO CLOUD ---');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Port: ${process.env.DB_PORT}`);
        console.log(`User: ${process.env.DB_USER}`);
        console.log(`DB: ${process.env.DB_NAME}`);

        const start = Date.now();
        const res = await pool.query('SELECT NOW() as now, current_database() as db');
        const duration = Date.now() - start;

        console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
        console.log(`Banco: ${res.rows[0].db}`);
        console.log(`Hora no servidor: ${res.rows[0].now}`);
        console.log(`Tempo de resposta: ${duration}ms`);

    } catch (err) {
        console.error('❌ ERRO NA CONEXÃO:');
        console.error('Mensagem:', err.message);
        console.error('Código:', err.code);
    } finally {
        await pool.end();
    }
}

testConnection();
