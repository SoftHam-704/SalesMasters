/**
 * Configuração centralizada de APIs para o Backend SalesMasters.
 * Versão Node.js (CommonJS) do apiConfig do frontend.
 */

const isProduction = process.env.NODE_ENV === 'production';

// URL do Backend Node.js
const NODE_API_URL = isProduction
    ? 'https://salesmasters.softham.com.br'
    : 'http://localhost:8080';

// URL do BI Engine Python
const PYTHON_API_URL = isProduction
    ? 'https://salesmasters.softham.com.br/bi-api'
    : (process.env.PYTHON_API_URL || 'http://localhost:8080/bi-api');

// Helper para montar URLs sem duplicar barras
function getApiUrl(base, path) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}

module.exports = {
    NODE_API_URL,
    PYTHON_API_URL,
    getApiUrl
};
