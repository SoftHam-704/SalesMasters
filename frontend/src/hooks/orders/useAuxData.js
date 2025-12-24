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
        loadAll();
    }, [industryCode]);

    const loadAll = async () => {
        console.log('🔄 [useAuxData] Starting to load data, industryCode:', industryCode);
        setLoading(true);
        setError(null);

        try {
            const promises = [
                auxDataService.getClients('A'),
                auxDataService.getCarriers(),
                auxDataService.getSellers(),
            ];

            // Adiciona busca de tabelas se indústria fornecida
            if (industryCode) {
                promises.push(priceTableService.getByIndustry(industryCode));
            }

            const results = await Promise.all(promises);
            console.log('✅ [useAuxData] Results received:', {
                clients: results[0]?.data?.length || 0,
                carriers: results[1]?.data?.length || 0,
                sellers: results[2]?.data?.length || 0,
                priceTables: results[3]?.data?.length || 0
            });

            setClients(results[0].success ? results[0].data : []);
            setCarriers(results[1].success ? results[1].data : []);
            setSellers(results[2].success ? results[2].data : []);

            if (results[3]) {
                setPriceTables(results[3].success ? (results[3].data || []) : []);
            }
        } catch (err) {
            console.error('❌ [useAuxData] Error loading auxiliary data:', err);
            setError(err.message);
            toast.error('Erro ao carregar dados auxiliares');
        } finally {
            setLoading(false);
        }
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
