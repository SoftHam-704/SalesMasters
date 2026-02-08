/**
 * useSmartDiscounts Hook
 * Gerencia descontos inteligentes: Cliente (cli_descpro) e Tabela (grupo_desc)
 */

import { useState, useCallback } from 'react';
import { cliIndService } from '@/services/orders/cliIndService';

export const useSmartDiscounts = () => {
    const [clientDiscounts, setClientDiscounts] = useState([]);
    const [tableGroupDiscounts, setTableGroupDiscounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Busca descontos específicos do cliente
     */
    const fetchClientDiscounts = useCallback(async (clientCode) => {
        if (!clientCode) {
            setClientDiscounts([]);
            return;
        }
        setLoading(true);
        try {
            const response = await cliIndService.getClientGroupDiscounts(clientCode);
            if (response.success) setClientDiscounts(response.data || []);
        } catch (err) {
            console.error('Error fetching client discounts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Busca descontos de grupos da tabela (grupo_desc)
     */
    const fetchTableGroupDiscounts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await cliIndService.getTableGroupDiscounts();
            if (response.success) setTableGroupDiscounts(response.data || []);
        } catch (err) {
            console.error('Error fetching table group discounts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        clientDiscounts,
        tableGroupDiscounts,
        loading,
        error,
        fetchClientDiscounts,
        fetchTableGroupDiscounts
    };
};
