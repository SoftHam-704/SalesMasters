import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
    baseURL: '/api/iris',
});

// Interceptor para injetar o token Iris em todas as chamadas
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('iris_token');
    if (token) {
        config.headers['x-iris-token'] = token;
    }
    return config;
});

export const catalogApi = {
    validateToken: (token?: string) => api.get('/auth/validate', { params: { token } }),
    search: (q: string, industria: number, tabela?: string) => 
        api.get('/catalog/search', { params: { q, industria, tabela } }),
    getOrders: () => api.get('/orders'),
    createQuotation: (data: { industria: number; tabela?: string; observacao?: string; itens: any[] }) => 
        api.post('/quotation', data),
};

export default api;
