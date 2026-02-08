import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, 'api');

export const orderService = {
    /**
     * Busca o próximo número de pedido disponível
     * @returns {Promise<{success: boolean, data: {formatted_number: string, ped_numero: number}}>}
     */
    async getNextNumber(initials) {
        const url = initials
            ? `${API_BASE_URL}/orders/next-number?initials=${initials}`
            : `${API_BASE_URL}/orders/next-number`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to get next order number');
        }
        return response.json();
    },

    /**
     * Salva um pedido (cria novo ou atualiza existente)
     * @param {Object} orderData - Dados do pedido
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async save(orderData) {
        // Usa o flag explícito _isPersisted se disponível, caso contrário cai no fallback de detecção pelo ped_pedido
        const isPersisted = orderData.hasOwnProperty('_isPersisted')
            ? orderData._isPersisted
            : (orderData.ped_pedido && orderData.ped_pedido !== '(Novo)');

        const isEditing = !!isPersisted;
        const url = isEditing
            ? `${API_BASE_URL}/orders/${orderData.ped_pedido}`
            : `${API_BASE_URL}/orders`;

        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save order');
        }

        return response.json();
    },

    /**
     * Busca um pedido por ID
     * @param {string} orderId - ID do pedido
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async getById(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch order');
        }
        return response.json();
    },

    /**
     * Busca itens de um pedido (resumo)
     * @param {string} orderId - ID do pedido
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getItems(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`);
        if (!response.ok) {
            throw new Error('Failed to fetch order items');
        }
        return response.json();
    },

    /**
     * Deleta um pedido
     * @param {string} orderId - ID do pedido
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async delete(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete order');
        }

        return response.json();
    },

    /**
     * Lista pedidos com filtros
     * @param {Object} filters - Filtros de busca
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async list(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_BASE_URL}/orders${queryParams ? `?${queryParams}` : ''}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        return response.json();
    },
};
