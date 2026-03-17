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
        console.log(`🚀 Iniciando clonagem do schema ${sourceSchema} para ${targetSchema}...`);

        // 1. Garantir que o schema de destino existe
        await pool.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema}`);
        console.log(`✅ Schema ${targetSchema} garantido.`);

        // 2. Ler o arquivo de estrutura
        const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', 'estrutura_public.sql');
        console.log(`📖 Lendo estrutura de: ${sqlPath}`);
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // 3. Transformar o SQL
        console.log('🔄 Transformando SQL (substituindo public. por repwill.)...');

        // Substituições fundamentais
        // Usamos regex com word boundary ou apenas substituição direta se tivermos certeza
        // pg_dump usa "public." (com ponto) para qualificar objetos
        sql = sql.replace(/public\./g, `${targetSchema}.`);

        // Outros ajustes de pg_dump
        sql = sql.replace(/CREATE SCHEMA public;/g, `-- CREATE SCHEMA public;`);
        sql = sql.replace(/ALTER SCHEMA public OWNER TO/g, `-- ALTER SCHEMA public OWNER TO`);
        sql = sql.replace(/SCHEMA public/g, `SCHEMA ${targetSchema}`);

        // Remover comandos meta do psql (linhas que começam com \)
        sql = sql.split('\n').filter(line => !line.trim().startsWith('\\')).join('\n');

        // 4. Executar o SQL de estrutura
        console.log('⚙️ Executando DDL no banco (isso pode levar alguns segundos devido ao tamanho do dump)...');

        // Dividir por ";" pode ser arriscado se houver ";" dentro de funções.
        // O node-postgres permite enviar múltiplos comandos se não houver parâmetros? 
        // Na verdade, pool.query(sql) para um bloco grande funciona se for SQL puro sem $1 etc.
        // Mas por segurança e performance de log, vamos tentar rodar o bloco todo.

        await pool.query(sql);
        console.log('✅ Estrutura clonada com sucesso.');

        // 5. Clonar dados das tabelas solicitadas
        console.log('📊 Clonando dados de cidades e user_nomes...');

        // Cidades
        try {
            await pool.query(`TRUNCATE ${targetSchema}.cidades CASCADE`);
            await pool.query(`INSERT INTO ${targetSchema}.cidades SELECT * FROM public.cidades`);
            console.log('✅ Dados de cidades clonados.');
        } catch (e) {
            console.warn('⚠️ Erro ao clonar cidades:', e.message);
        }

        // User Nomes
        try {
            await pool.query(`TRUNCATE ${targetSchema}.user_nomes CASCADE`);
            await pool.query(`INSERT INTO ${targetSchema}.user_nomes SELECT * FROM public.user_nomes`);
            console.log('✅ Dados de user_nomes clonados.');
        } catch (e) {
            console.warn('⚠️ Erro ao clonar user_nomes:', e.message);
        }

        console.log('🎉 Tudo pronto! Clonagem concluída com sucesso.');

    } catch (err) {
        console.error('❌ Erro CRÍTICO durante a clonagem:', err);
    } finally {
        await pool.end();
    }
}

cloneSchema();
