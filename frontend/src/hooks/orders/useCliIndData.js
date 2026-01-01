/**
 * useCliIndData Hook
 * Custom hook para gerenciar dados de condições especiais CLI_IND
 */

import { useState } from 'react';
import { cliIndService } from '@/services/orders/cliIndService';

export const useCliIndData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Busca condições especiais por cliente e indústria
     * @param {number|string} clientCode - Código do cliente
     * @param {number|string} supplierCode - Código da indústria
     * @returns {Promise<object|null>} Condições especiais ou null
     */
    const fetchConditions = async (clientCode, supplierCode) => {
        if (!clientCode || !supplierCode) {
            console.warn('⚠️  [useCliIndData] Cliente ou indústria não informados');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 [useCliIndData] Buscando condições para cliente ${clientCode} + indústria ${supplierCode}`);

            const response = await cliIndService.getClientConditions(clientCode, supplierCode);

            if (response.success) {
                setData(response.data);

                if (response.data) {
                    console.log('✅ [useCliIndData] Condições encontradas:', response.data);
                } else {
                    console.log('ℹ️  [useCliIndData] Nenhuma condição especial para este cliente');
                }

                return response.data;
            } else {
                throw new Error(response.message || 'Erro ao buscar condições');
            }
        } catch (err) {
            console.error('❌ [useCliIndData] Erro:', err);
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
        fetchConditions,
        clearData
    };
};
