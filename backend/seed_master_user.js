
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

async function seedMasterUser() {
    console.log('\n👤 SEEDING MASTER USER\n');

    try {
        const MASTER_CNPJ = '17504829000124';

        // 1. Pegar ID da SoftHam
        const empRes = await pool.query("SELECT id FROM empresas WHERE cnpj = $1", [MASTER_CNPJ]);
        if (empRes.rows.length === 0) {
            console.error('❌ SoftHam não encontrada na tabela empresas. Execute fix_master_record.js primeiro.');
            return;
        }
        const empresaId = empRes.rows[0].id;

        // 2. Criar tabela usuarios se não existir (garantindo estrutura)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
                nome VARCHAR(100),
                sobrenome VARCHAR(100),
                email VARCHAR(150),
                senha VARCHAR(200),
                e_admin BOOLEAN DEFAULT false,
                ativo BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(email, empresa_id)
            )
        `);

        // 3. Inserir Hamilton
        const userEmail = 'hamilton@softham.com.br';
        const checkUser = await pool.query("SELECT id FROM usuarios WHERE email = $1 AND empresa_id = $2", [userEmail, empresaId]);

        if (checkUser.rows.length === 0) {
            await pool.query(`
                INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [empresaId, 'Hamilton', 'Silva', userEmail, '@12Pilabo', true]);
            console.log(`   ✅ Usuário ${userEmail} inserido no Master DB.`);
        } else {
            console.log(`   ℹ️  Usuário ${userEmail} já existe no Master DB.`);
        }

        console.log('\n🚀 Done.');
        await pool.end();
    } catch (err) {
        console.error('\n❌ ERRO:', err.message);
        await pool.end();
    }
}

seedMasterUser();
