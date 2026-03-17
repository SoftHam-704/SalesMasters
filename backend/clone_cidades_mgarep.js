const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function cloneCidadesData() {
    const client = await pool.connect();
    try {
        console.log("🚚 Copiando dados da tabela cidades: public -> mgarep");

        // Limpar se houver algo (segurança)
        await client.query("DELETE FROM mgarep.cidades");

        // Inserir dados
        const result = await client.query(`
            INSERT INTO mgarep.cidades 
            SELECT * FROM public.cidades
        `);

        console.log(`✅ Sucesso! ${result.rowCount} cidades copiadas para mgarep.`);
    } catch (err) {
        console.error("❌ Erro ao copiar cidades:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}
cloneCidadesData();
