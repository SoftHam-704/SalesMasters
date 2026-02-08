
const { masterPool, getTenantPool } = require('./utils/db');
require('dotenv').config();

async function testLogin() {
    try {
        const cnpj = '17504829000124'; // SoftHam
        const nome = 'hamilton';
        const sobrenome = 'sistemas';
        const senha = '123'; // Senha genérica de teste, apenas para ver se chega na query

        console.log('1. Buscando empresa...');
        const masterRes = await masterPool.query('SELECT * FROM empresas WHERE cnpj = $1', [cnpj]);
        const empresa = masterRes.rows[0];

        if (!empresa) {
            console.error('Empresa não encontrada');
            return;
        }
        console.log('Empresa:', empresa.razao_social);

        console.log('2. Buscando usuário no Master...');
        const userRes = await masterPool.query(
            'SELECT * FROM usuarios WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND empresa_id = $3',
            [nome, sobrenome, empresa.id]
        );

        if (userRes.rows.length === 0) {
            console.log('Usuário não encontrado no Master. Tentando Fallback Tenant...');

            const dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                schema: empresa.db_schema || 'public',
                user: empresa.db_usuario,
                password: empresa.db_senha || '',
                port: empresa.db_porta || 5432
            };

            console.log('Tenant Config:', { ...dbConfig, password: '***' });

            try {
                const tenantPool = getTenantPool(empresa.cnpj, dbConfig);
                console.log('Pool obtido. Executando query no tenant...');

                const tenantRes = await tenantPool.query(
                    'SELECT codigo, nome, sobrenome FROM user_nomes WHERE nome ILIKE $1 AND sobrenome ILIKE $2',
                    [nome, sobrenome]
                );

                console.log('Resultado Tenant:', tenantRes.rows);

            } catch (tenantErr) {
                console.error('❌ ERRO NO TENANT:', tenantErr);
            }

        } else {
            console.log('Usuário encontrado no Master:', userRes.rows[0]);
        }

    } catch (err) {
        console.error('❌ ERRO GERAL:', err);
    } finally {
        process.exit();
    }
}

testLogin();
