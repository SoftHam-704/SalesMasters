require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function testConnectBasesales() {
    console.log('🕵️ Testando conexão direta no banco BASESALES...');

    // Config para conectar no banco 'basesales' com credenciais de admin
    const dbConfig = {
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT, // 13062
        database: 'basesales', // Forçando o nome correto do banco de dados de tenants
        user: process.env.MASTER_DB_USER, // webadmin
        password: process.env.MASTER_DB_PASSWORD,
        ssl: false
    };

    console.log(`🔌 Conectando em ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}...`);

    const pool = new Pool(dbConfig);

    try {
        const client = await pool.connect();
        try {
            console.log('✅ Conexão no BASESALES realizada!');

            // 1. Listar schemas para confirmar se 'rimef' existe
            const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
            console.log('📂 Schemas encontrados:', schemas.rows.map(r => r.schema_name).join(', '));

            // 2. Tentar acessar dados da rimef
            if (schemas.rows.some(r => r.schema_name === 'rimef')) {
                await client.query('SET search_path TO rimef, public');

                const userRes = await client.query("SELECT * FROM user_nomes WHERE nome ILIKE 'joao' LIMIT 1");
                console.log('✅ Leitura da tabela user_nomes (rimef):', userRes.rows.length > 0 ? 'OK' : 'Vazio');
                if (userRes.rows.length > 0) {
                    console.log('👤 Usuário encontrado:', userRes.rows[0]);
                }
            } else {
                console.log('❌ Schema rimef NÃO encontrado no basesales.');
            }

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Falha ao conectar no basesales:', err.message);
    } finally {
        await pool.end();
    }
}

testConnectBasesales();
