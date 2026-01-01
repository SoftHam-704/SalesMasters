// Script para criar a tabela EMPRESA_STATUS e inserir os dados iniciais
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createTable() {
    const client = await pool.connect();

    try {
        console.log('🔄 Criando tabela EMPRESA_STATUS...');

        // Criar tabela
        await client.query(`
            CREATE TABLE IF NOT EXISTS empresa_status (
                emp_id SERIAL PRIMARY KEY,
                emp_situacao CHAR(1) DEFAULT 'A' CHECK (emp_situacao IN ('A', 'B')),
                emp_nome VARCHAR(100),
                emp_endereco VARCHAR(200),
                emp_bairro VARCHAR(100),
                emp_cidade VARCHAR(100),
                emp_uf CHAR(2),
                emp_cep VARCHAR(15),
                emp_cnpj VARCHAR(20),
                emp_inscricao VARCHAR(30),
                emp_fones VARCHAR(50),
                emp_logotipo VARCHAR(500),
                emp_basedadoslocal VARCHAR(500),
                emp_host VARCHAR(100),
                emp_porta INTEGER,
                emp_username VARCHAR(50),
                emp_password VARCHAR(100),
                emp_pastabasica VARCHAR(500),
                emp_datacriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                emp_dataatualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tabela criada com sucesso!');

        // Verificar se já existe registro
        const checkResult = await client.query('SELECT COUNT(*) FROM empresa_status');

        if (parseInt(checkResult.rows[0].count) === 0) {
            console.log('🔄 Inserindo dados iniciais...');

            // Inserir dados padrão
            await client.query(`
                INSERT INTO empresa_status (
                    emp_situacao, emp_nome, emp_endereco, emp_bairro, emp_cidade,
                    emp_uf, emp_cep, emp_cnpj, emp_inscricao, emp_fones,
                    emp_logotipo, emp_basedadoslocal, emp_host, emp_porta,
                    emp_username, emp_password, emp_pastabasica
                ) VALUES (
                    'A',
                    'SOFTHAM SISTEMAS - LOCAL',
                    'R. SANTIAGO PERES UBINHA, 150',
                    'JARDIM DOM NERY',
                    'CAMPINAS',
                    'SP',
                    '13.031-730',
                    '17.504.829/0001-24',
                    '',
                    '(19) 3203-8600',
                    'C:\\SalesMasters\\Imagens\\Softham1.png',
                    'C:\\SalesMasters\\Dados50\\Nova\\BASESALES.FDB',
                    'localhost',
                    3070,
                    'SYSDBA',
                    '',
                    'C:\\SalesMasters\\'
                )
            `);

            console.log('✅ Dados inseridos com sucesso!');
        } else {
            console.log('ℹ️ Tabela já possui dados. Nenhuma inserção necessária.');
        }

        // Mostrar dados
        const result = await client.query('SELECT * FROM empresa_status');
        console.log('\n📋 Dados da tabela EMPRESA_STATUS:');
        console.log(result.rows[0]);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
