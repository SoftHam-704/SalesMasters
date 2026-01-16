require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const SCHEMAS = ['target', 'ro_consult', 'public', 'brasil_wl'];

async function fixGruposAutoIncrement() {
    console.log(`\n🔧 CORRIGINDO AUTO-INCREMENTO EM rimef.grupos PARA: ${SCHEMAS.join(', ')}\n`);

    for (const schema of SCHEMAS) {
        try {
            console.log(`\n📂 Verificando schema: ${schema}`);

            // Check if table exists first
            const tableCheck = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = $1 AND table_name = 'grupos'
            `, [schema]);

            if (tableCheck.rows.length === 0) {
                console.log(`⚠️ Tabela 'grupos' não encontrada no schema '${schema}'. Pulando...`);
                continue;
            }

            // 1. Check max id
            const maxRes = await pool.query(`SELECT MAX(gru_codigo) as max_id FROM "${schema}".grupos`);
            const maxId = maxRes.rows[0].max_id || 0;
            console.log(`   📈 Maior ID atual: ${maxId}`);
            const nextId = parseInt(maxId) + 1;

            // 2. Create Sequence if not exists
            const seqName = `${schema}.grupos_gru_codigo_seq`;
            // Note: CREATE SEQUENCE IF NOT EXISTS requires simple identifier or quoted identifier.
            await pool.query(`CREATE SEQUENCE IF NOT EXISTS "${schema}".grupos_gru_codigo_seq START WITH ${nextId}`);
            console.log('   ✅ Sequence criada/verificada.');

            // 3. Set default value
            await pool.query(`ALTER TABLE "${schema}".grupos ALTER COLUMN gru_codigo SET DEFAULT nextval('${schema}.grupos_gru_codigo_seq')`);
            console.log('   ✅ Default value configurado.');

            // 4. Sync sequence value
            await pool.query(`SELECT setval('${schema}.grupos_gru_codigo_seq', (SELECT COALESCE(MAX(gru_codigo), 0) + 1 FROM "${schema}".grupos), false)`);
            console.log('   ✅ Sequence sincronizada.');

        } catch (error) {
            console.error(`❌ ERRO no schema ${schema}:`, error.message);
        }
    }

    console.log('\n✨ Operação concluída!');
    await pool.end();
}

fixGruposAutoIncrement();
