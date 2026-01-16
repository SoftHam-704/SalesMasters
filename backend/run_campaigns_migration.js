// Script para criar tabela de Campanhas em TODOS os Schemas (Multi-tenant Seguro)
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do Banco Mestre (apenas para listar empresas)
const MASTER_CONFIG = {
    host: process.env.MASTER_DB_HOST || '10.100.28.17',
    port: parseInt(process.env.MASTER_DB_PORT || '5432'),
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    ssl: false
};

// Configuração Base dos Tenants (mesmo servidor, schemas diferentes)
const TENANT_CONFIG = {
    host: '10.100.28.17',
    port: 5432,
    database: 'basesales', // Todos os tenants estão no mesmo DB físico
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false
};

async function runMigrationForSchema(schemaName) {
    const pool = new Pool({
        ...TENANT_CONFIG,
        options: `-c search_path=${schemaName},public` // ISOLAMENTO DO SCHEMA
    });

    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_campaigns_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log(`   ✅ ${schemaName}: Tabela 'campanhas_promocionais' verificada/criada!`);

        await pool.end();
        return true;
    } catch (error) {
        console.log(`   ❌ ${schemaName}: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function main() {
    console.log('\n🎯  MIGRAÇÃO DE CAMPANHAS INDIVIDUAIS - TODOS OS SCHEMAS\n');
    console.log('='.repeat(60));

    const masterPool = new Pool(MASTER_CONFIG);

    try {
        // 1. Buscar lista de schemas ativos no banco mestre
        const result = await masterPool.query(`
            SELECT DISTINCT db_schema 
            FROM empresas 
            WHERE db_schema IS NOT NULL AND db_schema != ''
        `);

        const schemas = result.rows.map(r => r.db_schema);
        console.log(`📋 Schemas encontrados: ${schemas.join(', ')}\n`);

        let success = 0;
        let failed = 0;

        // 2. Iterar sobre cada schema e rodar a migração
        for (const schema of schemas) {
            const ok = await runMigrationForSchema(schema);
            if (ok) success++; else failed++;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`🚀 Concluído! ${success} sucesso, ${failed} falhas\n`);

        await masterPool.end();
    } catch (error) {
        console.error('❌ Erro CRÍTICO ao conectar no Master:', error.message);
        if (masterPool) await masterPool.end();
    }
}

main();
