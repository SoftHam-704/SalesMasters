import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, 'api');

export const cliAnivService = {
    /**
     * Busca comprador de um cliente pela função "COMPRA%"
     * @param {number|string} clientCode - Código do cliente
     * @returns {Promise<{success: boolean, data: object|null}>}
     */
    async getBuyerByClient(clientCode) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/cli-aniv/buyer/${clientCode}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch buyer information');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching CLI_ANIV buyer:', error);
            throw error;
        }
    }
};
