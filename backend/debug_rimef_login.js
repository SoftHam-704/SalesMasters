require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

// Config do Master
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE || 'basesales',
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD
});

async function debugLogin() {
    console.log('🕵️ Iniciando debug de login para RIMEF (05.122.231/0001-91)...');

    try {
        // 1. Buscar Empresa
        const cnpjLimpo = '05122231000191';
        const empQuery = `SELECT * FROM empresas WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1`;
        const empResult = await masterPool.query(empQuery, [cnpjLimpo]);

        if (empResult.rows.length === 0) {
            console.log('❌ Empresa não encontrada!');
            return;
        }

        const empresa = empResult.rows[0];
        console.log(`✅ Empresa Encontrada: ${empresa.razao_social} (Schema: ${empresa.db_schema})`);

        // 2. Buscar Usuário no Master
        console.log('🔍 Buscando usuário "joao ricardo" no Master...');
        const userQuery = `SELECT * FROM usuarios WHERE nome ILIKE 'joao' AND sobrenome ILIKE 'ricardo' AND empresa_id = $1`;
        const userMaster = await masterPool.query(userQuery, [empresa.id]);

        if (userMaster.rows.length > 0) {
            console.log('✅ Usuário encontrado no Master DB.');
        } else {
            console.log('⚠️ Usuário NÃO encontrado no Master DB. Testando conexão com Tenant...');

            // 3. Testar Conexão com Tenant (Rimef)
            const tenantConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                schema: empresa.db_schema, // rimef
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta
            };

            console.log(`🔌 Conectando ao Tenant: ${tenantConfig.schema} @ ${tenantConfig.host}...`);

            const poolOptions = {
                host: tenantConfig.host,
                port: tenantConfig.port,
                database: tenantConfig.database,
                user: tenantConfig.user,
                password: tenantConfig.password,
            };

            // Importante: setar search_path
            poolOptions.options = `-c search_path=${tenantConfig.schema},public`;

            const tenantPool = new Pool(poolOptions);

            try {
                const tenantUserQuery = `SELECT kode as id, nome, sobrenome FROM user_nomes WHERE nome ILIKE 'joao' AND sobrenome ILIKE 'ricardo'`;
                // OBS: O código original usa 'codigo', mas vou checar colunas disponíveis se der erro
                // Vou rodar um select * limit 1 antes pra ver colunas

                // Teste básico
                await tenantPool.query('SELECT 1');
                console.log('✅ Conexão com Tenant OK!');

                // Listar colunas da tabela user_nomes
                const cols = await tenantPool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = '${tenantConfig.schema}' 
                    AND table_name = 'user_nomes'
                 `);
                console.log('📋 Colunas em user_nomes:', cols.rows.map(r => r.column_name).join(', '));

                console.log('🔍 Buscando usuário na tabela user_nomes do tenant...');
                // Ajuste a query baseado nas colunas reais se necessário, mas tentando o padrão
                const userTenant = await tenantPool.query(`SELECT * FROM user_nomes WHERE nome ILIKE 'joao' AND sobrenome ILIKE 'ricardo'`);

                if (userTenant.rows.length > 0) {
                    console.log('✅ Usuário encontrado no Tenant:', userTenant.rows[0].nome, userTenant.rows[0].sobrenome);
                } else {
                    console.log('❌ Usuário NÃO encontrado no Tenant.');
                }

                await tenantPool.end();

            } catch (errTenant) {
                console.error('❌ ERRO AO CONECTAR NO TENANT:', errTenant.message);
                console.error(errTenant);
            }
        }

    } catch (err) {
        console.error('❌ Erro geral:', err);
    } finally {
        await masterPool.end();
    }
}

debugLogin();
