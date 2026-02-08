// Script para criar tabelas de Itinerários em TODOS os Schemas
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MASTER_CONFIG = {
    host: process.env.MASTER_DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || '5432'),
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || '@12Pilabo',
    ssl: false
};

const TENANT_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    ssl: false
};

async function runMigrationForSchema(schemaName) {
    const pool = new Pool({
        ...TENANT_CONFIG,
        options: `-c search_path=${schemaName},public`
    });

    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_itineraries_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        // Também garante campanhas e setores no schema
        const sqlCamp = fs.readFileSync(path.join(__dirname, 'migrations', 'create_campaigns_table.sql'), 'utf8');
        await pool.query(sqlCamp);
        const sqlSet = fs.readFileSync(path.join(__dirname, 'migrations', 'create_setores_table.sql'), 'utf8');
        await pool.query(sqlSet);

        console.log(`   ✅ ${schemaName}: Tabelas criadas!`);

        await pool.end();
        return true;
    } catch (error) {
        console.log(`   ❌ ${schemaName}: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function main() {
    console.log('\n🗺️  MIGRAÇÃO DE ITINERÁRIOS - TODOS OS SCHEMAS\n');
    console.log('='.repeat(50));

    const masterPool = new Pool(MASTER_CONFIG);

    try {
        const result = await masterPool.query(`
            SELECT DISTINCT db_schema FROM empresas WHERE db_schema IS NOT NULL AND db_schema != ''
        `);

        const schemas = result.rows.map(r => r.db_schema);
        console.log(`📋 Schemas encontrados: ${schemas.join(', ')}\n`);

        // Adiciona 'public' do Master DB para garantir fallback funcional
        console.log(`📡 Criando tabelas no PUBLIC do Master DB para fallback...`);
        const masterMigrationPool = new Pool(MASTER_CONFIG);
        try {
            const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_itineraries_table.sql'), 'utf8');
            await masterMigrationPool.query(sql);
            const sqlCamp = fs.readFileSync(path.join(__dirname, 'migrations', 'create_campaigns_table.sql'), 'utf8');
            await masterMigrationPool.query(sqlCamp);
            const sqlSet = fs.readFileSync(path.join(__dirname, 'migrations', 'create_setores_table.sql'), 'utf8');
            await masterMigrationPool.query(sqlSet);
            console.log(`   ✅ Master DB (public): Tabelas criadas!`);
        } catch (e) {
            console.log(`   ⚠️ Master DB: ${e.message}`);
        } finally {
            await masterMigrationPool.end();
        }

        let success = 0;
        let failed = 0;

        for (const schema of schemas) {
            const ok = await runMigrationForSchema(schema);
            if (ok) success++; else failed++;
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🚀 Concluído! ${success} sucesso, ${failed} erros\n`);

        await masterPool.end();
    } catch (error) {
        console.error('❌ Erro ao buscar schemas:', error.message);
        await masterPool.end();
    }
}

main();
