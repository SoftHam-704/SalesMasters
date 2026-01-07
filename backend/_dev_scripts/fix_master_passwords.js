const { Pool } = require('pg');

const poolMaster = new Pool({
    user: 'postgres', host: 'localhost', database: 'salesmasters_master', password: '@12Pilabo', port: 5432,
});

async function fixPasswords() {
    try {
        console.log('🔨 Corrigindo senhas no Banco Master...');

        // SoftHam
        await poolMaster.query(`
            UPDATE empresas 
            SET db_senha = '@12Pilabo', db_usuario = 'postgres', db_host = 'localhost', db_nome = 'basesales'
            WHERE cnpj LIKE '%00000000000191%' OR cnpj LIKE '%00.000.000/0001-91%';
        `);

        // Target 
        await poolMaster.query(`
            UPDATE empresas 
            SET db_senha = '@12Pilabo', db_usuario = 'postgres', db_host = 'node254557-salesmaster.sp1.br.saveincloud.net.br', db_nome = 'basesales'
            WHERE cnpj LIKE '%33866124000103%' OR cnpj LIKE '%33.866.124/0001-03%';
        `);

        console.log('✅ Senhas e conexões corrigidas no Master!');
        await poolMaster.end();
    } catch (err) {
        console.error('❌ Erro ao corrigir:', err.message);
    }
}

fixPasswords();
