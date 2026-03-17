const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const sqlPath = path.join(__dirname, '../sql/install_whatsapp_module.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

async function deploy() {
    console.log('🚀 Iniciando deploy global do módulo WhatsApp IA (v1.1.0)...');

    try {
        const schemasRes = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema') 
      AND schema_name NOT LIKE 'pg_toast%' 
      AND schema_name NOT LIKE 'pg_temp%'
      ORDER BY schema_name;
    `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log(`📂 Schemas encontrados (${schemas.length}): ${schemas.join(', ')}`);

        for (const schema of schemas) {
            console.log(`🛠️ Aplicando ao schema: ${schema}...`);

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${schema}, public;`);
                await client.query(sqlContent);

                // Adicionar Seed de Templates Básico se a tabela existir
                await client.query(`
          INSERT INTO wpp_template (codigo, nome, categoria, conteudo, variaveis)
          VALUES 
          ('boas_vindas', 'Boas-vindas', 'saudacao', 'Olá! 👋 Obrigado pelo contato. Sou o assistente virtual da SoftHam. Como posso te ajudar?', ARRAY['nome']),
          ('followup_3d', 'Follow-up 3 dias', 'followup', 'Oi! Passando para saber se ainda tem interesse no projeto que conversamos.', ARRAY['nome'])
          ON CONFLICT (codigo) DO NOTHING;
        `);

                await client.query('COMMIT');
                console.log(`✅ Schema ${schema} atualizado com sucesso.`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Erro no schema ${schema}:`, err.message);
            } finally {
                client.release();
            }
        }

        console.log('\n✨ Deploy concluído em todos os schemas.');
    } catch (err) {
        console.error('💥 Erro fatal no processo de deploy:', err.message);
    } finally {
        await pool.end();
    }
}

deploy();
