/**
 * usePriceTable Hook
 * Gerencia a memtable de tabela de preços
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { priceTableService } from '@/services/orders/priceTableService';

export function usePriceTable(industryCode, tableName) {
    const [memtable, setMemtable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!industryCode || !tableName || tableName === '') {
            setMemtable([]);
            return;
        }

        loadMemtable();
    }, [industryCode, tableName]);

    const loadMemtable = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log(`📋 [MEMTABLE] Carregando tabela: ${tableName}`);

            const data = await priceTableService.getProductsFull(industryCode, tableName);

            if (data.success) {
                setMemtable(data.data);
                console.log(`✅ [MEMTABLE] Carregados ${data.data.length} produtos`);
                toast.success(`Tabela carregada: ${data.data.length} produtos`);
            }
        } catch (err) {
            console.error('❌ [MEMTABLE] Erro:', err);
            setError(err.message);
            setMemtable([]);
            toast.error('Erro ao carregar tabela de preços');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Busca produtos na memtable
     * @param {string} searchTerm - Termo de busca
     * @returns {Array} Produtos filtrados
     */
    const searchProducts = (searchTerm) => {
        if (!searchTerm) return memtable;

        const term = searchTerm.toLowerCase();
        return memtable.filter(
            product =>
                (product.pro_codprod || product.pro_codigo)?.toLowerCase().includes(term) ||
                (product.pro_nome || product.pro_descricao)?.toLowerCase().includes(term) ||
                product.pro_conversao?.toLowerCase().includes(term) ||
                product.pro_codigooriginal?.toLowerCase().includes(term) ||
                product.pro_comple?.toLowerCase().includes(term)
        );
    };

    /**
     * Busca um produto específico por código (vários tipos de código)
     */
    const findProduct = (productCode) => {
        if (!productCode) return null;
        const code = String(productCode).toUpperCase();
        return memtable.find(p =>
            String(p.pro_codprod).toUpperCase() === code ||
            String(p.pro_conversao).toUpperCase() === code ||
            String(p.pro_codigooriginal).toUpperCase() === code
        ) || null;
    };

    return {
        memtable,
        loading,
        error,
        reload: loadMemtable,
        searchProducts,
        findProduct,
    };
}
