
require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function diagnose() {
    console.log('🧪 Iniciando Diagnóstico de Login Master...');

    try {
        // 1. Teste de Conexão
        const time = await pool.query('SELECT NOW()');
        console.log('✅ Conexão com Banco Master: OK');

        // 2. Verificar Tabela Usuários
        const users = await pool.query('SELECT id, nome, email, empresa_id FROM usuarios LIMIT 1');
        console.log('✅ Tabela "usuarios": OK (Encontrado ' + users.rows.length + ' users)');

        // 3. Verificar Tabela Empresas
        const empresas = await pool.query('SELECT id, cnpj, razao_social FROM empresas LIMIT 1');
        console.log('✅ Tabela "empresas": OK');

        // 4. Verificar Tabela sessoes_ativas
        try {
            const sessoes = await pool.query('SELECT * FROM sessoes_ativas LIMIT 1');
            console.log('✅ Tabela "sessoes_ativas": OK');
        } catch (e) {
            console.log('❌ ERRO na tabela "sessoes_ativas":', e.message);
        }

        // 5. Verificar Extensão de UUID (Crucial para o login novo)
        try {
            const uuidFunc = await pool.query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'gen_random_uuid'");
            if (uuidFunc.rows.length > 0) {
                console.log('✅ Função gen_random_uuid: OK');
            } else {
                console.log('⚠️ Função gen_random_uuid não encontrada! Tentando habilitar pgcrypto...');
                await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
                console.log('✅ Extensão pgcrypto instalada.');
            }
        } catch (e) {
            console.log('❌ ERRO ao verificar UUID:', e.message);
        }

        console.log('\n🚀 Diagnóstico concluído.');
        process.exit(0);
    } catch (err) {
        console.error('\n💥 FALHA CRÍTICA NO DIAGNÓSTICO:', err.message);
        process.exit(1);
    }
}

diagnose();
