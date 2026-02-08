require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function testRimefWebadmin() {
    console.log('🕵️ Testando conexão RIMEF com usuário webadmin (Master)...');

    const dbConfig = {
        host: process.env.MASTER_DB_HOST, // node254557...
        port: process.env.MASTER_DB_PORT, // 13062
        database: process.env.MASTER_DB_DATABASE || 'basesales',
        user: process.env.MASTER_DB_USER, // webadmin
        password: process.env.MASTER_DB_PASSWORD, // ytAyO0u043
        ssl: false
    };

    console.log(`🔌 Conectando como ${dbConfig.user} na porta ${dbConfig.port}...`);

    const pool = new Pool(dbConfig);

    try {
        const client = await pool.connect();
        try {
            // Tenta acessar o schema rimef
            await client.query('SET search_path TO rimef, public');
            const res = await client.query('SELECT CURRENT_SCHEMA()');
            console.log('✅ Conexão WEBADMIN BEM SUCEDIDA! Schema:', res.rows[0].current_schema);

            // Tenta buscar o usuário joao
            const userRes = await client.query("SELECT * FROM user_nomes WHERE nome ILIKE 'joao' LIMIT 1");
            console.log('✅ Dados lidos com webadmin:', userRes.rows.length > 0 ? 'SIM' : 'NÃO');
            if (userRes.rows.length > 0) {
                console.log('👤 Usuário:', userRes.rows[0].nome, userRes.rows[0].sobrenome);
            }

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Falha na conexão com webadmin:', err.message);
    } finally {
        await pool.end();
    }
}

testRimefWebadmin();
