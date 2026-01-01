const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'salesmaster',
    user: 'postgres',
    password: 'postgres'
});

async function seedGrupoDesc() {
    try {
        console.log('Verificando tabela grupo_desc...\n');

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'grupo_desc'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Criando tabela grupo_desc...');
            await pool.query(`
                CREATE TABLE grupo_desc (
                    gde_id SERIAL PRIMARY KEY,
                    gde_nome VARCHAR(100) NOT NULL
                );
            `);
            console.log('✅ Tabela criada!');
        }

        // Check if has data
        const count = await pool.query('SELECT COUNT(*) FROM grupo_desc');
        console.log(`Total de registros: ${count.rows[0].count}`);

        if (parseInt(count.rows[0].count) === 0) {
            console.log('\nInserindo grupos padrão...');
            const grupos = [
                'BIELETA',
                'COXIM',
                'PIVÔ',
                'AMORTECEDOR',
                'MOLA',
                'BARRA ESTABILIZADORA',
                'TERMINAL',
                'BANDEJA',
                'BUCHA'
            ];

            for (const grupo of grupos) {
                await pool.query(
                    'INSERT INTO grupo_desc (gde_nome) VALUES ($1)',
                    [grupo]
                );
            }
            console.log(`✅ ${grupos.length} grupos inseridos!`);
        }

        // Show all groups
        const all = await pool.query('SELECT * FROM grupo_desc ORDER BY gde_nome');
        console.log('\nGrupos cadastrados:');
        console.table(all.rows);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

seedGrupoDesc();
