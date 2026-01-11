/**
 * Script para migrar o Banco Master para a Nuvem SaveInCloud
 * 
 * Este script:
 * 1. Conecta no servidor PostgreSQL da SaveInCloud
 * 2. Cria o banco salesmasters_master (se não existir)
 * 3. Cria as tabelas necessárias
 * 4. Migra os dados do Master local para a nuvem
 */

const { Pool } = require('pg');

// Configurações da Nuvem SaveInCloud
const CLOUD_CONFIG = {
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    user: 'webadmin',
    password: 'process.env.DB_PASSWORD',
    // Primeiro conectamos no banco postgres para criar o master
    database: 'postgres'
};

// Configurações do Master Local (para migrar dados)
const LOCAL_MASTER_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'salesmasters_master',
    user: 'postgres',
    password: '@12Pilabo'
};

async function migrateMasterToCloud() {
    console.log('🚀 Iniciando migração do Master para a Nuvem...\n');

    // 1. Conectar na nuvem (banco postgres)
    console.log('📡 Conectando na SaveInCloud...');
    const cloudPool = new Pool(CLOUD_CONFIG);

    try {
        await cloudPool.query('SELECT 1');
        console.log('✅ Conexão com SaveInCloud estabelecida!\n');
    } catch (error) {
        console.error('❌ Falha ao conectar na SaveInCloud:', error.message);
        process.exit(1);
    }

    // 2. Verificar se o banco master já existe
    console.log('🔍 Verificando se o banco salesmasters_master existe...');
    const checkDb = await cloudPool.query(
        "SELECT 1 FROM pg_database WHERE datname = 'salesmasters_master'"
    );

    if (checkDb.rows.length === 0) {
        console.log('📦 Criando banco salesmasters_master na nuvem...');
        await cloudPool.query('CREATE DATABASE salesmasters_master');
        console.log('✅ Banco criado!\n');
    } else {
        console.log('✅ Banco já existe!\n');
    }

    await cloudPool.end();

    // 3. Conectar no novo banco Master na nuvem
    console.log('📡 Conectando no Master na nuvem...');
    const masterCloudPool = new Pool({
        ...CLOUD_CONFIG,
        database: 'salesmasters_master'
    });

    // 4. Criar as tabelas
    console.log('🏗️ Criando tabelas...');

    const createTablesSQL = `
        -- Tabela de Empresas (Clientes/Tenants)
        CREATE TABLE IF NOT EXISTS empresas (
            id SERIAL PRIMARY KEY,
            cnpj VARCHAR(18) UNIQUE NOT NULL,
            razao_social VARCHAR(200) NOT NULL,
            nome_fantasia VARCHAR(200),
            email_contato VARCHAR(150),
            telefone VARCHAR(20),
            status VARCHAR(20) DEFAULT 'ATIVO',
            data_adesao TIMESTAMP DEFAULT NOW(),
            data_vencimento DATE,
            valor_mensalidade DECIMAL(10,2),
            limite_usuarios INTEGER DEFAULT 1,
            db_host VARCHAR(255),
            db_nome VARCHAR(100),
            db_usuario VARCHAR(100),
            db_senha VARCHAR(255),
            db_porta INTEGER DEFAULT 5432,
            versao_liberada VARCHAR(20) DEFAULT '1.0.0',
            obs TEXT
        );

        -- Tabela de Usuários Master (Admin)
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
            nome VARCHAR(100) NOT NULL,
            sobrenome VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            celular VARCHAR(20),
            e_admin BOOLEAN DEFAULT FALSE,
            ativo BOOLEAN DEFAULT TRUE,
            ultimo_login TIMESTAMP,
            data_criacao TIMESTAMP DEFAULT NOW()
        );

        -- Tabela de Mensalidades/Pagamentos
        CREATE TABLE IF NOT EXISTS mensalidades (
            id SERIAL PRIMARY KEY,
            empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
            valor_pago DECIMAL(10,2),
            data_referencia DATE NOT NULL,
            data_vencimento DATE NOT NULL,
            data_pagamento TIMESTAMP,
            status VARCHAR(20) DEFAULT 'PENDENTE',
            metodo_pagamento VARCHAR(50),
            comprovante_url TEXT
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
        CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
        CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    `;

    await masterCloudPool.query(createTablesSQL);
    console.log('✅ Tabelas criadas!\n');

    // 5. Migrar dados do Master local
    console.log('📥 Buscando dados do Master local...');

    let localData = [];
    try {
        const localPool = new Pool(LOCAL_MASTER_CONFIG);
        const result = await localPool.query('SELECT * FROM empresas ORDER BY id');
        localData = result.rows;
        await localPool.end();
        console.log(`✅ Encontradas ${localData.length} empresas no Master local\n`);
    } catch (error) {
        console.log('⚠️ Master local não encontrado ou vazio. Inserindo dados iniciais...\n');
    }

    // 6. Inserir/Atualizar dados na nuvem
    console.log('📤 Migrando dados para a nuvem...');

    // Dados padrão (SoftHam) caso não exista local
    if (localData.length === 0) {
        localData = [{
            cnpj: '00000000000191',
            razao_social: 'SOFTHAM SISTEMAS LTDA',
            nome_fantasia: 'SalesMasters Cloud',
            status: 'ATIVO',
            db_host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
            db_nome: 'basesales',
            db_usuario: 'webadmin',
            db_senha: 'process.env.DB_PASSWORD',
            db_porta: 13062,
            data_vencimento: '2030-12-31'
        }];
    }

    for (const empresa of localData) {
        const insertSQL = `
            INSERT INTO empresas (
                cnpj, razao_social, nome_fantasia, email_contato, telefone,
                status, data_vencimento, valor_mensalidade, limite_usuarios,
                db_host, db_nome, db_usuario, db_senha, db_porta
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (cnpj) DO UPDATE SET
                razao_social = EXCLUDED.razao_social,
                nome_fantasia = EXCLUDED.nome_fantasia,
                status = EXCLUDED.status,
                db_host = EXCLUDED.db_host,
                db_nome = EXCLUDED.db_nome,
                db_usuario = EXCLUDED.db_usuario,
                db_senha = EXCLUDED.db_senha,
                db_porta = EXCLUDED.db_porta
        `;

        await masterCloudPool.query(insertSQL, [
            empresa.cnpj,
            empresa.razao_social,
            empresa.nome_fantasia || null,
            empresa.email_contato || null,
            empresa.telefone || null,
            empresa.status || 'ATIVO',
            empresa.data_vencimento || null,
            empresa.valor_mensalidade || null,
            empresa.limite_usuarios || 1,
            empresa.db_host || 'localhost',
            empresa.db_nome || 'basesales',
            empresa.db_usuario || 'postgres',
            empresa.db_senha || '',
            empresa.db_porta || 5432
        ]);

        console.log(`  ✅ ${empresa.razao_social}`);
    }

    // 7. Verificar dados migrados
    console.log('\n📊 Verificando dados migrados...');
    const verification = await masterCloudPool.query('SELECT cnpj, razao_social, status, db_host FROM empresas');
    console.table(verification.rows);

    await masterCloudPool.end();

    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 Próximo passo: Atualize o arquivo .env do backend com:');
    console.log('   MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br');
    console.log('   MASTER_DB_PORT=13062');
    console.log('   MASTER_DB_USER=webadmin');
    console.log('   MASTER_DB_PASSWORD=process.env.DB_PASSWORD');
}

migrateMasterToCloud().catch(console.error);

