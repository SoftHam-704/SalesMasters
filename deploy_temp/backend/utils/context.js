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

            // 2. Tenta Header (Se for a primeira vez do dia ou após restart)
            if (!pool && tenantDbConfigRaw) {
                try {
                    const dbConfig = JSON.parse(tenantDbConfigRaw);
                    pool = getTenantPool(tenantCnpj, dbConfig);
                } catch (e) { }
            }

            // 3. Recuperação via Master (Só se as outras falharem)
            if (!pool && masterPool) {
                try {
                    const cleanCnpj = tenantCnpj.replace(/\D/g, '');
                    const result = await masterPool.query(
                        'SELECT db_host, db_nome, db_schema, db_usuario, db_senha, db_porta FROM empresas WHERE cnpj = $1 OR REPLACE(REPLACE(REPLACE(cnpj, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = $1 LIMIT 1',
                        [cleanCnpj]
                    );

                    if (result.rows.length > 0) {
                        const emp = result.rows[0];
                        const dbConfig = {
                            host: emp.db_host,
                            database: emp.db_nome,
                            schema: emp.db_schema || 'public',
                            user: emp.db_usuario,
                            password: emp.db_senha,
                            port: emp.db_porta || 5432
                        };
                        pool = getTenantPool(tenantCnpj, dbConfig);
                    }
                } catch (e) {
                    console.error('Master fallback error:', e.message);
                }
            }
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
