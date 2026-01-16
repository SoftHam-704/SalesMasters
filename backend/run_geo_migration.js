// Script para aplicar Geolocation em TODOS os Schemas
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MASTER_CONFIG = {
    host: process.env.MASTER_DB_HOST || '10.100.28.17',
    port: parseInt(process.env.MASTER_DB_PORT || '5432'),
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    ssl: false
};

const TENANT_CONFIG = {
    host: '10.100.28.17',
    port: 5432,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    ssl: false
};

async function runMigrationForSchema(schemaName) {
    const pool = new Pool({
        ...TENANT_CONFIG,
        options: `-c search_path=${schemaName},public`
    });

    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_geolocation_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log(`   ✅ ${schemaName}: Tabelas de Geolocalização aplicadas!`);

        await pool.end();
        return true;
    } catch (error) {
        console.log(`   ❌ ${schemaName}: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function main() {
    console.log('\n🌍  MIGRAÇÃO DE GEOLOCALIZAÇÃO - TODOS OS SCHEMAS\n');
    console.log('='.repeat(60));

    const masterPool = new Pool(MASTER_CONFIG);

    try {
        const result = await masterPool.query(`
            SELECT DISTINCT db_schema 
            FROM empresas 
            WHERE db_schema IS NOT NULL AND db_schema != ''
        `);

        const schemas = result.rows.map(r => r.db_schema);
        console.log(`📋 Schemas encontrados: ${schemas.join(', ')}\n`);

        for (const schema of schemas) {
            await runMigrationForSchema(schema);
        }

        console.log('\n' + '='.repeat(60));
        console.log(`🚀 Concluído!\n`);

        await masterPool.end();
    } catch (error) {
        console.error('❌ Erro conexão Master:', error.message);
        if (masterPool) await masterPool.end();
    }
}

main();
