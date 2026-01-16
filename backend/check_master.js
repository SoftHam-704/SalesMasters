// Verificar configuração do tenant no banco master
require('dotenv').config();
const { Pool } = require('pg');

// Conexão ao banco MASTER
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function checkTenantConfig() {
    console.log('\n🔍 VERIFICANDO CONFIGURAÇÃO DO TENANT NO MASTER\n');

    try {
        // Listar todas as tabelas do banco master
        const tables = await masterPool.query(`
            SELECT tablename FROM pg_catalog.pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY tablename
        `);
        console.log('📋 Tabelas no banco master:', tables.rows.map(r => r.tablename));

        // Tentar diferentes nomes de tabela de tenants
        const possibleTables = ['tenants', 'empresas', 'clientes', 'emp_config', 'tenant_config'];

        for (const tableName of possibleTables) {
            try {
                const result = await masterPool.query(`SELECT * FROM ${tableName} LIMIT 3`);
                if (result.rows.length > 0) {
                    console.log(`\n✅ Tabela ${tableName} encontrada! Colunas:`, Object.keys(result.rows[0]));
                    console.log('   Dados:', result.rows);
                }
            } catch (e) {
                // Tabela não existe, continua
            }
        }

        await masterPool.end();
    } catch (error) {
        console.error('❌ ERRO:', error.message);
        await masterPool.end().catch(() => { });
    }
}

checkTenantConfig();
