const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

/**
 * Middleware para capturar o pool de banco de dados baseado no Tenant
 */
function dbContextMiddleware(getTenantPool) {
    return (req, res, next) => {
        // 1. Extrai apenas o CNPJ do header (a configuração vem do cache, não do frontend)
        const tenantCnpj = req.headers['x-tenant-cnpj'];

        if (tenantCnpj) {
            console.log(`📡 [CONTEXT] Request with Tenant: ${tenantCnpj} | URL: ${req.url}`);
        } else {
            console.warn(`⚠️ [CONTEXT] Missing X-Tenant-CNPJ header for: ${req.url}`);
        }

        let pool;

        if (tenantCnpj) {
            try {
                // Busca o pool do cache. NÃO usa config do header para evitar dados desatualizados.
                // O pool correto é criado durante o login com dados frescos do banco Master.
                pool = getTenantPool(tenantCnpj, null);
            } catch (err) {
                // Pool não existe no cache - provavelmente usuário não está logado
                console.warn(`⚠️ [CONTEXT] Pool não encontrado para ${tenantCnpj}. Usuário pode precisar relogar.`);
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
