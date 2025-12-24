/**
 * Price Table Service - Gerenciamento de Tabelas de Preço
 * Responsável por todas as chamadas de API relacionadas a tabelas de preço
 */

const API_BASE_URL = 'http://localhost:3005/api';

export const priceTableService = {
    /**
     * Lista todas as tabelas de preço de uma indústria
     * @param {string} industryCode - Código da indústria
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getByIndustry(industryCode) {
        const response = await fetch(`${API_BASE_URL}/price-tables/${industryCode}`);
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
        const response = await fetch(
            `${API_BASE_URL}/products/${industryCode}/${tableName}`
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
        const response = await fetch(
            `${API_BASE_URL}/price-tables/${industryCode}/${tableName}/products-full`
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
        const response = await fetch(
            `${API_BASE_URL}/price-tables/${industryCode}/${tableName}/products/${productCode}`
        );
        if (!response.ok) {
            throw new Error('Failed to fetch product');
        }
        return response.json();
    },
};
