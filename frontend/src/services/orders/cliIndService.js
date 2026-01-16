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
    }
};
