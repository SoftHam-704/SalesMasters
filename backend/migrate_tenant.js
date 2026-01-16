require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

const TARGET_CNPJ = process.argv[2] || '40778122000128'; // Default to RO-CONSULT

function cleanSql(sql) {
    // Remove data insertions and notices / test data sections
    // This is a simple logic: take everything BEFORE the first "INSERT INTO" or specific test data markers
    const markers = [
        '-- DADOS INICIAIS DE TESTE',
        '-- Inserir algumas tarefas de exemplo',
        'INSERT INTO',
        '-- 141-- Canal geral de comunicação'
    ];

    let clean = sql;
    markers.forEach(marker => {
        const index = clean.indexOf(marker);
        if (index !== -1) {
            clean = clean.substring(0, index);
        }
    });

    return clean.trim();
}

async function migrateTenant() {
    console.log(`\n🚀 INICIANDO MIGRAÇÃO (APENAS ESTRUTURA) PARA O TENANT: ${TARGET_CNPJ}\n`);

    try {
        // 1. Buscar info do tenant
        const tenantResult = await masterPool.query('SELECT * FROM empresas WHERE cnpj = $1', [TARGET_CNPJ]);
        if (tenantResult.rows.length === 0) {
            throw new Error(`Tenant com CNPJ ${TARGET_CNPJ} não encontrado!`);
        }

        const tenant = tenantResult.rows[0];
        console.log(`✅ Tenant: ${tenant.nome_fantasia || tenant.razao_social}`);
        console.log(`📡 Banco: ${tenant.db_nome} | Schema: ${tenant.db_schema}`);

        // 2. Conectar ao banco do tenant
        const tenantPool = new Pool({
            host: tenant.db_host,
            port: tenant.db_porta || 5432,
            database: tenant.db_name,
            user: tenant.db_usuario,
            password: tenant.db_senha,
            options: tenant.db_schema && tenant.db_schema !== 'public'
                ? `-c search_path=${tenant.db_schema},public`
                : undefined
        });

        // 3. Aplicar Agenda Pro (Apenas Estrutura)
        console.log('\n📅 Aplicando Agenda Pro (Estrutura)...');
        let sqlAgenda = fs.readFileSync(path.join(__dirname, 'migrations', 'create_agenda_tables.sql'), 'utf8');
        sqlAgenda = cleanSql(sqlAgenda);
        await tenantPool.query(sqlAgenda);
        console.log('✅ Agenda Pro Structure OK!');

        // 4. Aplicar Chat Pro (Apenas Estrutura)
        console.log('\n💬 Aplicando Chat Pro (Estrutura)...');
        let sqlChat = fs.readFileSync(path.join(__dirname, 'migrations', 'create_chat_tables.sql'), 'utf8');
        sqlChat = cleanSql(sqlChat);
        await tenantPool.query(sqlChat);
        console.log('✅ Chat Pro Structure OK!');

        // 5. Verificar tabelas
        const tablesResult = await tenantPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_name IN ('agenda', 'chat_conversas', 'chat_mensagens', 'chat_notificacoes')
        `, [tenant.db_schema || 'public']);

        console.log('\n📊 Tabelas verificadas no schema:', tablesResult.rows.map(r => r.table_name));

        // Verificar se há dados (deve ser 0)
        const counts = await tenantPool.query(`
            SELECT 
                (SELECT COUNT(*) FROM agenda) as agenda_count,
                (SELECT COUNT(*) FROM chat_conversas) as chat_conversas_count
        `);
        console.log('📈 Registros na Agenda:', counts.rows[0].agenda_count);
        console.log('📈 Registros no Chat:', counts.rows[0].chat_conversas_count);

        await tenantPool.end();
        await masterPool.end();
        console.log('\n✨ Migração de estrutura concluída com sucesso!');

    } catch (error) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error);
        await masterPool.end().catch(() => { });
        process.exit(1);
    }
}

migrateTenant();
