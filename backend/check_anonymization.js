require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function checkSuppliers() {
    try {
        console.log('\n🔍 VERIFICANDO FORNECEDORES (NOME E NOME REDUZIDO)...\n');

        const result = await pool.query(`
            SELECT for_codigo, for_nome, for_nomered 
            FROM public.fornecedores 
            LIMIT 5
        `);

        console.table(result.rows);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkSuppliers();
