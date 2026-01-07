const { Pool } = require('pg');
require('dotenv').config();

// Configuração para banco padrão postgres para criar o novo banco
const poolDefault = new Pool({
    user: 'postgres', host: 'localhost', database: 'postgres', password: '@12Pilabo', port: 5432,
});

async function setupHamiltonAccess() {
    try {
        console.log('🔧 Iniciando configuração completa para Hamilton...');

        // 1. Criar o Banco Master se não existir
        try {
            await poolDefault.query('CREATE DATABASE salesmasters_master');
            console.log('✅ Banco salesmasters_master criado.');
        } catch (e) {
            if (e.code === '42P04') console.log('ℹ️ Banco salesmasters_master já existe.');
            else throw e;
        }
        await poolDefault.end();

        // 2. Conectar ao Master para criar tabelas e empresa
        const masterPool = new Pool({
            user: 'postgres', host: 'localhost', database: 'salesmasters_master', password: '@12Pilabo', port: 5432,
        });

        // Garantir tabelas (Schema simplificado para garantir funcionamento)
        console.log('--- Garantindo SCHEMA no Master ---');
        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS empresas (
                id SERIAL PRIMARY KEY,
                cnpj VARCHAR(18) UNIQUE NOT NULL,
                razao_social VARCHAR(200) NOT NULL,
                nome_fantasia VARCHAR(200),
                status VARCHAR(20) DEFAULT 'ATIVO',
                db_host VARCHAR(255),
                db_nome VARCHAR(100),
                db_usuario VARCHAR(100),
                db_senha VARCHAR(255),
                db_porta INTEGER DEFAULT 5432,
                data_vencimento DATE
            );
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER REFERENCES empresas(id),
                nome VARCHAR(100),
                sobrenome VARCHAR(100),
                email VARCHAR(150) UNIQUE,
                senha VARCHAR(255),
                e_admin BOOLEAN DEFAULT TRUE,
                ativo BOOLEAN DEFAULT TRUE
            );
        `);

        const cnpjSoftHam = '00000000000191';
        await masterPool.query(`
            INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_nome, db_host, db_usuario, db_senha, db_porta, data_vencimento)
            VALUES ($1, 'SOFTHAM SISTEMAS', 'Hamilton Master', 'ATIVO', 'basesales', 'localhost', 'postgres', '@12Pilabo', 5432, '2099-12-31')
            ON CONFLICT (cnpj) DO UPDATE SET status = 'ATIVO', db_nome = 'basesales';
        `, [cnpjSoftHam]);
        console.log('✅ Empresa SoftHam configurada no Master.');

        // 3. Garantir que Hamilton existe no banco local (Tenant)
        const tenantPool = new Pool({
            user: 'postgres', host: 'localhost', database: 'basesales', password: '@12Pilabo', port: 5432,
        });

        const checkUser = await tenantPool.query("SELECT * FROM user_nomes WHERE nome ILIKE 'Hamilton'");

        if (checkUser.rows.length === 0) {
            await tenantPool.query(`
                INSERT INTO user_nomes (nome, sobrenome, senha, usuario, grupo, master, gerencia)
                VALUES ('Hamilton', 'Sistemas', 'hamilton123', 'hamilton', 'ADM', TRUE, TRUE)
            `);
            console.log('✅ Usuário Hamilton criado no banco basesales.');
        } else {
            await tenantPool.query(`
                UPDATE user_nomes SET master = TRUE, gerencia = TRUE, senha = 'hamilton123', grupo = 'ADM'
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
        console.error('❌ Erro Fatal:', err.message);
    }
}

setupHamiltonAccess();
