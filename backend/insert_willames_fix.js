const { Pool } = require('pg');

async function insertUser() {
    const config = {
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
    };
    const pool = new Pool(config);
    try {
        console.log('📝 Inserindo usuário Willames com codigo 10...');
        await pool.query(
            `INSERT INTO repwill.user_nomes (codigo, nome, sobrenome, usuario, senha, grupo, master, gerencia) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [10, 'Willames', 'Ferreira', 'willames', 'will123', '0001', true, true]
        );
        console.log('✅ Usuário Willames criado com sucesso!');
    } catch (e) {
        console.error('❌ Erro:', e.message);
    } finally {
        await pool.end();
    }
}
insertUser();
