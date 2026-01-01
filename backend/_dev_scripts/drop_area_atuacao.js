const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function dropAreaAtuacaoTable() {
    try {
        console.log('🗑️  Verificando e removendo tabela area_atuacao...\n');

        // Verificar se a tabela existe e está vazia
        const checkExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'area_atuacao'
            );
        `);

        if (!checkExists.rows[0].exists) {
            console.log('✅ Tabela area_atuacao não existe (já foi removida)');
            return;
        }

        // Contar registros
        const count = await pool.query('SELECT COUNT(*) FROM area_atuacao');
        console.log(`📊 Tabela area_atuacao tem ${count.rows[0].count} registros`);

        if (parseInt(count.rows[0].count) > 0) {
            console.log('⚠️  ATENÇÃO: A tabela tem dados! Confirme antes de deletar.');
            return;
        }

        // Deletar a tabela (CASCADE para remover dependências)
        await pool.query('DROP TABLE IF EXISTS area_atuacao CASCADE');

        console.log('\n✅ Tabela area_atuacao removida com sucesso!');

        // Verificar tabela correta
        const areaAtu = await pool.query('SELECT COUNT(*) FROM area_atu');
        console.log(`\n✅ Tabela correta (area_atu) mantida com ${areaAtu.rows[0].count} registros`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

dropAreaAtuacaoTable();
