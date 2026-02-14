const { masterPool } = require('./utils/db');

async function debugLogin() {
    const rawCnpj = '99999999000199';
    const nome = 'hamilton';
    const sobrenome = 'sistemas';
    const password = 'hamilton123';

    try {
        console.log('--- Iniciando Debug de Login Master ---');

        // 1. Buscar Empresa
        const masterQuery = `
            SELECT id, cnpj, razao_social, nome_fantasia, status, db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                   COALESCE(limite_sessoes, 999) as limite_sessoes, 
                   COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo,
                   ramoatv
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
        `;
        const masterResult = await masterPool.query(masterQuery, [rawCnpj]);

        if (masterResult.rows.length === 0) {
            console.log('❌ Empresa não encontrada no Master');
            return;
        }
        const empresa = masterResult.rows[0];
        console.log('✅ Empresa encontrada:', empresa.razao_social);

        // 2. Buscar Usuário
        const userQuery = `SELECT * FROM usuarios WHERE nome ILIKE $1 AND sobrenome ILIKE $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
        const userResult = await masterPool.query(userQuery, [nome, sobrenome, empresa.id, password]);

        if (userResult.rows.length === 0) {
            console.log('⚠️ Usuário não encontrado no Master. Iniciando FALLBACK para o Tenant...');
            const dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta,
                schema: empresa.db_schema
            };

            try {
                const { getSpecificPool } = require('./utils/db');
                const tenantPool = await getSpecificPool(dbConfig);
                console.log('✅ Conexão com Tenant Pool OK');

                await tenantPool.query(`SET search_path TO "${dbConfig.schema}", public`);
                console.log(`✅ Search path definido para ${dbConfig.schema}`);

                const tenantUserQuery = `
                    SELECT u.*, u.master as e_admin, u.email as user_email 
                    FROM user_nomes u 
                    WHERE LOWER(u.nome) = LOWER($1) AND LOWER(u.sobrenome) = LOWER($2) AND u.senha = $3
                `;
                const tenantUserRes = await tenantPool.query(tenantUserQuery, [nome, sobrenome, password]);

                if (tenantUserRes.rows.length > 0) {
                    console.log('✅ Usuário encontrado no Tenant!');
                } else {
                    console.log('❌ Usuário não encontrado nem no Tenant.');
                }
            } catch (e) {
                console.error('❌ ERRO NO FALLBACK (Provável causa do 500):', e.message);
                console.error(e.stack);
            }
        } else {
            console.log('✅ Usuário encontrado no Master');
        }

        // Testar sessoes_ativas insertion
        console.log('--- Testando inserção em sessoes_ativas ---');
        const insertSessionQuery = `
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, ip, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        // Use a fake ID for test
        try {
            const res = await masterPool.query(insertSessionQuery, [empresa.id, 999999, 'test-token', '127.0.0.1', 'Debug Script']);
            console.log('✅ Inserção em sessoes_ativas OK, ID:', res.rows[0].id);
        } catch (e) {
            console.error('❌ Erro em sessoes_ativas:', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro crítico no debug:', error);
        process.exit(1);
    }
}
debugLogin();
