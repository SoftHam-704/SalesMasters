import axios from 'axios';

import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';

const instance = axios.create({
    baseURL: getApiUrl(NODE_API_URL, '/api'),
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para injetar headers de Multi-tenant e User ID em cada requisição
instance.interceptors.request.use((config) => {
    const tenantConfigRaw = sessionStorage.getItem('tenantConfig');
    if (tenantConfigRaw) {
        try {
            const tenantConfig = JSON.parse(tenantConfigRaw);
            if (tenantConfig.cnpj) {
                config.headers['x-tenant-cnpj'] = tenantConfig.cnpj;
            }
            if (tenantConfig.dbConfig) {
                // Enviamos o config completo apenas para garantir que o backend 
                // consiga criar o pool se ele ainda não existir no cache.
                config.headers['x-tenant-db-config'] = JSON.stringify(tenantConfig.dbConfig);
            }
        } catch (e) {
            console.error('Erro ao processar tenantConfig do localStorage', e);
        }
    }

    // Injetar User ID para filtros de permissão no backend
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
        try {
            const user = JSON.parse(userRaw);
            if (user.codigo || user.id) {
                config.headers['x-user-id'] = user.codigo || user.id;
            }
            if (user.empresa_id) {
                config.headers['x-empresa-id'] = user.empresa_id;
            }
        } catch (e) {
            console.error('Erro ao processar user no interceptor axios', e);
        }
    }

    // Injetar Token de Sessão (Equipamento Heartbeat)
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
        config.headers['x-session-token'] = sessionToken;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default instance;
