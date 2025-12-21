const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'salesmaster',
    user: 'postgres',
    password: 'postgres'
});

async function checkGrupos() {
    try {
        console.log('=== Verificando tabela GRUPOS ===\n');

        // Check structure
        const structure = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'grupos'
            ORDER BY ordinal_position;
        `);

        console.log('Estrutura:');
        console.table(structure.rows);

        // Get count
        const count = await pool.query('SELECT COUNT(*) FROM grupos');
        console.log(`\nTotal: ${count.rows[0].count} registros`);

        // Get sample
        const sample = await pool.query('SELECT * FROM grupos LIMIT 10');
        console.log('\nPrimeiros 10 registros:');
        console.table(sample.rows);

        // Check cli_descpro relationship
        console.log('\n=== Verificando relacionamento CLI_DESCPRO ===\n');
        const relationship = await pool.query(`
            SELECT DISTINCT cd.cli_grupo, g.gru_descricao
            FROM cli_descpro cd
            LEFT JOIN grupos g ON g.gru_codigo = cd.cli_grupo
            LIMIT 10;
        `);
        console.log('Relacionamento cli_descpro.cli_grupo -> grupos.gru_codigo:');
        console.table(relationship.rows);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkGrupos();
