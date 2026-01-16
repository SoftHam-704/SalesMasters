
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    ssl: false
});

async function fixMasterRecord() {
    const MASTER_CNPJ = '17504829000124';
    console.log(`\n🔧 AJUSTANDO CADASTRO MASTER - CNPJ: ${MASTER_CNPJ}\n`);

    try {
        // 1. Verificar se existe
        const res = await pool.query("SELECT id FROM empresas WHERE cnpj = $1", [MASTER_CNPJ]);

        if (res.rows.length === 0) {
            console.log('1️⃣  Inserindo registro Master faltante...');
            await pool.query(`
                INSERT INTO empresas (
                    cnpj, razao_social, nome_fantasia, status, 
                    db_host, db_nome, db_usuario, db_senha, db_porta,
                    limite_sessoes, limite_usuarios, bloqueio_ativo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                MASTER_CNPJ,
                'SOFTHAM SISTEMAS LTDA',
                'SoftHam Master',
                'ATIVO',
                process.env.DB_HOST,
                process.env.DB_NAME,
                process.env.DB_USER,
                process.env.DB_PASSWORD,
                process.env.DB_PORT,
                999,
                999,
                'N'
            ]);
            console.log('   ✅ Registro inserido com sucesso!');
        } else {
            console.log('1️⃣  Atualizando registro Master existente...');
            await pool.query(`
                UPDATE empresas SET
                    razao_social = $1,
                    status = 'ATIVO',
                    db_host = $2,
                    db_nome = $3,
                    db_usuario = $4,
                    db_senha = $5,
                    db_porta = $6,
                    limite_sessoes = 999,
                    limite_usuarios = 999,
                    bloqueio_ativo = 'N'
                WHERE cnpj = $7
            `, [
                'SOFTHAM SISTEMAS LTDA',
                process.env.DB_HOST,
                process.env.DB_NAME,
                process.env.DB_USER,
                process.env.DB_PASSWORD,
                process.env.DB_PORT,
                MASTER_CNPJ
            ]);
            console.log('   ✅ Registro atualizado com sucesso!');
        }

        console.log('\n🚀 Verificação concluída.');
        await pool.end();
    } catch (err) {
        console.error('\n❌ ERRO:', err.message);
        await pool.end();
    }
}

fixMasterRecord();
