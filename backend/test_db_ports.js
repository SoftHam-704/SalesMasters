const { Client } = require('pg');
require('dotenv').config();

async function testConnection(host, port, user, password, database) {
    const client = new Client({
        host,
        port,
        user,
        password,
        database,
        connectionTimeoutMillis: 5000,
    });

    try {
        console.log(`Tentando conectar em ${host}:${port}...`);
        await client.connect();
        console.log(`✅ SUCESSO na porta ${port}`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`❌ FALHA na porta ${port}: ${err.message}`);
        return false;
    }
}

async function run() {
    const host = 'node254557-salesmaster.sp1.br.saveincloud.net.br';
    const user = process.env.DB_USER;
    const pass = process.env.DB_PASSWORD;
    const db = 'salesmasters_master';

    await testConnection(host, 13062, user, pass, db);
    await testConnection(host, 5432, user, pass, db);

    // Tenta também pelo hostname interno sem os sufixos se for o caso
    const internalHost = 'node254557-salesmaster';
    await testConnection(internalHost, 5432, user, pass, db);

    process.exit(0);
}

run();
