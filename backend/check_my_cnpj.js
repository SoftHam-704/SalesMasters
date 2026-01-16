// Verificar configuração do CNPJ 17504829000124 no banco master
require('dotenv').config();
const { Pool } = require('pg');

const CNPJ = '17504829000124';

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function checkMyCnpj() {
    console.log(`\n🔍 BUSCANDO CONFIGURAÇÃO PARA CNPJ: ${CNPJ}\n`);

    try {
        const result = await masterPool.query(`
            SELECT * FROM empresas WHERE cnpj = $1
        `, [CNPJ]);

        if (result.rows.length > 0) {
            const empresa = result.rows[0];
            console.log('✅ Empresa encontrada:');
            console.log(`   Nome: ${empresa.nome_fantasia}`);
            console.log(`   Schema: ${empresa.db_schema}`);
            console.log(`   Host: ${empresa.db_host}`);
            console.log(`   Database: ${empresa.db_nome}`);
            console.log(`   User: ${empresa.db_usuario}`);
            console.log(`   Porta: ${empresa.db_porta}`);
        } else {
            console.log('❌ CNPJ não encontrado na tabela empresas!');

            // Mostrar todos os CNPJs cadastrados
            const all = await masterPool.query('SELECT cnpj, nome_fantasia, db_schema FROM empresas');
            console.log('\n📋 CNPJs cadastrados:');
            all.rows.forEach(r => console.log(`   ${r.cnpj} - ${r.nome_fantasia} (${r.db_schema})`));
        }

        await masterPool.end();
    } catch (error) {
        console.error('❌ ERRO:', error.message);
        await masterPool.end().catch(() => { });
    }
}

checkMyCnpj();
