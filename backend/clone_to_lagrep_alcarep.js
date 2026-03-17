const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runCloning() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME || 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false
    };

    const pool = new Pool(config);
    const sqlPath = path.join(__dirname, 'estrutura_public_v2_utf8.sql');
    const targetSchemas = ['lagrep', 'alcarep'];

    try {
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Arquivo de estrutura não encontrado: ${sqlPath}`);
        }

        console.log('📖 Lendo estrutura base...');
        let baseSql = fs.readFileSync(sqlPath, 'utf8');
        baseSql = baseSql.replace(/^\uFEFF/, ''); // Remover BOM

        // Remover comandos meta do psql
        baseSql = baseSql.split('\n')
            .filter(line => !line.trim().startsWith('\\'))
            .join('\n');

        // Comentar criação do schema public se existir
        baseSql = baseSql.replace(/^CREATE SCHEMA public;/gm, '-- CREATE SCHEMA public;');
        baseSql = baseSql.replace(/^ALTER SCHEMA public OWNER TO/gm, '-- ALTER SCHEMA public OWNER TO');

        for (const targetSchema of targetSchemas) {
            console.log(`\n🚀 processando schema: ${targetSchema}`);

            // 1. Criar o schema
            console.log(`🧹 Criando schema ${targetSchema}...`);
            await pool.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema}`);
            
            // 2. Adaptar SQL para o schema de destino
            console.log(`🔄 Transformando SQL para ${targetSchema}...`);
            let sql = baseSql;
            
            // Substituir public. por [schema].
            // Usamos regex com \b para garantir que não substitua partes de nomes de outras tabelas/campos
            sql = sql.replace(/\bpublic\./g, `${targetSchema}.`);
            
            // Ajustar referências em strings
            sql = sql.replace(/'public'/g, `'${targetSchema}'`);
            sql = sql.replace(/"public"/g, `"${targetSchema}"`);

            // Garantir search_path no início do script para este schema
            const header = `SET search_path TO ${targetSchema}, public;\n\n`;
            sql = header + sql;

            // 3. Executar estrutura
            console.log(`⚙️ Executando DDL para ${targetSchema}...`);
            try {
                await pool.query(sql);
                console.log(`✅ Estrutura clonada para ${targetSchema}.`);
            } catch (err) {
                console.error(`❌ Erro na execução do DDL para ${targetSchema}:`, err.message);
                if (err.position) {
                    console.error(`Erro próximo à posição: ${err.position}`);
                }
                continue; // Tenta o próximo schema se este falhar na estrutura
            }

            // 4. Copiar dados (cidades)
            console.log(`📊 Copiando dados da tabela cidades para ${targetSchema}...`);
            try {
                // Limpar se já existir (caso de re-execução)
                await pool.query(`TRUNCATE TABLE ${targetSchema}.cidades`);
                await pool.query(`INSERT INTO ${targetSchema}.cidades SELECT * FROM public.cidades`);
                console.log(`✅ Dados de cidades copiados para ${targetSchema}.`);
            } catch (err) {
                console.error(`❌ Erro ao copiar cidades para ${targetSchema}:`, err.message);
            }

            // 5. Verificação básica
            const resTables = await pool.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = '${targetSchema}' AND table_type = 'BASE TABLE'`);
            const resCities = await pool.query(`SELECT count(*) FROM ${targetSchema}.cidades`);
            
            console.log(`📈 Resultados em ${targetSchema}:`);
            console.log(`   - Tabelas criadas: ${resTables.rows[0].count}`);
            console.log(`   - Registros em cidades: ${resCities.rows[0].count}`);
        }

        console.log('\n🏁 Processo de clonagem finalizado!');

    } catch (err) {
        console.error('❌ ERRO NO PROCESSO:', err);
    } finally {
        await pool.end();
    }
}

runCloning();
