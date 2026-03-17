// ===================================================
// 🔧 CRIAÇÃO DA TABELA EMPRESAS - SaveInCloud
// ===================================================
// Este script cria a tabela empresas necessária para o login multi-tenant

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'process.env.DB_PASSWORD',
    ssl: false
});

async function criarTabelaEmpresas() {
    console.log('\n🔧 CRIANDO TABELA EMPRESAS\n');
    console.log('='.repeat(60) + '\n');

    try {
        // 1. Criar tabela empresas
        console.log('1️⃣  Criando tabela empresas...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS empresas (
                id SERIAL PRIMARY KEY,
                cnpj VARCHAR(20) UNIQUE NOT NULL,
                razao_social VARCHAR(200) NOT NULL,
                nome_fantasia VARCHAR(200),
                status VARCHAR(20) DEFAULT 'ATIVO',
                db_host VARCHAR(200),
                db_nome VARCHAR(100),
                db_usuario VARCHAR(100),
                db_senha VARCHAR(200),
                db_porta INTEGER DEFAULT 5432,
                modulo_whatsapp_ativo BOOLEAN DEFAULT false,
                modulo_crmrep_ativo BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ Tabela criada com sucesso!\n');

        // 2. Inserir a empresa SoftHam (para testes e produção)
        console.log('2️⃣  Inserindo empresa SoftHam...');

        // Verificar se já existe
        const checkSoftham = await pool.query("SELECT id FROM empresas WHERE cnpj = '70325059000193'");

        if (checkSoftham.rows.length === 0) {
            await pool.query(`
                INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_usuario, db_senha, db_porta)
                VALUES (
                    '70325059000193',
                    'SOFTHAM SISTEMAS LTDA',
                    'SoftHam',
                    'ATIVO',
                    'node254557-salesmaster.sp1.br.saveincloud.net.br',
                    'basesales',
                    'webadmin',
                    'process.env.DB_PASSWORD',
                    13062
                )
            `);
            console.log('   ✅ Empresa SoftHam inserida!\n');
        } else {
            console.log('   ℹ️  Empresa SoftHam já existe.\n');
        }

        // 3. Inserir empresa de teste (CNPJ 00.000.000/0001-91)
        console.log('3️⃣  Inserindo empresa de TESTE...');

        const checkTeste = await pool.query("SELECT id FROM empresas WHERE cnpj = '00000000000191'");

        if (checkTeste.rows.length === 0) {
            await pool.query(`
                INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_usuario, db_senha, db_porta)
                VALUES (
                    '00000000000191',
                    'EMPRESA TESTE DESENVOLVIMENTO',
                    'Teste Local',
                    'ATIVO',
                    'localhost',
                    'basesales',
                    'postgres',
                    '@12Pilabo',
                    5432
                )
            `);
            console.log('   ✅ Empresa de teste inserida!\n');
        } else {
            console.log('   ℹ️  Empresa de teste já existe.\n');
        }

        // 4. Verificar resultado
        console.log('4️⃣  Verificando empresas cadastradas...\n');
        const empresas = await pool.query('SELECT id, cnpj, razao_social, status, db_host FROM empresas ORDER BY id');

        console.log('   🏢 Empresas no banco:');
        empresas.rows.forEach(emp => {
            console.log(`      [${emp.id}] ${emp.razao_social}`);
            console.log(`          CNPJ: ${emp.cnpj}`);
            console.log(`          Status: ${emp.status}`);
            console.log(`          DB Host: ${emp.db_host}\n`);
        });

        console.log('='.repeat(60));
        console.log('\n✅ TABELA EMPRESAS CRIADA E POPULADA COM SUCESSO!\n');
        console.log('Agora o login deve funcionar corretamente.\n');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

criarTabelaEmpresas();

