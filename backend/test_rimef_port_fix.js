require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function testRimefConnectionFixedPort() {
    console.log('🕵️ Testando conexão RIMEF com porta corrigida (13062)...');

    // Configurações baseadas no que vimos no banco, mas com PORTA CORRIGIDA
    const dbConfig = {
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062, // Forçando a porta correta do ambiente
        database: 'basesales',
        user: 'sistemas', // Usuário que estava na tabela
        password: 'hamilton123', // Senha recuperada do banco
        ssl: false
    };

    console.log(`🔌 Conectando em ${dbConfig.host}:${dbConfig.port} User: ${dbConfig.user}...`);

    const pool = new Pool(dbConfig);

    try {
        // Tentar definir search_path
        const client = await pool.connect();
        try {
            await client.query('SET search_path TO rimef, public');
            const res = await client.query('SELECT CURRENT_SCHEMA()');
            console.log('✅ Conexão BEM SUCEDIDA! Schema atual:', res.rows[0].current_schema);

            const userRes = await client.query("SELECT * FROM user_nomes WHERE nome ILIKE 'joao' LIMIT 1");
            console.log('✅ Usuário encontrado com porta corrigida:', userRes.rows.length > 0 ? 'SIM' : 'NÃO');
            if (userRes.rows.length > 0) console.log(userRes.rows[0]);

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Falha na conexão com porta corrigida:', err.message);
    } finally {
        await pool.end();
    }
}

testRimefConnectionFixedPort();
