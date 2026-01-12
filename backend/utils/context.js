const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

/**
 * Middleware para capturar o pool de banco de dados baseado no Tenant
 */
function dbContextMiddleware(getTenantPool) {
    return (req, res, next) => {
        // 1. Extrai apenas o CNPJ do header (a configuração vem do cache, não do frontend)
        const tenantCnpj = req.headers['x-tenant-cnpj'];
        const tenantDbConfigRaw = req.headers['x-tenant-db-config'];

        if (tenantCnpj) {
            console.log(`📡 [CONTEXT] Request with Tenant: ${tenantCnpj} | URL: ${req.url}`);
        } else {
            console.warn(`⚠️ [CONTEXT] Missing X-Tenant-CNPJ header for: ${req.url}`);
        }

        let pool;

        if (tenantCnpj) {
            try {
                // Tenta buscar do cache primeiro
                pool = getTenantPool(tenantCnpj, null);
            } catch (err) {
                // Se não está no cache, mas temos a config no header, tentamos recriar
                if (tenantDbConfigRaw) {
                    try {
                        console.log(`🔄 [CONTEXT] Re-instantiating pool from header for ${tenantCnpj}`);
                        const dbConfig = JSON.parse(tenantDbConfigRaw);
                        pool = getTenantPool(tenantCnpj, dbConfig);
                    } catch (parseErr) {
                        console.error(`❌ [CONTEXT] Failed to parse x-tenant-db-config for ${tenantCnpj}`);
                    }
                } else {
                    console.warn(`⚠️ [CONTEXT] Pool não encontrado para ${tenantCnpj} e nenhuma config fornecida.`);
                }
            }
        }

        // Armazena no contexto da requisição assíncrona
        storage.run(pool, () => {
            req.db = pool; // Disponível em req.db.query
            next();
        });
    };
}

/**
 * Função global que substitui o acesso ao antigo 'pool'
 * Ela sempre retorna o pool do contexto atual da requisição.
 */
function getCurrentPool() {
    return storage.getStore();
}

module.exports = {
    dbContextMiddleware,
    getCurrentPool
};
