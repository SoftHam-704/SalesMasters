/**
 * Configuração centralizada de APIs para o SalesMasters.
 * Gerencia URLs de desenvolvimento (localhost) e produção.
 */

// Se estivermos em produção (Vercel/Build), usamos strings vazias ou URLs de ambiente
// Se estivermos em desenvolvimento, usamos os ports padrão
const isProduction = import.meta.env.PROD;

// URL do Backend Node.js (Dashboard, Autenticação)
export const NODE_API_URL = import.meta.env.VITE_API_URL ||
    (isProduction ? 'https://salesmasters.softham.com.br' : 'http://localhost:3005');

// URL do BI Engine Python (Portfólio, Analytics, Metas)
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL ||
    (isProduction ? 'https://salesmasters.softham.com.br/bi-api' : 'http://localhost:8000');

// Helper para montar URLs sem duplicar barras
export const getApiUrl = (base, path) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};
