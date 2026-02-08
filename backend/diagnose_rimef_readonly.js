require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

// Conexão Master (Nuvem)
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function diagnose() {
    console.log('🕵️ Diagnóstico RIMEF (Modo Leitura - Adaptado para Teste Local)');

    try {
        // 1. Obter config original do banco
        const res = await masterPool.query("SELECT * FROM empresas WHERE cnpj = '05122231000191'");
        if (res.rows.length === 0) {
            console.log('❌ Empresa não encontrada.');
            return;
        }
        const config = res.rows[0];
        console.log('📋 Configuração no Banco (PRODUÇÃO):');
        console.log(`   Host: ${config.db_host}`);
        console.log(`   Porta: ${config.db_porta}`);
        console.log(`   User: ${config.db_usuario}`);
        console.log(`   Schema: ${config.db_schema}`);

        // 2. Adaptar para teste LOCAL (NÃO altera o banco)
        // Precisamos usar a porta externa para testar daqui
        const testConfig = {
            host: process.env.MASTER_DB_HOST, // Força host externo
            port: process.env.MASTER_DB_PORT, // Força porta externa (13062)
            database: config.db_nome,
            user: config.db_usuario,
            password: config.db_senha, // Testar a senha que está no banco
            schema: config.db_schema
        };

        console.log('\n🔌 Tentando conectar DAQUI com credenciais do banco (via porta externa)...');
        console.log(`   User: ${testConfig.user}`);
        console.log(`   Pass: ${testConfig.password}`);

        const tenantPool = new Pool(testConfig);

        try {
            const client = await tenantPool.connect();
            console.log('✅ Conexão BEM SUCEDIDA! A senha no banco está correta.');
            client.release();
        } catch (err) {
            console.log('❌ FALHA DE AUTENTICAÇÃO/CONEXÃO:');
            console.log('   ' + err.message);
            console.log('\n⚠️ CONCLUSÃO:');
            if (err.message.includes('password authentication')) {
                console.log('   A senha no banco de dados está INCORRETA.');
            } else {
                console.log('   Erro de rede ou permissão (pode ser normal se o user só aceita acesso local).');
            }
        }

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await masterPool.end();
    }
}

diagnose();
