// =====================================================
// 📅 Script para criar tabelas da Agenda no banco
// Execute: node run_agenda_migration.js
// =====================================================

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Usa as mesmas configurações do servidor (do .env)
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    ssl: false
});

async function runMigration() {
    console.log('\n📅 MIGRAÇÃO DA AGENDA PRO\n');
    console.log(`📡 Conectando em: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log('='.repeat(50));

    try {
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'create_agenda_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('1️⃣  Executando script SQL...\n');

        // Executar o SQL
        await pool.query(sql);

        console.log('✅ Tabelas criadas com sucesso!\n');

        // Verificar resultado
        const check = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM agenda) as total_tarefas,
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'agenda') as tabela_existe
        `);

        console.log('📊 Verificação:');
        console.log(`   - Tabela 'agenda': ${check.rows[0].tabela_existe > 0 ? '✅ Criada' : '❌ Não encontrada'}`);
        console.log(`   - Tarefas de exemplo: ${check.rows[0].total_tarefas}`);

        console.log('\n' + '='.repeat(50));
        console.log('🚀 Migração concluída! A Agenda Pro está pronta.\n');

        await pool.end();
    } catch (error) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
