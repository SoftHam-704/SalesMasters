const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkAreaTables() {
    try {
        console.log('🔍 Verificando tabelas de áreas de atuação...\n');

        // Verificar área_atuacao
        const resAreaAtuacao = await pool.query("SELECT COUNT(*) FROM area_atuacao");
        console.log(`✅ Tabela area_atuacao: ${resAreaAtuacao.rows[0].count} registros`);

        // Mostrar alguns registros
        const samplesAtuacao = await pool.query("SELECT * FROM area_atuacao LIMIT 5");
        console.log('Exemplos de area_atuacao:');
        console.table(samplesAtuacao.rows);

        console.log('\n---\n');

        // Verificar area_atu
        const resAreaAtu = await pool.query("SELECT COUNT(*) FROM area_atu");
        console.log(`✅ Tabela area_atu: ${resAreaAtu.rows[0].count} registros`);

        // Mostrar alguns registros
        const samplesAtu = await pool.query("SELECT * FROM area_atu LIMIT 5");
        console.log('Exemplos de area_atu:');
        console.table(samplesAtu.rows);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkAreaTables();
