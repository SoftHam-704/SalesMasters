require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function checkUserInfo() {
    const tenantPool = new Pool({
        host: '191.243.199.137',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043'
    });

    try {
        console.log('🔍 Buscando colunas da tabela user_nomes no schema ro_consult...');
        const cols = await tenantPool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' AND table_name = 'user_nomes'
        `);
        console.table(cols.rows);

        console.log('\n🔍 Buscando usuário "mariana" no schema ro_consult...');
        const userRes = await tenantPool.query(`
            SELECT * FROM "ro_consult".user_nomes
            WHERE nome ILIKE 'mariana'
        `);
        console.table(userRes.rows);

        if (userRes.rows.length === 0) {
            console.log('\n🔍 Nenhum usuário "mariana" encontrado. Listando 5 primeiros usuários de ro_consult:');
            const top5 = await tenantPool.query(`SELECT nome, sobrenome, usuario FROM "ro_consult".user_nomes LIMIT 5`);
            console.table(top5.rows);
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await tenantPool.end();
    }
}

checkUserInfo();
