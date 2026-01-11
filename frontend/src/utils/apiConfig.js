/**
 * Configuração centralizada de APIs para o SalesMasters.
 * Gerencia URLs de desenvolvimento (localhost) e produção.
 */

// Se estivermos em produção (Vercel/Build), usamos strings vazias ou URLs de ambiente
// Se estivermos em desenvolvimento, usamos os ports padrão
const isProduction = import.meta.env.PROD;

// URL do Backend Node.js (Dashboard, Autenticação)
// Em DEV (localhost) usa a porta 8080 (igual Produção). Em PROD usa a URL da Cloud.
export const NODE_API_URL = isProduction
    ? 'https://salesmasters.softham.com.br'
    : 'http://localhost:8080';

// URL do BI Engine Python (Portfólio, Analytics, Metas)
// Usando o Proxy (/bi-api) configurado no server.js
export const PYTHON_API_URL = isProduction
    ? 'https://salesmasters.softham.com.br/bi-api'
    : (import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8080/bi-api');

// Helper para montar URLs sem duplicar barras
export const getApiUrl = (base, path) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};
