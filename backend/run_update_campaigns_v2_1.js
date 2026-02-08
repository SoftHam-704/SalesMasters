// Script para atualizar a tabela de Campanhas em TODOS os Schemas
// Adaptado para funcionar tanto internamente quanto externamente
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Tenta usar ENV ou fallback para o host externo conhecido
const MASTER_CONFIG = {
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: parseInt(process.env.MASTER_DB_PORT || '13062'),
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    ssl: false,
    connectionTimeoutMillis: 10000
};

// Configuração dos Tenants (mesmo host do master neste caso)
const TENANT_CONFIG = {
    host: process.env.DB_HOST || MASTER_CONFIG.host,
    port: parseInt(process.env.DB_PORT || (MASTER_CONFIG.host.includes('node') ? '13062' : '5432')),
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false,
    connectionTimeoutMillis: 10000
};

async function runUpdateForSchema(schemaName) {
    const pool = new Pool({
        ...TENANT_CONFIG,
        options: `-c search_path=${schemaName},public`
    });

    try {
        const sqlPath = path.join(__dirname, 'migrations', 'update_campaigns_v2_1.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log(`   ✅ ${schemaName}: Campos adicionados com sucesso!`);

        await pool.end();
        return true;
    } catch (error) {
        console.log(`   ❌ ${schemaName}: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function main() {
    console.log('\n🎯  ATUALIZAÇÃO DE CAMPANHAS V2.1 - TODOS OS SCHEMAS\n');
    console.log('='.repeat(60));
    console.log(`📡 Conectando ao Master em: ${MASTER_CONFIG.host}:${MASTER_CONFIG.port}`);

    const masterPool = new Pool(MASTER_CONFIG);

    try {
        const result = await masterPool.query(`
            SELECT DISTINCT db_schema 
            FROM empresas 
            WHERE db_schema IS NOT NULL AND db_schema != ''
        `);

        const schemas = result.rows.map(r => r.db_schema);
        console.log(`📋 Schemas encontrados: ${schemas.length}\n`);

        let success = 0;
        let failed = 0;

        for (const schema of schemas) {
            const ok = await runUpdateForSchema(schema);
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
