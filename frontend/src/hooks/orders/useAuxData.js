/**
 * useAuxData Hook
 * Gerencia dados auxiliares (clientes, vendedores, transportadoras, tabelas)
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { auxDataService } from '@/services/orders/auxDataService';
import { priceTableService } from '@/services/orders/priceTableService';

export function useAuxData(industryCode = null) {
    const [clients, setClients] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [priceTables, setPriceTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Inicializa dados básicos que não dependem da indústria (apenas uma vez)
        loadBaseData();
    }, []);

    useEffect(() => {
        // Carrega tabelas de preço apenas se a indústria mudar
        if (industryCode) {
            loadPriceTables();
        } else {
            setPriceTables([]);
        }
    }, [industryCode]);

    const loadBaseData = async () => {
        console.log('🔄 [useAuxData] Loading base data (clients, carriers, sellers)...');
        setLoading(true);
        try {
            const [clientsRes, carriersRes, sellersRes] = await Promise.all([
                auxDataService.getClients('A'),
                auxDataService.getCarriers(),
                auxDataService.getSellers(),
            ]);

            // Handle both response formats: direct array or { success: true, data: [...] }
            const getProcessedData = (res) => {
                if (Array.isArray(res)) {
                    return res;
                }
                return res?.success ? (res.data || []) : [];
            };

            setClients(getProcessedData(clientsRes));
            setCarriers(getProcessedData(carriersRes));
            setSellers(getProcessedData(sellersRes));

            console.log('✅ [useAuxData] Base data loaded:', {
                clients: getProcessedData(clientsRes)?.length || 0,
                carriers: getProcessedData(carriersRes)?.length || 0,
                sellers: getProcessedData(sellersRes)?.length || 0
            });
        } catch (err) {
            console.error('❌ [useAuxData] Error loading base data:', err);
            toast.error('Erro ao carregar dados básicos');
        } finally {
            setLoading(false);
        }
    };

    const loadPriceTables = async () => {
        console.log('🔄 [useAuxData] Loading price tables for industry:', industryCode);
        try {
            const res = await priceTableService.getByIndustry(industryCode);
            setPriceTables(res.success ? (res.data || []) : []);
            console.log('✅ [useAuxData] Price tables loaded:', res.data?.length || 0);
        } catch (err) {
            console.error('❌ [useAuxData] Error loading price tables:', err);
        }
    };

    const loadAll = async () => {
        await Promise.all([loadBaseData(), loadPriceTables()]);
    };



    return {
        clients,
        carriers,
        sellers,
        priceTables,
        loading,
        error,
        reload: loadAll,
    };
}
