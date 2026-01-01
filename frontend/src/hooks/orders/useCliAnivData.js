/**
 * useCliAnivData Hook
 * Custom hook para gerenciar dados de contatos/compradores de clientes
 */

import { useState } from 'react';
import { cliAnivService } from '@/services/orders/cliAnivService';

export const useCliAnivData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Busca comprador por cliente (função que começa com "COMPRA")
     * @param {number|string} clientCode - Código do cliente
     * @returns {Promise<object|null>} Dados do comprador ou null
     */
    const fetchBuyer = async (clientCode) => {
        if (!clientCode) {
            console.warn('⚠️  [useCliAnivData] Cliente não informado');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 [useCliAnivData] Buscando comprador para cliente ${clientCode}`);

            const response = await cliAnivService.getBuyerByClient(clientCode);

            if (response.success) {
                setData(response.data);

                if (response.data) {
                    console.log('✅ [useCliAnivData] Comprador encontrado:', response.data);
                } else {
                    console.log('ℹ️  [useCliAnivData] Nenhum comprador encontrado');
                }

                return response.data;
            } else {
                throw new Error(response.message || 'Erro ao buscar comprador');
            }
        } catch (err) {
            console.error('❌ [useCliAnivData] Erro:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Limpa os dados armazenados
     */
    const clearData = () => {
        setData(null);
        setError(null);
    };

    return {
        data,
        loading,
        error,
        fetchBuyer,
        clearData
    };
};
