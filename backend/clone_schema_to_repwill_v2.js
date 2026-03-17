const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function cloneSchema() {
    const config = {
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
    };

    const pool = new Pool(config);
    const sourceSchema = 'public';
    const targetSchema = 'repwill';

    try {
        console.log(`🚀 Iniciando clonagem COMPLETA do schema ${sourceSchema} para ${targetSchema}...`);

        // 1. Limpar e criar o schema de destino
        console.log(`🧹 Limpando schema ${targetSchema}...`);
        await pool.query(`DROP SCHEMA IF EXISTS ${targetSchema} CASCADE`);
        await pool.query(`CREATE SCHEMA ${targetSchema}`);
        console.log(`✅ Schema ${targetSchema} recriado.`);

        // 2. Ler o arquivo de estrutura (versão atualizada com 102 tabelas)
        const sqlPath = path.join(__dirname, 'estrutura_public_v2_utf8.sql');
        console.log(`📖 Lendo estrutura de: ${sqlPath}`);
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Arquivo não encontrado: ${sqlPath}`);
        }
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Remover BOM (Byte Order Mark) se existir
        sql = sql.replace(/^\uFEFF/, '');

        // 3. Transformar o SQL
        console.log('🔄 Transformando SQL (mapeamento public -> repwill)...');

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
        console.log('⚙️ Executando DDL no banco (aproximadamente 102 tabelas + funções)...');

        // O node-postgres pode ter dificuldade com dumps gigantes em uma única query.
        // Mas como é apenas DDL (sem data), 1MB deve passar tranquilo.
        await pool.query(sql);
        console.log('✅ Estrutura (102 tabelas) clonada com sucesso.');

        // 5. Clonar dados das tabelas solicitadas
        console.log('📊 Clonando dados de cidades e user_nomes...');

        // Cidades
        try {
            await pool.query(`INSERT INTO ${targetSchema}.cidades SELECT * FROM public.cidades`);
            console.log('✅ Dados de cidades clonados.');
        } catch (e) {
            console.warn('⚠️ Erro ao clonar cidades:', e.message);
        }

        // User Nomes
        try {
            await pool.query(`INSERT INTO ${targetSchema}.user_nomes SELECT * FROM public.user_nomes`);
            console.log('✅ Dados de user_nomes clonados.');
        } catch (e) {
            console.warn('⚠️ Erro ao clonar user_nomes:', e.message);
        }

        console.log('🎉 Clonagem finalizada com sucesso! Verificando resultados...');

        const resTables = await pool.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = '${targetSchema}' AND table_type = 'BASE TABLE'`);
        console.log(`📈 Tabelas (BASE TABLE) em ${targetSchema}: ${resTables.rows[0].count}`);

    } catch (err) {
        console.error('❌ Erro CRÍTICO durante a clonagem:', err);
    } finally {
        await pool.end();
    }
}

cloneSchema();
