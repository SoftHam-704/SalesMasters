import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, 'api');

export const priceTableService = {
    /**
     * Lista todas as tabelas de preço de uma indústria
     * @param {string} industryCode - Código da indústria
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getByIndustry(industryCode) {
        const encodedIndustry = encodeURIComponent(industryCode);
        const response = await fetch(`${API_BASE_URL}/price-tables/${encodedIndustry}`);
        if (!response.ok) {
            throw new Error('Failed to fetch price tables');
        }
        return response.json();
    },

    /**
     * Busca produtos de uma tabela de preço (paginado)
     * @param {string} industryCode - Código da indústria
     * @param {string} tableName - Nome da tabela
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getProducts(industryCode, tableName) {
        const encodedIndustry = encodeURIComponent(industryCode);
        const encodedTable = encodeURIComponent(tableName);

        // Passamos 'dummy' no path e a tabela real no query param para evitar erros de / e % na URL path
        const response = await fetch(
            `${API_BASE_URL}/products/${encodedIndustry}/dummy?tabela=${encodedTable}`
        );
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        return response.json();
    },

    /**
     * Carrega tabela de preço completa para memtable (todos os produtos)
     * @param {string} industryCode - Código da indústria
     * @param {string} tableName - Nome da tabela
     * @returns {Promise<{success: boolean, data: Array, total: number}>}
     */
    async getProductsFull(industryCode, tableName) {
        const encodedIndustry = encodeURIComponent(industryCode);
        const encodedTable = encodeURIComponent(tableName);

        // Usamos query parameter para a tabela para evitar problemas com / e % na URL path
        const response = await fetch(
            `${API_BASE_URL}/price-tables/${encodedIndustry}/dummy/products-full?tabela=${encodedTable}`
        );
        if (!response.ok) {
            throw new Error('Failed to load price table memtable');
        }
        return response.json();
    },

    /**
     * Busca um produto específico em uma tabela
     * @param {string} industryCode - Código da indústria
     * @param {string} tableName - Nome da tabela
     * @param {string} productCode - Código do produto
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async getProduct(industryCode, tableName, productCode) {
        const encodedIndustry = encodeURIComponent(industryCode);
        const encodedTable = encodeURIComponent(tableName);
        const encodedProduct = encodeURIComponent(productCode);

        // Passamos 'dummy' no path e a tabela real no query param
        const response = await fetch(
            `${API_BASE_URL}/price-tables/${encodedIndustry}/dummy/products/${encodedProduct}?tabela=${encodedTable}`
        );
        if (!response.ok) {
            throw new Error('Failed to fetch product');
        }
        return response.json();
    },
};
