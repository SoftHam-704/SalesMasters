/**
 * Script para verificar estrutura da tabela user_nomes
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkUserTable() {
    console.log('📡 Verificando estrutura da tabela user_nomes...\n');

    try {
        // Estrutura da tabela
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user_nomes' 
            ORDER BY ordinal_position
        `);
        console.log('📋 Colunas da tabela:');
        console.table(columns.rows);

        // Dados de exemplo
        const users = await pool.query('SELECT * FROM user_nomes LIMIT 5');
        console.log('\n👤 Usuários cadastrados:');
        console.table(users.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    await pool.end();
}

checkUserTable();
