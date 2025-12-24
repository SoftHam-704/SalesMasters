/**
 * Order Item Service - Gerenciamento de Itens de Pedido
 * Responsável por todas as chamadas de API relacionadas a itens de pedidos
 */

const API_BASE_URL = 'http://localhost:3005/api';

export const orderItemService = {
    /**
     * Busca todos os itens de um pedido
     * @param {string} orderId - ID do pedido
     * @returns {Promise<{success: boolean, data: Array}>}
     */
    async getByOrderId(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`);
        if (!response.ok) {
            throw new Error('Failed to fetch order items');
        }
        return response.json();
    },

    /**
     * Salva um item (cria novo ou atualiza existente)
     * @param {Object} itemData - Dados do item
     * @returns {Promise<{success: boolean, data: Object, message: string}>}
     */
    async save(itemData) {
        const isEditing = itemData.ite_id;
        const url = isEditing
            ? `${API_BASE_URL}/order-items/${itemData.ite_id}`
            : `${API_BASE_URL}/order-items`;

        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save item');
        }

        return response.json();
    },

    /**
     * Deleta um item
     * @param {number} itemId - ID do item
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async delete(itemId) {
        const response = await fetch(`${API_BASE_URL}/order-items/${itemId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete item');
        }

        return response.json();
    },

    /**
     * Sincroniza totais do pedido após alterações nos itens
     * @param {string} orderId - ID do pedido
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async syncTotals(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/sync-totals`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to sync order totals');
        }

        return response.json();
    },

    /**
     * Busca um item específico por ID
     * @param {number} itemId - ID do item
     * @returns {Promise<{success: boolean, data: Object}>}
     */
    async getById(itemId) {
        const response = await fetch(`${API_BASE_URL}/order-items/${itemId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch item');
        }
        return response.json();
    },
};
