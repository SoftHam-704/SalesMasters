require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: parseInt(process.env.MASTER_DB_PORT || '13062'),
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    ssl: false
});

async function migrateEmpresas() {
    console.log('\n🚀 INICIANDO MIGRAÇÃO DA TABELA EMPRESAS\n');

    try {
        // 1. Adicionar colunas se não existirem
        console.log('1️⃣  Adicionando colunas de controle...');

        const alterQueries = [
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_sessoes INTEGER DEFAULT 3`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS limite_usuarios INTEGER DEFAULT 5`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS bloqueio_ativo CHAR(1) DEFAULT 'N'`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email_contato VARCHAR(150)`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefone VARCHAR(50)`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS data_vencimento DATE`,
            `ALTER TABLE empresas ADD COLUMN IF NOT EXISTS valor_mensalidade DECIMAL(10,2) DEFAULT 0`
        ];

        for (const q of alterQueries) {
            await pool.query(q).catch(err => console.log(`   🔸 Ignorando: ${err.message}`));
        }
        console.log('   ✅ Colunas verificadas/adicionadas.');

        // 2. Criar tabela de sessões se não existir
        console.log('2️⃣  Criando tabela de sessões ativas...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessoes_ativas (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
                usuario_id INTEGER,
                token_sessao UUID DEFAULT gen_random_uuid(),
                ip VARCHAR(50),
                user_agent TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN DEFAULT true
            )
        `);
        console.log('   ✅ Tabela sessoes_ativas pronta.');

        // 3. Criar tabela de log de tentativas
        console.log('3️⃣  Criando tabela de logs de bloqueio...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS log_tentativas_excedentes (
                id SERIAL PRIMARY KEY,
                empresa_id INTEGER REFERENCES empresas(id),
                data_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip VARCHAR(50),
                motivo TEXT
            )
        `);
        console.log('   ✅ Tabela log_tentativas_excedentes pronta.');

        console.log('\n✨ Migração concluída com sucesso!');
        await pool.end();
    } catch (err) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', err.message);
        await pool.end();
    }
}

migrateEmpresas();
