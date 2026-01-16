// Script para criar tabelas do Chat no schema PUBLIC
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conectar ao banco TENANT (usando .env com fallbacks)
const pool = new Pool({
    host: process.env.DB_HOST || '10.100.28.17',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'webadmin',
    password: process.env.DB_PASSWORD || 'ytAyO0u043',
    ssl: false
});

async function runMigration() {
    console.log('\n💬 MIGRAÇÃO DO CHAT PRO\n');
    console.log(`📡 Conectando em: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log('='.repeat(50));

    try {
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'create_chat_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('1️⃣  Executando script SQL...\n');

        // Executar o SQL
        await pool.query(sql);

        console.log('✅ Tabelas do Chat criadas com sucesso!\n');

        // Verificar resultado
        const check = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM chat_conversas) as total_conversas,
                (SELECT COUNT(*) FROM chat_mensagens) as total_mensagens
        `);

        console.log('📊 Verificação:');
        console.log(`   - Conversas criadas: ${check.rows[0].total_conversas}`);
        console.log(`   - Mensagens: ${check.rows[0].total_mensagens}`);

        console.log('\n' + '='.repeat(50));
        console.log('🚀 Chat Pro está pronto para uso!\n');

        await pool.end();
    } catch (error) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
