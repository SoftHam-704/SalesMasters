/**
 * Script para padronizar os CNPJs no banco Master (remover duplicatas e formatar)
 */
const { Pool } = require('pg');

const CLOUD_CONFIG = {
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'process.env.DB_PASSWORD'
};

async function fixCNPJs() {
    const pool = new Pool(CLOUD_CONFIG);

    console.log('🔧 Corrigindo CNPJs no Master...\n');

    // 1. Listar todos os registros
    const all = await pool.query('SELECT id, cnpj, razao_social FROM empresas ORDER BY id');
    console.log('Registros atuais:');
    console.table(all.rows);

    // 2. Deletar registros com CNPJ mascarado (manter apenas os sem máscara)
    await pool.query(`DELETE FROM empresas WHERE cnpj LIKE '%.%'`);
    console.log('\n✅ Removidos registros com CNPJ mascarado');

    // 3. Atualizar a SoftHam para apontar para a nuvem
    await pool.query(`
        UPDATE empresas 
        SET db_host = 'node254557-salesmaster.sp1.br.saveincloud.net.br',
            db_porta = 13062,
            db_usuario = 'webadmin',
            db_senha = 'process.env.DB_PASSWORD'
        WHERE cnpj = '00000000000191'
    `);
    console.log('✅ SoftHam atualizada para usar a nuvem');

    // 4. Verificar resultado
    const result = await pool.query('SELECT id, cnpj, razao_social, db_host FROM empresas ORDER BY id');
    console.log('\n📊 Resultado final:');
    console.table(result.rows);

    await pool.end();
    console.log('\n🎉 Pronto!');
}

fixCNPJs().catch(console.error);

