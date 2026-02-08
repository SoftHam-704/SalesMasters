const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function fixPermissions() {
    try {
        console.log('--- Iniciando Correção de Permissões ---');

        // 1. Buscar todos os schemas que não são do sistema
        const schemaRes = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            AND schema_name NOT LIKE 'pg_temp_%'
            AND schema_name NOT LIKE 'pg_toast_temp_%'
        `);
        const schemasToFix = schemaRes.rows.map(r => r.schema_name);

        console.log('Schemas a corrigir:', schemasToFix.join(', '));

        for (const schema of schemasToFix) {
            console.log(`Aplicando em: ${schema}`);
            try {
                // Grant USAGE e SELECT/UPDATE em sequências existentes
                await pool.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA ${schema} TO webadmin`);

                // Grant ALL para garantir que não falte nada
                await pool.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO webadmin`);

                // Configura privilégios padrão para futuras sequências
                await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON SEQUENCES TO webadmin`);

                // Caso a tabela específica exista, garantir permissão nela e na sequência
                await pool.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO webadmin`);

                console.log(`✅ Sucesso no schema: ${schema}`);
            } catch (err) {
                console.log(`⚠️  Aviso no schema ${schema}: ${err.message}`);
            }
        }

        console.log('--- Processo Concluído ---');
    } catch (err) {
        console.error('❌ Erro Fatal:', err.message);
    } finally {
        await pool.end();
    }
}

fixPermissions();
