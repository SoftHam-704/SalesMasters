// Script para listar todas as tabelas do banco
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function listTables() {
    const client = await pool.connect();

    try {
        const result = await client.query(`
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        console.log('📊 Tabelas no banco de dados basesales:\n');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.tablename.padEnd(30)} - ${row.size}`);
        });
        console.log(`\n   Total: ${result.rows.length} tabelas`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

listTables();
