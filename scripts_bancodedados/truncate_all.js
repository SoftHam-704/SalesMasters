// Script Node.js para executar TRUNCATE em todas as tabelas
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'salesmaster',
    user: 'postgres',
    password: 'postgres'
});

async function truncateAllTables() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Iniciando limpeza do banco de dados...\n');

        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'TRUNCATE_ALL_TABLES.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Executar o SQL
        await client.query(sql);

        console.log('✅ Todas as tabelas foram limpas com sucesso!');
        console.log('🔄 Todos os sequences foram resetados para 1');
        console.log('⚠️  O banco está completamente vazio e pronto para importação\n');

        // Verificar tamanho das tabelas
        const result = await client.query(`
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        console.log('📊 Verificação das tabelas:');
        result.rows.forEach(row => {
            console.log(`   ${row.tablename}: ${row.size}`);
        });

    } catch (error) {
        console.error('❌ Erro ao limpar banco de dados:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar
truncateAllTables()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Erro fatal:', err);
        process.exit(1);
    });
