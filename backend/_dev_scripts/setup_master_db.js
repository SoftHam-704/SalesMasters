const { Pool } = require('pg');
require('dotenv').config();

// Configuração para o banco postgres (padrão) para poder criar o novo banco
const poolDefault = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: process.env.DB_PORT || 5432,
});

async function createMasterDB() {
    try {
        console.log('--- CRIANDO BANCO MASTER ---');

        // 1. Criar o Banco de Dados
        try {
            await poolDefault.query('CREATE DATABASE salesmasters_master');
            console.log('✅ Banco salesmasters_master criado com sucesso!');
        } catch (err) {
            if (err.code === '42P04') {
                console.log('ℹ️ Banco salesmasters_master já existe.');
            } else {
                throw err;
            }
        }
        await poolDefault.end();

        // 2. Conectar ao novo banco para criar as tabelas
        const poolMaster = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: 'salesmasters_master',
            password: process.env.DB_PASSWORD || '@12Pilabo',
            port: process.env.DB_PORT || 5432,
        });

        console.log('--- EXECUTANDO SCHEMA ---');
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '..', '..', 'scripts_bancodedados', '08_master_auth_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Usamos IF NOT EXISTS no script manualmente ou aqui apenas ignoramos se a tabela empresas já existe
        try {
            await poolMaster.query(schemaSql);
            console.log('✅ Tabelas criadas com sucesso!');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('ℹ️ Tabelas já existem.');
            } else {
                console.error('Erro no schema:', err.message);
            }
        }

        // 3. Inserir a primeira empresa e usuário para teste
        console.log('--- INSERINDO DADOS INICIAIS ---');

        // Empresa SoftHam (Exemplo)
        const insEmpresa = `
            INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_nome, db_host, data_vencimento)
            VALUES ('00.000.000/0001-91', 'SOFTHAM SISTEMAS LTDA', 'SalesMasters Cloud', 'ATIVO', 'basesales', 'localhost', '2030-12-31')
            ON CONFLICT (cnpj) DO UPDATE SET razao_social = EXCLUDED.razao_social
            RETURNING id;
        `;

        const resEmp = await poolMaster.query(insEmpresa);
        const empresaId = resEmp.rows[0].id;

        // Usuário Master
        const insUsuario = `
            INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin)
            VALUES ($1, 'Admin', 'SalesMasters', 'admin@softham.com.br', '123456', TRUE)
            ON CONFLICT (email) DO NOTHING;
        `;
        await poolMaster.query(insUsuario, [empresaId]);
        console.log('✅ Empresa e Usuário Master criados!');
        console.log('👉 Login: admin@softham.com.br');
        console.log('👉 Senha: 123456');

        await poolMaster.end();

    } catch (err) {
        console.error('❌ ERRO NO PROCESSO:', err.message);
    }
}

createMasterDB();
