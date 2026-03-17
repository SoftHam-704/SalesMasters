
const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

async function cloneSchema() {
    const sourceSchema = 'public';
    const targetSchema = 'rmrep';
    const sqlFile = path.join(__dirname, 'estrutura_public_v2_utf8.sql');

    console.log(`🚀 Iniciando clonagem: ${sourceSchema} -> ${targetSchema}`);

    try {
        if (!fs.existsSync(sqlFile)) {
            throw new Error(`Arquivo SQL não encontrado: ${sqlFile}`);
        }

        console.log('Lendo arquivo SQL...');
        let sql = fs.readFileSync(sqlFile, 'utf8');

        // Remover BOM se existir
        if (sql.charCodeAt(0) === 0xFEFF) {
            console.log('BOM detectado e removido.');
            sql = sql.slice(1);
        }

        console.log('Removendo meta-comandos do psql...');
        // Remover linhas que começam com \ (meta-comandos do psql não suportados pelo driver)
        sql = sql.split('\n')
            .filter(line => !line.trim().startsWith('\\'))
            .join('\n');

        console.log('Adaptando SQL para o novo schema...');
        // 1. Comentar comandos de criação do schema public se existirem
        sql = sql.replace(/^CREATE SCHEMA public;/gm, `-- CREATE SCHEMA public;`);
        sql = sql.replace(/^ALTER SCHEMA public OWNER TO webadmin;/gm, `-- ALTER SCHEMA public OWNER TO webadmin;`);

        // 2. Substituir referências de schema de forma segura
        // Substituir public. por rmrep. (comuns em CREATE TABLE, etc)
        sql = sql.replace(/\bpublic\./g, `${targetSchema}.`);
        // Substituir 'public' e "public" (comuns em SET search_path ou outros metadados)
        sql = sql.replace(/'public'/g, `'${targetSchema}'`);
        sql = sql.replace(/"public"/g, `"${targetSchema}"`);

        // 3. Garantir search_path no início e forçar rmrep
        const header = `SET search_path TO ${targetSchema}, public;\n\n`;
        sql = header + sql;

        console.log('Executando SQL (isso pode levar alguns minutos)...');

        // Dividir por ";" pode ser perigoso devido a funções, etc.
        // O pg_dump é bem estruturado. Vamos tentar executar o bloco todo ou em partes menores se falhar.
        // Pool.query aguenta múltiplos statements se não houver erro de sintaxe.

        await pool.query(sql);

        console.log(`\n✅ Estrutura clonada com sucesso para o schema: ${targetSchema}`);

    } catch (err) {
        console.error('\n❌ Erro durante a clonagem:', err.message);
        if (err.position) {
            console.error(`Erro próximo à posição: ${err.position}`);
            // Mostrar um pedaço do SQL próximo ao erro se possível
            const start = Math.max(0, err.position - 100);
            const end = err.position + 100;
            // console.error('SQL Context:', sql.substring(start, end));
        }
    } finally {
        await pool.end();
    }
}

cloneSchema();
