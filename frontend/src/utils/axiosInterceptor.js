import axios from 'axios';

/**
 * Interceptor global para o Axios
 * Injeta automaticamente os headers de Multi-tenant (X-Tenant-CNPJ)
 */

axios.interceptors.request.use(
    (config) => {
        const url = config.url || '';

        // Apenas intercepta requisições para o nosso backend (Node, Python BI)
        if (url.includes('salesmasters.softham.com.br') || url.includes('localhost') || url.startsWith('/api')) {
            // Tenta pegar o tenant do sessionStorage
            const tenantConfigRaw = sessionStorage.getItem('tenantConfig');
            const sessionToken = localStorage.getItem('session_token');

            if (sessionToken) {
                config.headers['x-access-token'] = sessionToken;
            }

            if (tenantConfigRaw) {
                try {
                    const tenantConfig = JSON.parse(tenantConfigRaw);
                    if (tenantConfig.cnpj) {
                        config.headers['x-tenant-cnpj'] = tenantConfig.cnpj;
                    }

                    // Se tiver dbConfig (estrutura nova/padrão) ou se for a estrutura flat (legada/fallback)
                    if (tenantConfig.dbConfig) {
                        config.headers['x-tenant-db-config'] = JSON.stringify(tenantConfig.dbConfig);
                    } else if (tenantConfig.host && tenantConfig.database && tenantConfig.user) {
                        // Estrutura FLAT (Fallback) - enviamos o objeto inteiro que contém os campos de conexão
                        config.headers['x-tenant-db-config'] = tenantConfigRaw;
                    }
                } catch (e) {
                    console.error('Erro ao processar tenantConfig no interceptor axios', e);
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

console.log('✅ [AXIOS INTERCEPTOR] Ativado com sucesso.');
