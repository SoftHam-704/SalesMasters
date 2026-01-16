require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function fixGruposAutoIncrement() {
    console.log('\n🔧 CORRIGINDO AUTO-INCREMENTO EM rimef.grupos...\n');

    try {
        // 1. Check max id
        const maxRes = await pool.query('SELECT MAX(gru_codigo) as max_id FROM rimef.grupos');
        const maxId = maxRes.rows[0].max_id || 0;
        console.log(`📈 Maior ID atual: ${maxId}`);
        const nextId = parseInt(maxId) + 1;

        // 2. Create Sequence if not exists
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS rimef.grupos_gru_codigo_seq START WITH ${nextId}`);
        console.log('✅ Sequence criada/verificada.');

        // 3. Set default value
        await pool.query(`ALTER TABLE rimef.grupos ALTER COLUMN gru_codigo SET DEFAULT nextval('rimef.grupos_gru_codigo_seq')`);
        console.log('✅ Default value configurado para usar a sequence.');

        // 4. Sync sequence value just in case it existed before
        await pool.query(`SELECT setval('rimef.grupos_gru_codigo_seq', (SELECT COALESCE(MAX(gru_codigo), 0) + 1 FROM rimef.grupos), false)`);
        console.log('✅ Sequence sincronizada com o maior ID atual.');

        console.log('\n✨ Correção aplicada com sucesso!');

    } catch (error) {
        console.error('❌ ERRO:', error);
    } finally {
        await pool.end();
    }
}

fixGruposAutoIncrement();
