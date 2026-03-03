import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import './SalesPerformanceTable.css';
import { MetasIndustriasTable } from './MetasIndustriasTable';

import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

export const SalesPerformanceTable = ({ selectedYear, selectedMonth, selectedIndustry }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'total_value_current', direction: 'desc' });
    const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'metas'

    useEffect(() => {
        fetchData();
    }, [selectedYear, selectedMonth, selectedIndustry]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({ ano: selectedYear });
            if (selectedMonth) {
                params.append('mes', selectedMonth);
            }
            if (selectedIndustry) {
                params.append('for_codigo', selectedIndustry);
            }

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/sales-performance?${params}`);
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setData(result.data || []);
            } else {
                setData([]);
                setError(result.message);
            }
        } catch (err) {
            setError('Erro ao carregar dados de performance');
            console.error('Error fetching sales performance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!data || !data.length) return [];

        const sorted = [...data].sort((a, b) => {
            const aVal = parseFloat(a[sortConfig.key]) || 0;
            const bVal = parseFloat(b[sortConfig.key]) || 0;

            if (sortConfig.direction === 'asc') {
                return aVal - bVal;
            }
            return bVal - aVal;
        });

        return sorted;
    }, [data, sortConfig]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }).format(value || 0);
    };

    const formatQuantity = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(value || 0));
    };

    const formatPercent = (value) => {
        const num = parseFloat(value) || 0;
        return `${num.toFixed(2)}%`;
    };

    const renderTrendIndicator = (percent) => {
        const value = parseFloat(percent) || 0;
        if (value > 0) {
            return (
                <span className="trend-indicator positive">
                    {formatPercent(value)} <TrendingUp size={14} />
                </span>
            );
        } else if (value < 0) {
            return (
                <span className="trend-indicator negative">
                    {formatPercent(value)} <TrendingDown size={14} />
                </span>
            );
        }
        return <span className="trend-indicator neutral">{formatPercent(value)}</span>;
    };

    // Tab styles helper
    const tabStyle = (id) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 14px',
        fontSize: '12px',
        fontWeight: '700',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: activeTab === id ? 'var(--accent-primary, #6366f1)' : 'transparent',
        color: activeTab === id ? '#fff' : 'var(--text-secondary)',
    });

    return (
        <motion.div
            className="sales-performance-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Card Header com Abas */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover, #f1f5f9)', padding: '3px', borderRadius: '8px' }}>
                    <button style={tabStyle('performance')} onClick={() => setActiveTab('performance')}>
                        <Users size={13} />
                        Performance
                    </button>
                    <button style={tabStyle('metas')} onClick={() => setActiveTab('metas')}>
                        <Target size={13} />
                        Metas
                    </button>
                </div>
                {activeTab === 'performance' && (
                    <span className="data-count">{data.length} vendedores</span>
                )}
            </div>

            {/* ABA: Performance de Vendedores */}
            {activeTab === 'performance' && (
                <>
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Carregando dados...</p>
                        </div>
                    )}
                    {!loading && error && (
                        <div className="error-state"><p>{error}</p></div>
                    )}
                    {!loading && !error && (!data || !data.length) && (
                        <div className="empty-state">
                            <Users size={48} />
                            <p>Nenhum dado disponível para o período selecionado</p>
                        </div>
                    )}
                    {!loading && !error && data && data.length > 0 && (
                        <div className="table-container">
                            <table className="performance-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('ven_nome')} className="sortable">
                                            Colaborador
                                        </th>
                                        <th onClick={() => handleSort('total_value_current')} className="sortable text-right">
                                            Valores
                                        </th>
                                        <th onClick={() => handleSort('mom_value_percent')} className="sortable text-center">
                                            MoM (R$)
                                        </th>
                                        <th onClick={() => handleSort('total_qty_current')} className="sortable text-right">
                                            Qtd
                                        </th>
                                        <th onClick={() => handleSort('mom_qty_percent')} className="sortable text-center">
                                            MoM (qtd)
                                        </th>
                                        <th onClick={() => handleSort('clients_previous')} className="sortable text-center">
                                            Clientes (M-1)
                                        </th>
                                        <th onClick={() => handleSort('clients_current')} className="sortable text-center">
                                            Clientes (M)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map((seller, index) => (
                                        <motion.tr
                                            key={seller.ven_codigo}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                        >
                                            <td className="seller-name">{seller.ven_nome}</td>
                                            <td className="text-right value-cell">
                                                {formatCurrency(seller.total_value_current)}
                                            </td>
                                            <td className="text-center">
                                                {renderTrendIndicator(seller.mom_value_percent)}
                                            </td>
                                            <td className="text-right">
                                                {formatQuantity(seller.total_qty_current)}
                                            </td>
                                            <td className="text-center">
                                                {renderTrendIndicator(seller.mom_qty_percent)}
                                            </td>
                                            <td className="text-center client-count">
                                                {seller.clients_previous}
                                            </td>
                                            <td className="text-center client-count">
                                                {seller.clients_current}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ABA: Metas por Indústria */}
            {activeTab === 'metas' && (
                <MetasIndustriasTable
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    selectedIndustry={selectedIndustry}
                />
            )}
        </motion.div>
    );
};
