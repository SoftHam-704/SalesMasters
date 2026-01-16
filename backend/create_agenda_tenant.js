// Script para criar tabela agenda no schema do tenant
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Master pool para buscar info do tenant
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

const TENANT_CNPJ = '17504829000124';

async function createAgendaInTenant() {
    console.log('\n📅 CRIANDO TABELA AGENDA NO TENANT\n');
    console.log(`🔍 Buscando configurações para CNPJ: ${TENANT_CNPJ}`);

    try {
        // 1. Buscar configurações do tenant no Master
        const tenantResult = await masterPool.query(`
            SELECT * FROM tenants WHERE cnpj = $1
        `, [TENANT_CNPJ]);

        if (tenantResult.rows.length === 0) {
            throw new Error('Tenant não encontrado!');
        }

        const tenant = tenantResult.rows[0];
        console.log(`✅ Tenant encontrado: ${tenant.nome}`);
        console.log(`   Schema: ${tenant.db_schema || 'public'}`);
        console.log(`   Database: ${tenant.db_name}`);
        console.log(`   Host: ${tenant.db_host}`);

        // 2. Conectar ao banco do tenant
        const tenantPool = new Pool({
            host: tenant.db_host,
            port: tenant.db_port || 5432,
            database: tenant.db_name,
            user: tenant.db_user,
            password: tenant.db_password,
            options: tenant.db_schema && tenant.db_schema !== 'public'
                ? `-c search_path=${tenant.db_schema},public`
                : undefined
        });

        // 3. Testar conexão
        const testConn = await tenantPool.query('SELECT current_schema()');
        console.log(`\n📡 Conectado! Schema atual: ${testConn.rows[0].current_schema}`);

        // 4. Ler e executar SQL de migração
        const sqlPath = path.join(__dirname, 'migrations', 'create_agenda_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('\n⚙️  Executando migração...');
        await tenantPool.query(sql);

        // 5. Verificar
        const check = await tenantPool.query('SELECT COUNT(*) as total FROM agenda');
        console.log(`\n✅ Tabela agenda criada! Total de registros: ${check.rows[0].total}`);

        await tenantPool.end();
        await masterPool.end();

        console.log('\n🚀 Migração concluída!\n');

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        await masterPool.end().catch(() => { });
        process.exit(1);
    }
}

createAgendaInTenant();
