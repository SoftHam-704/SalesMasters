import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Target, UserPlus, RefreshCcw, Briefcase, ChevronDown, ChevronUp, Award } from 'lucide-react';
import './SalesPerformanceTable.css';

import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

export const SalesPerformanceTable = ({ selectedYear, selectedMonth, selectedIndustry, limit = null }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'total_value_current', direction: 'desc' });
    const [expandedSeller, setExpandedSeller] = useState(null);

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
            setError('Erro ao carregar ranking de performance');
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

        return limit ? sorted.slice(0, limit) : sorted;
    }, [data, sortConfig, limit]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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

    return (
        <motion.div
            className="sales-performance-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="card-body">
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Carregando ranking...</p>
                    </div>
                )}
                {!loading && error && (
                    <div className="error-state"><p>{error}</p></div>
                )}
                {!loading && !error && (!data || !data.length) && (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>Nenhum dado disponível para o ranking</p>
                    </div>
                )}
                {!loading && !error && data && data.length > 0 && (
                    <div className="ranking-header-bar">
                        <div className="flex items-center gap-2">
                            <Award className="text-amber-500" size={20} />
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">Ranking de Performance</h3>
                        </div>
                        <div className="count-badge-header">
                            {data.length} vendedores
                        </div>
                    </div>
                )}
                {!loading && !error && data && data.length > 0 && (
                    <div className="table-responsive">
                        <table className="performance-ranking-table">
                            <thead>
                                <tr>
                                    <th className="sticky-col">COLABORADOR</th>
                                    <th className="text-right">VALORES</th>
                                    <th className="text-center">MoM (R$)</th>
                                    <th className="text-center">MoM (%)</th>
                                    <th className="text-center">CLIENTES (M-1)</th>
                                    <th className="text-center">NOVOS CLIENTES</th>
                                    <th className="text-center">REATIVADOS</th>
                                    <th className="text-center">NOVOS SKU</th>
                                    <th className="text-right">DETALHE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((seller, index) => {
                                    const momValue = seller.total_value_current - seller.total_value_previous;
                                    const momPercent = seller.mom_value_percent;

                                    return (
                                        <tr key={seller.ven_codigo}>
                                            <td className="seller-name-cell sticky-col">
                                                <div className="flex flex-col">
                                                    <span className="name">{seller.ven_nome}</span>
                                                    <span className="rank">#{index + 1} Rank</span>
                                                </div>
                                            </td>
                                            <td className="text-right font-bold text-stone-900">
                                                {formatCurrency(seller.total_value_current)}
                                            </td>
                                            <td className="text-center">
                                                <div className={`mom-badge ${momValue >= 0 ? 'up' : 'down'}`}>
                                                    {momValue >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {formatCurrency(Math.abs(momValue))}
                                                </div>
                                            </td>
                                            <td className={`text-center font-bold ${momPercent >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {momPercent >= 0 ? '+' : ''}{parseFloat(momPercent || 0).toFixed(2)}%
                                            </td>
                                            <td className="text-center font-medium text-stone-600">
                                                {seller.clients_previous || 0}
                                            </td>
                                            <td className="text-center">
                                                <span className={`count-badge new ${seller.new_clients > 0 ? 'active' : ''}`}>
                                                    {seller.new_clients || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`count-badge reactivated ${seller.reactivated_clients > 0 ? 'active' : ''}`}>
                                                    {seller.reactivated_clients || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="sku-count">{seller.new_skus_count || 0} SKUs</span>
                                                    <span className="sku-value">{formatCurrency(seller.new_skus_value)}</span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button className="btn-detail">
                                                    Ver detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="totals-row">
                                    <td className="sticky-col">Totals</td>
                                    <td className="text-right font-bold">
                                        {formatCurrency(data.reduce((acc, s) => acc + (parseFloat(s.total_value_current) || 0), 0))}
                                    </td>
                                    <td className="text-center">
                                        <div className={`mom-badge ${data.reduce((acc, s) => acc + (parseFloat(s.total_value_current) - parseFloat(s.total_value_previous)), 0) >= 0 ? 'up' : 'down'}`}>
                                            {formatCurrency(data.reduce((acc, s) => acc + (parseFloat(s.total_value_current) - parseFloat(s.total_value_previous)), 0))}
                                        </div>
                                    </td>
                                    <td className="text-center font-bold">
                                        {(() => {
                                            const totalCurrent = data.reduce((acc, s) => acc + (parseFloat(s.total_value_current) || 0), 0);
                                            const totalPrevious = data.reduce((acc, s) => acc + (parseFloat(s.total_value_previous) || 0), 0);
                                            if (totalPrevious === 0) return totalCurrent > 0 ? '+100.00%' : '0.00%';
                                            const pct = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
                                            return `${pct >= 0 ? '+' : ''}${parseFloat(pct || 0).toFixed(2)}%`;
                                        })()}
                                    </td>
                                    <td className="text-center">
                                        {data.reduce((acc, s) => acc + (parseInt(s.clients_previous) || 0), 0)}
                                    </td>
                                    <td className="text-center">
                                        {data.reduce((acc, s) => acc + (parseInt(s.new_clients) || 0), 0)}
                                    </td>
                                    <td className="text-center">
                                        {data.reduce((acc, s) => acc + (parseInt(s.reactivated_clients) || 0), 0)}
                                    </td>
                                    <td className="text-center">
                                        {data.reduce((acc, s) => acc + (parseInt(s.new_skus_count) || 0), 0)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
