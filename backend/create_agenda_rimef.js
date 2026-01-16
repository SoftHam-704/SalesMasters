// Script para criar tabela agenda diretamente no schema do tenant (rimef)
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conectar diretamente ao banco que o .env aponta (basesales da SaveInCloud)
// usando o schema rimef
const tenantPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: '-c search_path=rimef,public'  // Schema do tenant
});

async function createAgendaInRimef() {
    console.log('\n📅 CRIANDO TABELA AGENDA NO SCHEMA RIMEF\n');
    console.log(`📡 Conectando em ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    try {
        // 1. Verificar conexão e schema
        const schemaCheck = await tenantPool.query('SELECT current_schema()');
        console.log(`✅ Conectado! Schema atual: ${schemaCheck.rows[0].current_schema}`);

        // 2. Verificar se tabela já existe no schema rimef
        const existCheck = await tenantPool.query(`
            SELECT COUNT(*) as existe 
            FROM information_schema.tables 
            WHERE table_schema = 'rimef' AND table_name = 'agenda'
        `);

        if (existCheck.rows[0].existe > 0) {
            console.log('⚠️  Tabela agenda já existe no schema rimef');
            const count = await tenantPool.query('SELECT COUNT(*) FROM agenda');
            console.log(`   Total de registros: ${count.rows[0].count}`);
        } else {
            // 3. Ler SQL de migração
            const sqlPath = path.join(__dirname, 'migrations', 'create_agenda_tables.sql');
            let sql = fs.readFileSync(sqlPath, 'utf8');

            console.log('\n⚙️  Executando migração no schema rimef...');
            await tenantPool.query(sql);

            // 4. Verificar
            const check = await tenantPool.query('SELECT COUNT(*) as total FROM agenda');
            console.log(`\n✅ Tabela agenda criada! Total de registros: ${check.rows[0].total}`);
        }

        await tenantPool.end();
        console.log('\n🚀 Concluído!\n');

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        await tenantPool.end().catch(() => { });
        process.exit(1);
    }
}

createAgendaInRimef();
