const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function addPrimaryKey() {
    try {
        console.log('🔧 Adicionando chave primária composta na tabela cidades_regioes...');

        // Primeiro, remover duplicatas se existirem
        console.log('🗑️  Removendo possíveis duplicatas...');
        await pool.query(`
            DELETE FROM cidades_regioes a USING cidades_regioes b
            WHERE a.ctid < b.ctid 
            AND a.reg_id = b.reg_id 
            AND a.cid_id = b.cid_id
        `);

        // Adicionar a chave primária
        console.log('🔑 Adicionando PRIMARY KEY (reg_id, cid_id)...');
        await pool.query(`
            ALTER TABLE cidades_regioes 
            ADD CONSTRAINT cidades_regioes_pkey 
            PRIMARY KEY (reg_id, cid_id)
        `);

        console.log('✅ Chave primária adicionada com sucesso!');

    } catch (error) {
        if (error.code === '42P16') {
            console.log('⚠️  Chave primária já existe!');
        } else {
            console.error('❌ Erro:', error.message);
        }
    } finally {
        await pool.end();
    }
}

addPrimaryKey();
