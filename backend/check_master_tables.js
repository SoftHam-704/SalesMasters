
const { masterPool } = require('./utils/db');

async function check() {
    try {
        console.log('Verificando tabelas no Master DB...');

        const res = await masterPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('sessoes_ativas', 'log_tentativas_excedentes', 'usuarios', 'empresas')
        `);

        const tables = res.rows.map(r => r.table_name);
        console.log('Tabelas encontradas:', tables);

        const required = ['sessoes_ativas', 'log_tentativas_excedentes', 'usuarios', 'empresas'];
        const missing = required.filter(t => !tables.includes(t));

        if (missing.length > 0) {
            console.error('❌ Tabelas FALTANDO:', missing);
            process.exit(1);
        } else {
            console.log('✅ Todas as tabelas necessárias estão presentes.');
        }

    } catch (err) {
        console.error('Erro ao conectar ou consultar:', err.message);
        process.exit(1);
    } finally {
        await masterPool.end();
    }
}

check();
