require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function debugUserLogin() {
    const cnpjToLookup = '40.778.122/0001-28'.replace(/\D/g, '');
    const nome = 'mariana';
    const sobrenome = 'freitas';

    const masterPool = new Pool({
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        database: process.env.MASTER_DB_DATABASE,
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    });

    try {
        console.log(`🔍 Buscando empresa com CNPJ: ${cnpjToLookup} no Master...`);
        const masterRes = await masterPool.query(
            "SELECT id, razao_social, db_host, db_nome, db_schema, db_usuario, db_porta FROM empresas WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1",
            [cnpjToLookup]
        );

        if (masterRes.rows.length === 0) {
            console.log('❌ Empresa não encontrada no Banco Master.');
            return;
        }

        const empresa = masterRes.rows[0];
        console.log('✅ Empresa Encontrada:');
        console.table([empresa]);

        console.log(`\n🔍 Verificando usuário "${nome} ${sobrenome}" no schema "${empresa.db_schema}"...`);

        // Conectar ao banco do tenant (basesales via IP externo para diagnóstico)
        const tenantPool = new Pool({
            host: '191.243.199.137', // Acesso externo para diagnóstico
            port: 13062,
            database: empresa.db_nome,
            user: process.env.MASTER_DB_USER, // Usando admin para ver tudo
            password: process.env.MASTER_DB_PASSWORD
        });

        const userQuery = `
            SELECT codigo, nome, sobrenome, usuario, ativo, senha
            FROM "${empresa.db_schema}".user_nomes
            WHERE nome ILIKE $1 AND sobrenome ILIKE $2
        `;

        const userRes = await tenantPool.query(userQuery, [nome, sobrenome]);

        if (userRes.rows.length === 0) {
            console.log(`❌ Usuário "${nome} ${sobrenome}" não encontrado no schema "${empresa.db_schema}".`);

            // Listar alguns usuários do schema para ajudar
            const listRes = await tenantPool.query(`SELECT nome, sobrenome FROM "${empresa.db_schema}".user_nomes LIMIT 5`);
            console.log('\nAlguns usuários existentes neste schema:');
            console.table(listRes.rows);
        } else {
            console.log('✅ Usuário encontrado!');
            console.table(userRes.rows);

            // Verificar se a senha confere (o usuário não passou a senha, mas podemos ver se ela é nula ou algo assim)
            if (!userRes.rows[0].senha) {
                console.log('⚠️ Alerta: O usuário existe mas a senha no banco está vazia.');
            }
        }

        await tenantPool.end();
    } catch (err) {
        console.error('❌ Erro durante diagnóstico:', err.message);
    } finally {
        await masterPool.end();
    }
}

debugUserLogin();
