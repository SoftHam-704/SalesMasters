const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432
});

async function run() {
    try {
        console.log('📊 Criando tabelas do módulo financeiro...\n');

        const sqlPath = path.join(__dirname, '../database/financial_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        console.log('✅ Tabelas criadas com sucesso!\n');

        // Verificar tabelas criadas
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'fin_%'
            ORDER BY table_name
        `);

        console.log('📋 Tabelas criadas:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
