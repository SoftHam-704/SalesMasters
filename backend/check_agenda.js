require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function check() {
    console.log('Conectando em:', process.env.DB_HOST);
    try {
        // Verificar schemas com tabela agenda
        const schemas = await pool.query(`
            SELECT schemaname, tablename 
            FROM pg_catalog.pg_tables 
            WHERE tablename = 'agenda'
        `);
        console.log('\n📋 Schemas com tabela "agenda":', schemas.rows);

        // Verificar search_path atual
        const sp = await pool.query('SHOW search_path');
        console.log('\n🔍 Search path atual:', sp.rows[0].search_path);

        // Testar acesso direto
        try {
            const test = await pool.query('SELECT COUNT(*) as total FROM public.agenda');
            console.log('\n✅ Acesso a public.agenda OK! Total:', test.rows[0].total);
        } catch (e) {
            console.log('\n❌ Erro ao acessar public.agenda:', e.message);
        }

        await pool.end();
    } catch (error) {
        console.error('Erro:', error.message);
        await pool.end();
    }
}

check();
