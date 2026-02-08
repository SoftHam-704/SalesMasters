import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, 'api');

export const cliIndService = {
    /**
     * Busca condições especiais de um cliente para uma indústria específica
     * @param {number|string} clientCode - Código do cliente
     * @param {number|string} supplierCode - Código da indústria/fornecedor
     * @returns {Promise<{success: boolean, data: object|null}>}
     */
    async getClientConditions(clientCode, supplierCode) {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/cli-ind/${clientCode}/${supplierCode}`)
            );

            if (!response.ok) {
                throw new Error('Failed to fetch client conditions');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching CLI_IND conditions:', error);
            throw error;
        }
    },

    /**
     * Busca descontos específicos por grupo da tabela cli_descpro
     * @param {number|string} clientCode - Código do cliente
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getClientGroupDiscounts(clientCode) {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/clients/${clientCode}/discounts`)
            );

            if (!response.ok) {
                throw new Error('Failed to fetch client group discounts');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching CLI_DESCPRO group discounts:', error);
            throw error;
        }
    },

    /**
     * Busca todos os descontos de grupo da tabela grupo_desc
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getTableGroupDiscounts() {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/group-discounts`)
            );

            if (!response.ok) {
                throw new Error('Failed to fetch table group discounts');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching GRUPO_DESC table discounts:', error);
            throw error;
        }
    }
};
