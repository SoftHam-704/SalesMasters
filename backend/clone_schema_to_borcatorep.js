const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function cloneSchema() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME || 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    };

    const pool = new Pool(config);
    const sourceSchema = 'public';
    const targetSchema = 'borcatorep';

    try {
        console.log(`🚀 Iniciando clonagem COMPLETA do schema ${sourceSchema} para ${targetSchema}...`);

        // 1. Limpar e criar o schema de destino
        console.log(`🧹 Limpando schema ${targetSchema}...`);
        await pool.query(`DROP SCHEMA IF EXISTS ${targetSchema} CASCADE`);
        await pool.query(`CREATE SCHEMA ${targetSchema}`);
        console.log(`✅ Schema ${targetSchema} recriado.`);

        // 2. Ler o arquivo de estrutura
        const sqlPath = path.join(__dirname, 'estrutura_public_v2_utf8.sql');
        console.log(`📖 Lendo estrutura de: ${sqlPath}`);
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Arquivo não encontrado: ${sqlPath}`);
        }
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Remover BOM (Byte Order Mark) se existir
        sql = sql.replace(/^\uFEFF/, '');

        // 3. Transformar o SQL
        console.log(`🔄 Transformando SQL (mapeamento public -> ${targetSchema})...`);

        // Substituir qualificações explícitas
        sql = sql.replace(/public\./g, `${targetSchema}.`);

        // Substituir search_path
        sql = sql.replace(/search_path = public/g, `search_path = ${targetSchema}`);

        // Desativar criação do schema public se vier no dump
        sql = sql.replace(/CREATE SCHEMA public;/g, `-- CREATE SCHEMA public;`);
        sql = sql.replace(/ALTER SCHEMA public OWNER TO/g, `-- ALTER SCHEMA public OWNER TO`);

        // Ajustar referências em comentários ou outros locais que usem "SCHEMA public"
        sql = sql.replace(/SCHEMA public/g, `SCHEMA ${targetSchema}`);

        // Remover comandos meta do psql (linhas que começam com \)
        sql = sql.split('\n').filter(line => !line.trim().startsWith('\\')).join('\n');

        // 4. Executar o SQL de estrutura
        console.log('⚙️ Executando DDL no banco (tabelas, views, funções, índices, sequences)...');
        await pool.query(sql);
        console.log('✅ Estrutura clonada com sucesso.');

        // 5. Clonar dados das tabelas solicitadas
        const tablesToPopulate = ['cidades', 'user_nomes'];
        for (const table of tablesToPopulate) {
            console.log(`📊 Clonando dados de ${table}...`);
            try {
                const result = await pool.query(`INSERT INTO ${targetSchema}.${table} SELECT * FROM ${sourceSchema}.${table}`);
                console.log(`✅ Dados de ${table} clonados (${result.rowCount} registros).`);
            } catch (e) {
                console.warn(`⚠️ Erro ao clonar ${table}:`, e.message);
            }
        }

        console.log('🎉 Clonagem finalizada com sucesso! Verificando resultados...');

        const resTables = await pool.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = '${targetSchema}' AND table_type = 'BASE TABLE'`);
        const resViews = await pool.query(`SELECT count(*) FROM information_schema.views WHERE table_schema = '${targetSchema}'`);
        const resFuncs = await pool.query(`SELECT count(*) FROM information_schema.routines WHERE routine_schema = '${targetSchema}'`);

        console.log(`📈 Resumo em ${targetSchema}:`);
        console.log(`- Tabelas: ${resTables.rows[0].count}`);
        console.log(`- Views: ${resViews.rows[0].count}`);
        console.log(`- Funções/Procedures: ${resFuncs.rows[0].count}`);

    } catch (err) {
        console.error('❌ Erro CRÍTICO durante a clonagem:', err);
    } finally {
        await pool.end();
    }
}

cloneSchema();
