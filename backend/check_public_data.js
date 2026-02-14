const { getTenantPool } = require('./utils/db');
const dbConfig = {
    host: 'localhost',
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
    port: 5432,
    schema: 'public'
};

async function checkData() {
    try {
        const pool = getTenantPool('99999999000199', dbConfig);

        console.log('--- Verificando Estrutura do Schema PUBLIC ---');
        const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Tabelas encontradas:', tables.join(', '));

        const importantTables = ['pedidos', 'clientes', 'fornecedores', 'crm_oportunidades', 'crm_interacoes'];

        for (const table of importantTables) {
            if (tables.includes(table)) {
                const countRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`✅ Tabela ${table}: ${countRes.rows[0].count} registros`);
            } else {
                console.log(`❌ Tabela ${table} NÃO EXISTE no schema public.`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na verificação:', e.message);
        process.exit(1);
    }
}
checkData();
