/**
 * CLI_IND Service - Gerenciamento de Condições Especiais por Cliente
 * Responsável por chamadas de API relacionadas a condições especiais cli_ind
 */

const API_BASE_URL = 'http://localhost:3005/api';

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
                `${API_BASE_URL}/cli-ind/${clientCode}/${supplierCode}`
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
