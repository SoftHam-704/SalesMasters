/**
 * Script para inserir empresas no Master na nuvem
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'process.env.DB_PASSWORD'
});

async function insertEmpresas() {
    console.log('📡 Conectando no Master na nuvem...');

    // Inserir Target
    await pool.query(`
        INSERT INTO empresas (cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_usuario, db_senha, db_porta)
        VALUES ('33866124000103', 'TARGET REPRESENTACOES LTDA', 'Target Rep', 'ATIVO', 
                'node254557-salesmaster.sp1.br.saveincloud.net.br', 'basesales', 'webadmin', 'process.env.DB_PASSWORD', 13062)
        ON CONFLICT (cnpj) DO NOTHING
    `);
    console.log('✅ Target inserida');

    // Verificar
    const result = await pool.query('SELECT id, cnpj, razao_social, status, db_host FROM empresas ORDER BY id');
    console.log('\n📊 Empresas no Master:');
    console.table(result.rows);

    await pool.end();
}

insertEmpresas().catch(console.error);

