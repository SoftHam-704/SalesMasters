import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../lib/axios';
import {
    AlertTriangle, TrendingUp, TrendingDown, Target, Zap,
    ArrowRight, UserCheck, Package, DollarSign, BarChart2,
    Calendar, Clock, CheckCircle, ChevronRight, Info,
    ArrowUpRight, ArrowDownRight, LayoutDashboard, ListTodo, Activity
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../../../utils/formatters';
import PortfolioAnalysis from '../PortfolioAnalysis';
import InsightsCard from '../../../components/InsightsCard';
import PriorityActions from '../../../components/PriorityActions';
import CommercialEfficiency from '../../../components/CommercialEfficiency';
import CustomerComparison from '../../../components/CustomerComparison';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

// Mapping months to numeric strings for API calls
const MONTHS_MAP = {
    'Todos': 'Todos',
    'Janeiro': '01',
    'Fevereiro': '02',
    'Março': '03',
    'Abril': '04',
    'Maio': '05',
    'Junho': '06',
    'Julho': '07',
    'Agosto': '08',
    'Setembro': '09',
    'Outubro': '10',
    'Novembro': '11',
    'Dezembro': '12'
};

const AnalyticsTab = ({ filters }) => {
    // UI States - viewMode removed as per request

    // Data States
    const [alerts, setAlerts] = useState({ lost_clients: [], dead_stock_count: 0, dead_stock_value: 0 });
    const [kpis, setKpis] = useState(null);
    const [abcData, setAbcData] = useState([]);
    const [clientVariations, setClientVariations] = useState([]);
    const [aiSummary, setAiSummary] = useState(null);
    const [advancedInsights, setAdvancedInsights] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);

    // Comparison Tool States
    const [refClientId, setRefClientId] = useState('');
    const [targetClientId, setTargetClientId] = useState('');
    const [comparisonData, setComparisonData] = useState(null);

    // Loading States
    const [loading, setLoading] = useState(true);
    const [compLoading, setCompLoading] = useState(false);

    // Fetch Dashboard Data
    useEffect(() => {
        if (!filters || !filters.ano) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/analytics/full-tab');
                const res = await axios.get(url, {
                    params: {
                        ano: filters.ano,
                        mes: filters.mes,
                        industryId: filters.industria === 'Todos' ? null : filters.industria
                    }
                });

                const data = res.data;

                setAlerts(data.alerts || { lost_clients: [], dead_stock_count: 0, dead_stock_value: 0 });
                setKpis(data.kpis || {});
                setAbcData(data.portfolio_abc || []);
                setClientVariations(data.client_variations || []);
                setAdvancedInsights(data.advanced_insights || []);

                // Fetch filter options separately if needed, but for now we focus on analytics
                const filtersUrl = getApiUrl(PYTHON_API_URL, '/api/dashboard/filters-options');
                const clientsRes = await axios.get(filtersUrl);
                setClientOptions(clientsRes.data?.clients || []);
            } catch (error) {
                console.error("[AnalyticsTab] Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters.ano, filters.mes, filters.industria]);

    const handleCompare = async () => {
        if (!refClientId || !targetClientId) return;
        setCompLoading(true);
        try {
            const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/analytics/client-comparison');
            const res = await axios.get(url, {
                params: { ref_client: refClientId, target_client: targetClientId }
            });
            setComparisonData(res.data);
        } catch (error) {
            console.error("Error fetching comparison:", error);
        } finally {
            setCompLoading(false);
        }
    };
    const totalCatalogItems = abcData.reduce((acc, curr) => acc + curr.qtd_itens, 0);

    if (loading) return (
        <div className="p-10 text-center flex flex-col items-center gap-4">
            <Activity className="animate-spin text-slate-400" size={40} />
            <span className="text-slate-500 font-medium">Carregando Inteligência Analítica...</span>
        </div>
    );

    return (
        <div className="p-0 overflow-y-auto h-full pb-20 bg-slate-50">
            {/* TOP SUMMARY SECTION: ALERTS & KPIs SIDE-BY-SIDE */}
            <div className="px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* 1. RISK ANALYSIS (Critical Alerts) - Restored */}
                    <div className="lg:col-span-1 bg-[#fffbeb] rounded-xl shadow-sm border border-amber-100 p-6 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="text-amber-600 font-bold" size={20} />
                            <h2 className="text-[12px] font-black text-amber-900 uppercase tracking-widest">
                                ANÁLISES DE RISCO
                            </h2>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                            {advancedInsights.map((insight, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm border-l-4 border-amber-500 transition-all hover:bg-slate-50">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[14px] text-[#4d2c00] leading-tight">
                                            {insight.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium italic">{insight.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. KPI CARDS (Middle Column) */}
                    <div className="lg:col-span-1">
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <DetailedMetricCard
                                label={filters.mes === 'Todos' ? 'Valor Vendido' : `Valor Vendido (${filters.mes})`}
                                value={kpis?.valor_total || 0}
                                target={kpis?.meta_valor_total || 0}
                                leftColor="bg-slate-800"
                            />
                            <DetailedMetricCard
                                label={filters.mes === 'Todos' ? 'Nº de Pedidos' : `Nº de Pedidos (${filters.mes})`}
                                value={kpis?.qtd_pedidos || 0}
                                target={kpis?.meta_qtd_pedidos || 0}
                                infoTooltip="Meta: +15% sobre o período anterior"
                                formatValue={formatNumber}
                                leftColor="bg-slate-800"
                            />
                            <DetailedMetricCard
                                label="Ticket Médio"
                                value={kpis?.ticket_medio || 0}
                                target={kpis?.meta_ticket_medio || 0}
                                footerExplanation="Meta proj. sobre período anterior + 15%"
                                leftColor="bg-slate-800"
                            />
                            <DetailedMetricCard
                                label="Clientes Ativos"
                                value={kpis?.clientes_ativos || 0}
                                target={kpis?.meta_clientes_ativos || 0}
                                formatValue={formatNumber}
                                footerExplanation="Meta proj. sobre período anterior + 15%"
                                leftColor="bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* 3. INSIGHTS CARD (Right Column) */}
                    <div className="lg:col-span-1 h-full">
                        <InsightsCard ano={filters.ano} industryId={filters.industria?.codigo} />
                    </div>
                </div>

                {/* 3. MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* PORTFOLIO ABC ANALYSIS */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                                    <BarChart2 className="text-emerald-500" size={24} />
                                    PORTFÓLIO DA INDÚSTRIA: ANALISE DE CURVA ABC
                                </h3>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    {totalCatalogItems} ITENS CATALOGADOS
                                </div>
                            </div>

                            {filters.industria === 'Todos' ? (
                                <div className="py-20 flex flex-col items-center text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="p-4 bg-amber-100 text-amber-600 rounded-full mb-4 animate-pulse">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <h4 className="text-slate-800 font-bold text-lg mb-2">INDÚSTRIA NÃO SELECIONADA</h4>
                                    <p className="max-w-xs text-slate-500 text-sm font-medium leading-relaxed">
                                        Selecione uma indústria específica nos filtros acima para gerar o cálculo dinâmico da Curva ABC.
                                    </p>
                                </div>
                            ) : (
                                <PortfolioAnalysis filters={filters} />
                            )}
                        </div>

                        {/* CLIENT COMPARISON TABLE - Now using new component */}
                        <CustomerComparison ano={parseInt(filters?.ano) || 2025} />
                    </div>

                    {/* RIGHT COLUMN (1/3) */}
                    <div className="space-y-8">
                        {/* DISCOVERIES CARD (AI) */}
                        {/* RIGHT COLUMN (1/3) */}

                        {/* PRIORITY ACTIONS CARD - Now using new component */}
                        <PriorityActions />

                        {/* EFFICIENCY STATISTICS - Now using new component */}
                        <CommercialEfficiency />
                    </div>
                </div>
            </div >
        </div >
    );
};

// --- SUB-COMPONENTS ---

const MetricCard = ({ label, value, variation, icon, color, subText, target }) => {
    // 1. Calculate Progress
    const cleanValue = typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9,-]+/g, "").replace(",", "."))
        : value;
    const progress = target ? Math.min((cleanValue / target) * 100, 100) : 0;

    // 2. Determine Status/Color based on progress
    let statusBarColor = 'bg-red-500';
    let statusTextColor = 'text-red-500';
    let statusIcon = '🔻';

    if (progress >= 100) {
        statusBarColor = 'bg-emerald-500';
        statusTextColor = 'text-emerald-600';
        statusIcon = '🎉';
    } else if (progress >= 80) {
        statusBarColor = 'bg-amber-500';
        statusTextColor = 'text-amber-600';
        statusIcon = '⚠️';
    }

    // 3. New Design Logic (Delta)
    const isPositive = variation >= 0;
    const deltaIcon = isPositive ?
        <ArrowUpRight size={16} className="text-emerald-500" /> :
        <ArrowDownRight size={16} className="text-red-500" />;

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow font-roboto relative overflow-hidden">
            {/* Header: Icon + Label */}
            <div className="flex flex-col items-center mb-2">
                <div className={`p-3 rounded-full bg-${color}-50 text-${color}-500 mb-2`}>
                    {icon}
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    {label}
                </h3>
            </div>

            {/* Value */}
            <div className="text-2xl font-black text-slate-800 text-center mb-3">
                {value}
            </div>

            {/* Progress Bar (Restored) */}
            {target && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-1000 ${statusBarColor}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {/* Footer: Delta and Target Info */}
            <div className="flex items-center justify-between w-full mt-auto">
                <div className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-md">
                    {deltaIcon}
                    <span className={isPositive ? "text-emerald-600" : "text-red-600"}>
                        {variation > 0 ? '+' : ''}{formatPercent(variation || 0)}
                    </span>
                </div>

                {target && (
                    <div className="text-[9px] flex items-center gap-1 font-bold text-slate-400">
                        <span>{progress.toFixed(0)}% da meta</span>
                        <span className={statusTextColor}>{statusIcon}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AbcCircleItem = ({ curve, data, totalItems, label, desc, status, color, icon, danger }) => {
    const qtd = data?.qtd_itens || 0;
    const itemsTotal = totalItems || 1;
    const percentageVal = data?.percent_valor || 0;

    // For OFF curve we show % of QTY, for others % of Revenue
    const displayPercentage = curve === 'OFF' ? (qtd / itemsTotal) * 100 : percentageVal;

    const colors = {
        emerald: 'text-emerald-500 border-emerald-500',
        orange: 'text-orange-400 border-orange-400',
        slate: 'text-slate-400 border-slate-400',
        red: 'text-red-500 border-red-500',
    };

    return (
        <div className={`flex flex-col p-6 rounded-2xl bg-white border ${danger ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-50'} shadow-sm text-center group hover:shadow-md transition-all`}>
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#f8fafc" strokeWidth="10" fill="transparent" />
                    <circle
                        cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="12" fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - (displayPercentage / 100))}
                        strokeLinecap="round"
                        className={`${colors[color].split(' ')[0]} transition-all duration-1000`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800 leading-none">{formatNumber(displayPercentage.toFixed(1))}%</span>
                </div>
            </div>

            <h4 className="font-bold text-slate-700 text-sm mb-1 uppercase tracking-tight">Curva {curve} <span className="font-normal text-slate-400 italic">({qtd})</span></h4>

            <div className="mt-4 text-left p-4 bg-slate-50/50 rounded-xl min-h-[140px] flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{label}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">{desc}</p>
                <div className={`mt-auto text-[10px] font-bold ${colors[color].split(' ')[0]} flex items-center gap-1.5 uppercase tracking-tighter bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm`}>
                    <ChevronRight size={10} /> {status}
                </div>
            </div>
        </div>
    );
};

const TableRow = ({ name, prev, current, variation, status, badge, critical }) => {
    const isNegative = variation.startsWith('-');
    const statusMap = {
        crescendo: { label: '✅ Crescendo', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        destaque: { label: '🔥 Destaque', class: 'bg-amber-50 text-amber-700 border-amber-100' },
        queda: { label: '⚠️ Em Queda', class: 'bg-slate-50 text-slate-600 border-slate-100' },
        perdido: { label: '🚨 Perdido', class: 'bg-red-50 text-red-700 border-red-100' }
    };

    return (
        <tr className={`hover:bg-slate-50/50 transition-colors ${critical ? 'bg-red-50/30' : ''}`}>
            <td className="py-4 px-2">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800">{name}</span>
                    {badge && <span className="text-[9px] w-fit font-black bg-slate-800 text-white px-1.5 rounded mt-0.5">{badge}</span>}
                </div>
            </td>
            <td className="py-4 px-2 text-center text-sm font-medium text-slate-400">{prev}</td>
            <td className="py-4 px-2 text-center text-sm font-black text-slate-800">{current}</td>
            <td className={`py-4 px-2 text-center text-sm font-black ${isNegative ? 'text-red-500' : 'text-emerald-500'}`}>{variation}</td>
            <td className="py-4 px-2 text-center">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${statusMap[status].class}`}>
                    {statusMap[status].label}
                </span>
            </td>
        </tr>
    );
};

const InsightItem = ({ title, text, action }) => (
    <div className="bg-white/10 p-5 rounded-2xl border-l-2 border-white/20 hover:bg-white/15 transition-all">
        <h4 className="font-bold text-xs mb-2 tracking-tight">{title}</h4>
        <p className="text-[11px] opacity-80 leading-relaxed font-medium mb-3">{text}</p>
        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            {action}
        </div>
    </div>
);

const PriorityItem = ({ label, text, sub, color }) => {
    const colors = {
        red: 'border-red-500 text-red-600',
        orange: 'border-orange-500 text-orange-600',
        blue: 'border-blue-500 text-blue-600',
        emerald: 'border-emerald-500 text-emerald-600'
    };
    return (
        <div className={`p-4 bg-slate-50/80 rounded-xl border-l-4 ${colors[color].split(' ')[0]} hover:bg-white hover:shadow-sm transition-all shadow-slate-100`}>
            <strong className={`block text-[10px] font-black uppercase mb-1 ${colors[color].split(' ')[1]}`}>{label}</strong>
            <h5 className="text-xs font-black text-slate-800 leading-tight">{text}</h5>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">{sub}</p>
        </div>
    );
};

const SmallStatCard = ({ label, value, trend, color }) => (
    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
        <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-widest">{label}</span>
            <span className="text-xl font-black text-slate-800 leading-none">{value}</span>
        </div>
        <div className={`text-[11px] font-black ${color === 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
            {trend}
        </div>
    </div>
);

const DetailedMetricCard = ({ label, value, target, leftColor, infoTooltip, footerExplanation, formatValue = formatCurrency }) => {
    // Logic from image
    const current = parseFloat(value);
    const hasTarget = target && target > 0;

    // Progress Logic
    const displayPercentage = hasTarget ? (current / target) * 100 : 0;
    const visualProgress = Math.min(displayPercentage, 100);
    const diff = target - current;

    // Status Logic
    let barColor = 'bg-[#ef4444]'; // Red
    let statusIcon = <TrendingDown className="text-red-500" size={16} />;

    if (displayPercentage >= 100) {
        barColor = 'bg-[#10b981]'; // Green
        statusIcon = <CheckCircle className="text-emerald-500" size={16} />;
    } else if (displayPercentage >= 80) {
        barColor = 'bg-[#f59e0b]'; // Amber
        statusIcon = <AlertTriangle className="text-amber-500" size={16} />;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden p-5 pl-7 h-full flex flex-col justify-center font-roboto">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftColor}`}></div>

            <div className="flex items-center gap-1 mb-1">
                <h3 className="text-xs text-slate-800 font-bold">{label}</h3>
                {infoTooltip && (
                    <div className="group relative">
                        <Info size={12} className="text-slate-400 cursor-help" />
                        <div className="absolute left-full top-0 ml-2 w-40 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {infoTooltip}
                        </div>
                    </div>
                )}
            </div>
            <div className="text-2xl font-black text-[#1e293b] mb-4">
                {formatValue(current)}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div
                    className={`h-2 rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${visualProgress}%` }}
                ></div>
            </div>

            <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-800">
                    {hasTarget ? `${displayPercentage.toFixed(0)}% da meta (${formatValue(target)})` : 'Sem meta definida'}
                </span>
                {hasTarget && statusIcon}
            </div>

            {hasTarget ? (
                diff > 0 ? (
                    <div className="text-[10px] font-bold text-orange-700">
                        Faltam {formatValue(diff)} para atingir objetivo
                    </div>
                ) : (
                    <div className="text-[10px] font-bold text-emerald-600">
                        Meta superada!
                    </div>
                )
            ) : (
                <div className="text-[10px] font-bold text-slate-400">
                    Histórico insuficiente para cálculo
                </div>
            )}

            {footerExplanation && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-900 font-semibold">
                    {footerExplanation}
                </div>
            )}
        </div>
    );
};

export default AnalyticsTab;
