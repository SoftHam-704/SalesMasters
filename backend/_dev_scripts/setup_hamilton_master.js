const { Pool } = require('pg');
require('dotenv').config();

const masterPool = new Pool({
    user: 'postgres', host: 'localhost', database: 'salesmasters_master', password: '@12Pilabo', port: 5432,
});

const tenantPool = new Pool({
    user: 'postgres', host: 'localhost', database: 'basesales', password: '@12Pilabo', port: 5432,
});

async function setupHamiltonAccess() {
    try {
        console.log('🔧 Configurando acesso Master para Hamilton...');

        // 1. Garantir que a SoftHam existe no Master
        const cnpjSoftHam = '00000000000191';
        await masterPool.query(`
            INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_nome, db_host, db_usuario, db_senha, db_porta, data_vencimento)
            VALUES ($1, 'SOFTHAM SISTEMAS', 'Hamilton Master', 'ATIVO', 'basesales', 'localhost', 'postgres', '@12Pilabo', 5432, '2099-12-31')
            ON CONFLICT (cnpj) DO UPDATE SET status = 'ATIVO';
        `, [cnpjSoftHam]);
        console.log('✅ Empresa SoftHam configurada no Master.');

        // 2. Garantir que Hamilton existe no banco local (Tenant)
        // Verificando se já existe
        const checkUser = await tenantPool.query("SELECT * FROM user_nomes WHERE nome ILIKE 'Hamilton'");

        if (checkUser.rows.length === 0) {
            // Criar se não existir
            await tenantPool.query(`
                INSERT INTO user_nomes (nome, sobrenome, senha, usuario, grupo, master, gerencia, ativo)
                VALUES ('Hamilton', 'Sistemas', 'hamilton123', 'hamilton', 'ADMIN', TRUE, TRUE, TRUE)
            `);
            console.log('✅ Usuário Hamilton criado no banco basesales.');
        } else {
            // Atualizar para garantir que é Master
            await tenantPool.query(`
                UPDATE user_nomes SET master = TRUE, gerencia = TRUE, ativo = TRUE, senha = 'hamilton123'
                WHERE nome ILIKE 'Hamilton'
            `);
            console.log('✅ Usuário Hamilton atualizado (Master = TRUE) no banco basesales.');
        }

        console.log('\n--- SEU ACESSO MASTER ESTÁ PRONTO ---');
        console.log('🏢 CNPJ Empresa: 00.000.000/0001-91');
        console.log('👤 Nome: Hamilton');
        console.log('👤 Sobrenome: Sistemas');
        console.log('🔑 Senha: hamilton123');
        console.log('---------------------------------------');

        await masterPool.end();
        await tenantPool.end();
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

setupHamiltonAccess();
