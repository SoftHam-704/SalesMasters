const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // basesales
    port: process.env.DB_PORT,
    options: "-c search_path=remap,public"
});

const whitelist = [
    100006, 100002, 100003, 100010, 100048, 100114, 100014, 100128, 100012, 100080,
    100079, 100086, 100054, 100005, 100093, 100141, 100023, 100137, 100113, 100033,
    100127, 100144, 100150, 100120, 100148, 100124, 100142, 100070, 100139, 100143,
    100151, 100146
];

async function run() {
    try {
        console.log('🚀 Iniciando inativação de indústrias para o schema REMAP...');

        // 1. Verificar total antes
        const totalBefore = await pool.query('SELECT COUNT(*) FROM fornecedores');
        const activeBefore = await pool.query("SELECT COUNT(*) FROM fornecedores WHERE for_tipo2 = 'A'");

        console.log(`📊 Total de indústrias: ${totalBefore.rows[0].count}`);
        console.log(`🟢 Ativas antes: ${activeBefore.rows[0].count}`);

        // 2. Inativar quem NÃO está na lista
        const inactivateRes = await pool.query(`
            UPDATE fornecedores 
            SET for_tipo2 = 'I' 
            WHERE for_codigo NOT IN (${whitelist.join(',')})
        `);

        // 3. Garantir que os da lista estão ATIVOS
        const activateRes = await pool.query(`
            UPDATE fornecedores 
            SET for_tipo2 = 'A' 
            WHERE for_codigo IN (${whitelist.join(',')})
        `);

        console.log(`✅ Inativadas: ${inactivateRes.rowCount} indústrias.`);
        console.log(`✅ Ativadas/Mantidas: ${activateRes.rowCount} indústrias.`);

        // 4. Verificar total depois
        const activeAfter = await pool.query("SELECT COUNT(*) FROM fornecedores WHERE for_tipo2 = 'A'");
        console.log(`🟢 Ativas depois: ${activeAfter.rows[0].count}`);

        // 5. Listar as ativas para conferência
        const listActive = await pool.query("SELECT for_codigo, for_nomered FROM fornecedores WHERE for_tipo2 = 'A' ORDER BY for_nomered");
        console.log('\n📋 Indústrias Ativas no REMAP:');
        listActive.rows.forEach(r => console.log(`- [${r.for_codigo}] ${r.for_nomered}`));

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

run();
