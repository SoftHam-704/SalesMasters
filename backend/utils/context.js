const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

function dbContextMiddleware(getTenantPool, masterPool) {
    return async (req, res, next) => {
        const tenantCnpj = req.headers['x-tenant-cnpj'];
        const tenantDbConfigRaw = req.headers['x-tenant-db-config'];

        let pool = null;

        if (tenantCnpj) {
            // 1. Tenta Cache
            pool = getTenantPool(tenantCnpj);
            if (pool) console.log(`🎯 [DB-CONTEXT] Pool encontrado em cache para CNPJ: ${tenantCnpj}`);

            // 2. Tenta Header (Se for a primeira vez do dia ou após restart)
            if (!pool && tenantDbConfigRaw) {
                try {
                    const dbConfig = JSON.parse(tenantDbConfigRaw);
                    // Só aceita configuração via header se tiver SENHA e USUÁRIO
                    if (dbConfig.user && dbConfig.password) {
                        console.log(`📡 [DB-CONTEXT] Criando Pool via Header para CNPJ: ${tenantCnpj}`);
                        pool = getTenantPool(tenantCnpj, dbConfig);
                    }
                } catch (e) {
                    console.error('❌ [DB-CONTEXT] Erro ao processar Header:', e.message);
                }
            }

            // 3. Recuperação via Master (Só se as outras falharem)
            if (!pool && masterPool) {
                try {
                    const cleanCnpj = tenantCnpj.replace(/\D/g, '');
                    console.log(`🔍 [DB-CONTEXT] Buscando no Master Fallback para CNPJ limpo: ${cleanCnpj}`);

                    const query = `
                        SELECT db_host, db_nome, db_schema, db_usuario, db_senha, db_porta 
                        FROM empresas 
                        WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 AND status = 'ATIVO'
                        LIMIT 1
                    `;
                    const result = await masterPool.query(query, [cleanCnpj]);

                    if (result.rows.length > 0) {
                        const emp = result.rows[0];
                        console.log(`✅ [DB-CONTEXT] Empresa encontrada no Master. Schema: ${emp.db_schema}`);

                        const dbConfig = {
                            host: emp.db_host,
                            database: emp.db_nome,
                            schema: emp.db_schema || 'public',
                            user: emp.db_usuario,
                            password: emp.db_senha,
                            port: emp.db_porta || 5432
                        };
                        pool = getTenantPool(tenantCnpj, dbConfig);
                    } else {
                        console.warn(`⚠️ [DB-CONTEXT] CNPJ ${cleanCnpj} não encontrado ou inativo no Master.`);
                    }
                } catch (e) {
                    console.error('❌ [DB-CONTEXT] Master fallback error:', e.message);
                }
            }
        } else {
            // console.log('ℹ️ [DB-CONTEXT] Requisição sem Header de Tenant. Usando MasterPool.');
        }

        storage.run(pool, () => {
            req.db = pool;
            next();
        });
    };
}

function getCurrentPool() {
    return storage.getStore();
}

module.exports = { dbContextMiddleware, getCurrentPool };
