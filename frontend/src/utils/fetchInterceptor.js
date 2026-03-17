/**
 * Interceptor global para o window.fetch
 * Ele injeta automaticamente os headers de Multi-tenant (X-Tenant-CNPJ)
 * em todas as requisições para o backend local.
 */
const originalFetch = window.fetch;

window.fetch = async (...args) => {
    let [url, config] = args;

    // Apenas intercepta requisições para o nosso backend (Node: 3005, Python BI: 8000)
    if (typeof url === 'string' && (url.includes('salesmasters.softham.com.br') || url.includes('localhost') || url.startsWith('/api'))) {
        config = config || {};
        config.headers = config.headers || {};

        // Se for FormData, o browser cuida do Content-Type, não devemos sobrescrever manualmente para JSON
        const isFormData = config.body instanceof FormData;
        if (!isFormData && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        // Tenta pegar o tenant do sessionStorage
        const tenantConfigRaw = sessionStorage.getItem('tenantConfig');
        const sessionToken = localStorage.getItem('session_token');
        const userRaw = sessionStorage.getItem('user');

        if (sessionToken) {
            config.headers['x-access-token'] = sessionToken;
        }

        if (userRaw) {
            try {
                const user = JSON.parse(userRaw);
                if (user.codigo || user.id) {
                    config.headers['x-user-id'] = user.codigo || user.id;
                }
            } catch (e) {
                console.error('Erro ao processar user no interceptor fetch', e);
            }
        }

        if (tenantConfigRaw) {
            try {
                const tenantConfig = JSON.parse(tenantConfigRaw);
                if (tenantConfig.cnpj) {
                    // Normaliza CNPJ (remove pontos e traços se necessário, mas o backend espera o que foi gravado)
                    config.headers['x-tenant-cnpj'] = tenantConfig.cnpj;

                    // Log para debug (opcional, manter apenas se necessário para Troubleshooting)
                    // console.log(`🚀 [FETCH] Tenant: ${tenantConfig.cnpj} | URL: ${url}`);
                }

                if (tenantConfig.dbConfig) {
                    config.headers['x-tenant-db-config'] = JSON.stringify(tenantConfig.dbConfig);
                } else if (tenantConfig.host && tenantConfig.database && tenantConfig.user) {
                    // Estrutura FLAT (Fallback) - enviamos o objeto inteiro que contém os campos de conexão
                    config.headers['x-tenant-db-config'] = tenantConfigRaw;
                }
            } catch (e) {
                console.error('Erro ao processar tenantConfig no interceptor fetch', e);
            }
        }
    }

    return originalFetch(url, config);
};

console.log('✅ [FETCH INTERCEPTOR] Ativado com sucesso.');
