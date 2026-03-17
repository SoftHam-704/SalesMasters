const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 10000
});

const NEW_SCHEMA = 'mgarep';
const SOURCE_SCHEMA = 'public';

async function cloneSchema() {
    const client = await pool.connect();
    try {
        console.log(`🚀 Iniciando clonagem de ${SOURCE_SCHEMA} para ${NEW_SCHEMA}...`);

        // 1. Criar o schema
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${NEW_SCHEMA}`);
        console.log(`✅ Schema ${NEW_SCHEMA} criado.`);

        // 2. Clonar Tabelas (Estrutura)
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        `, [SOURCE_SCHEMA]);

        for (const row of tables.rows) {
            const tableName = row.table_name;
            // Usar LIKE para copiar a estrutura incluindo colunas, tipos e NOT NULL
            // Mas não copia constraints de FK ou índices automaticamente (precisamos tratar)
            await client.query(`CREATE TABLE IF NOT EXISTS ${NEW_SCHEMA}.${tableName} (LIKE ${SOURCE_SCHEMA}.${tableName} INCLUDING ALL)`);
            console.log(`   - Tabela ${tableName} clonada.`);
        }

        // 3. Clonar Functions
        console.log(`🔍 Clonando funções de ${SOURCE_SCHEMA}...`);
        const functions = await client.query(`
            SELECT 
                p.proname,
                pg_get_functiondef(p.oid) as definition,
                pg_get_function_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = $1
        `, [SOURCE_SCHEMA]);

        for (const row of functions.rows) {
            let def = row.definition;
            // Substituir referências ao schema de origem pelo novo schema no corpo da função
            // Isso é crítico para views e tabelas internas
            def = def.replace(new RegExp(`${SOURCE_SCHEMA}\\.`, 'g'), `${NEW_SCHEMA}.`);

            // Ajustar o CREATE FUNCTION para o novo schema
            def = def.replace(new RegExp(`CREATE OR REPLACE FUNCTION ${SOURCE_SCHEMA}\\.`, 'g'), `CREATE OR REPLACE FUNCTION ${NEW_SCHEMA}.`);

            try {
                await client.query(def);
                console.log(`   - Função ${row.proname} clonada.`);
            } catch (err) {
                console.error(`   ❌ Erro na função ${row.proname}:`, err.message);
            }
        }

        // 4. Clonar Views
        console.log(`🔍 Clonando views de ${SOURCE_SCHEMA}...`);
        const views = await client.query(`
            SELECT viewname, definition 
            FROM pg_views 
            WHERE schemaname = $1
        `, [SOURCE_SCHEMA]);

        for (const row of views.rows) {
            let def = row.definition;
            // Remover o ponto e vírgula final se existir
            def = def.trim().replace(/;$/, '');

            // Substituir referências
            const newDef = def.replace(new RegExp(`${SOURCE_SCHEMA}\\.`, 'g'), `${NEW_SCHEMA}.`);

            try {
                await client.query(`CREATE OR REPLACE VIEW ${NEW_SCHEMA}.${row.viewname} AS ${newDef}`);
                console.log(`   - View ${row.viewname} clonada.`);
            } catch (err) {
                console.error(`   ❌ Erro na view ${row.viewname}:`, err.message);
            }
        }

        // 5. Adicionar Índices de Performance específicos (Aura BI)
        console.log(`⚡ Aplicando índices de performance...`);
        const perfQueries = [
            `CREATE INDEX IF NOT EXISTS idx_${NEW_SCHEMA}_pedidos_data_situacao ON ${NEW_SCHEMA}.pedidos (ped_data, ped_situacao)`,
            `CREATE INDEX IF NOT EXISTS idx_${NEW_SCHEMA}_pedidos_industria ON ${NEW_SCHEMA}.pedidos (ped_industria)`,
            `CREATE INDEX IF NOT EXISTS idx_${NEW_SCHEMA}_itens_ped_pedido ON ${NEW_SCHEMA}.itens_ped (ite_pedido)`,
            `CREATE INDEX IF NOT EXISTS idx_${NEW_SCHEMA}_itens_ped_industria ON ${NEW_SCHEMA}.itens_ped (ite_industria)`
        ];

        for (const q of perfQueries) {
            try {
                await client.query(q);
            } catch (err) {
                console.warn(`   ⚠️ Aviso no índice:`, err.message);
            }
        }

        console.log(`\n🏁 Clonagem concluída com sucesso para o tenant MGA REPRESENTAÇÕES (${NEW_SCHEMA}).`);

    } catch (err) {
        console.error('❌ ERRO CRÍTICO NA CLONAGEM:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cloneSchema();
