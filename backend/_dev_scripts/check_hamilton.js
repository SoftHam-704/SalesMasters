/**
 * Script para verificar e criar usuário Hamilton no banco basesales da nuvem
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function checkAndCreateUser() {
    console.log('📡 Conectando no basesales na nuvem...');

    try {
        // 1. Verificar se Hamilton existe
        const existing = await pool.query(`
            SELECT codigo, nome, sobrenome, senha FROM user_nomes WHERE nome ILIKE 'Hamilton'
        `);

        if (existing.rows.length > 0) {
            console.log('✅ Hamilton encontrado:');
            console.table(existing.rows);
        } else {
            console.log('❌ Hamilton NÃO encontrado. Criando...');

            // Criar o usuário
            await pool.query(`
                INSERT INTO user_nomes (nome, sobrenome, senha, usuario, grupo, master, gerencia)
                VALUES ('Hamilton', 'Sistemas', 'hamilton123', 'hamilton', 'ADM', true, true)
            `);
            console.log('✅ Hamilton criado!');
        }

        // 2. Mostrar todos os usuários
        const allUsers = await pool.query('SELECT codigo, nome, sobrenome, senha FROM user_nomes ORDER BY codigo');
        console.log('\n📊 Todos os usuários:');
        console.table(allUsers.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    await pool.end();
}

checkAndCreateUser();
