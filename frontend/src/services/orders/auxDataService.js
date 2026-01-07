import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, '/api');

export const auxDataService = {
    /**
     * Lista clientes ativos
     * @param {string} status - Status do cliente ('A' = Ativo, 'I' = Inativo)
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getClients(status = 'A', pesquisa = '') {
        const response = await fetch(`${API_BASE_URL}/aux/clientes?status=${status}&pesquisa=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }
        return response.json();
    },

    /**
     * Lista todas as transportadoras
     */
    async getCarriers(pesquisa = '') {
        const response = await fetch(`${API_BASE_URL}/v2/carriers?pesquisa=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Failed to fetch carriers');
        }
        return response.json();
    },

    /**
     * Lista tabelas de preço por indústria
     */
    async getPriceTables(industryCode, pesquisa = '') {
        const response = await fetch(`${API_BASE_URL}/aux/price-tables?for_codigo=${industryCode}&pesquisa=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Failed to fetch price tables');
        }
        return response.json();
    },

    /**
     * Lista vendedores ativos
     */
    async getSellers(pesquisa = '') {
        const response = await fetch(`${API_BASE_URL}/aux/vendedores?pesquisa=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Failed to fetch sellers');
        }
        return response.json();
    },

    /**
     * Carrega todos os dados auxiliares de uma vez
     * @param {string} industryCode - Código da indústria (para tabelas de preço)
     * @param {string} status - Status dos clientes
     * @returns {Promise<{clients: Array, carriers: Array, sellers: Array, priceTables: Array}>}
     */
    async loadAll(industryCode = null, status = 'A') {
        try {
            const promises = [
                this.getClients(status),
                this.getCarriers(),
                this.getSellers(),
            ];

            // Adiciona busca de tabelas de preço se indústria fornecida
            if (industryCode) {
                promises.push(this.getPriceTables(industryCode));
            }

            const results = await Promise.all(promises);

            return {
                clients: results[0].success ? results[0].data : [],
                carriers: results[1].success ? results[1].data : [],
                sellers: results[2].success ? results[2].data : [],
                priceTables: results[3] && results[3].success ? results[3].data : [],
            };
        } catch (error) {
            console.error('Error loading auxiliary data:', error);
            throw error;
        }
    },
};
