import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Loader2 } from 'lucide-react';
import BubbleChart from '../charts/BubbleChart';
import EvolutionChart from '../charts/EvolutionChart';
import ParetoChart from '../charts/ParetoChart';
import IndustryPerformanceChart from '../charts/IndustryPerformanceChart';
import NarrativesWidget from '../components/NarrativesWidget';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

// Import stable constants
const MONTHS_MAP = { 'Todos': 'Todos', 'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04', 'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08', 'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12' };

// Formatters
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const OverviewTab = ({ filters }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [goalScrollerData, setGoalScrollerData] = useState([]);
    const [evolutionData, setEvolutionData] = useState([]);
    const [paretoData, setParetoData] = useState([]);
    const [industryPerformanceData, setIndustryPerformanceData] = useState([]);
    const [narrativesData, setNarrativesData] = useState(null);

    // Fetch KPIs
    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    mes: MONTHS_MAP[filters.mes] || 'Todos',
                    industria: selectedIndustry?.codigo || null
                };

                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/summary');
                const response = await axios.get(url, { params });

                if (response.data && response.data.success) {
                    setMetrics(response.data.data);
                }
            } catch (error) {
                console.error('Erro ao buscar métricas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [filters.ano, filters.mes, selectedIndustry]);

    // Fetch Top Industries for Bubble Chart
    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const params = {
                    ano: filters.ano,
                    mes: MONTHS_MAP[filters.mes] || 'Todos',
                    metrica: filters.metrica
                };

                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/top-industries');
                const response = await axios.get(url, { params });

                if (response.data && response.data.success) {
                    setIndustries(response.data.data);
                }
            } catch (error) {
                console.error('Erro ao buscar indústrias:', error);
            }
        };

        fetchIndustries();
    }, [filters.ano, filters.mes, filters.metrica]);

    // Fetch Goals Scroller Data
    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/goals-scroller');
                const response = await axios.get(url, {
                    params: { ano: filters.ano }
                });
                if (response.data) {
                    setGoalScrollerData(response.data);
                }
            } catch (error) {
                console.error('Erro ao buscar metas scroller:', error);
            }
        };

        fetchGoals();
    }, [filters.ano]);

    // Fetch Evolution & Pareto Data & Narratives
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const params = {
                    ano: filters.ano,
                    metrica: filters.metrica.toLowerCase()
                };

                // Evolution
                const evolutionRes = await axios.get('http://localhost:8000/api/dashboard/evolution', { params });
                if (evolutionRes.data) setEvolutionData(evolutionRes.data);

                // Pareto
                const paretoUrl = getApiUrl(PYTHON_API_URL, '/api/dashboard/pareto');
                const paretoRes = await axios.get(paretoUrl, { params });
                if (paretoRes.data) setParetoData(paretoRes.data);

                // Industry Performance (Top 50)
                const industryParams = { ...params, limit: 50 };
                const perfUrl = getApiUrl(PYTHON_API_URL, '/api/dashboard/top-industries');
                const perfRes = await axios.get(perfUrl, { params: industryParams });
                if (perfRes.data?.success) setIndustryPerformanceData(perfRes.data.data);

                // Narratives / Insights
                const insightsUrl = getApiUrl(PYTHON_API_URL, '/api/dashboard/insights');
                const insightsRes = await axios.get(insightsUrl, {
                    params: {
                        ano: filters.ano,
                        industryId: selectedIndustry?.codigo
                    }
                });
                if (insightsRes.data) setNarrativesData(insightsRes.data);

            } catch (error) {
                console.error('Erro ao buscar dados do dashboard:', error);
            }
        };

        fetchDashboardData();
    }, [filters.ano, filters.metrica, selectedIndustry]);

    return (
        <div className="h-full overflow-y-auto p-5 scroll-smooth" id="central-panel-scroll">
            {/* Row 1: Market Share + KPIs/Charts */}
            <div className="grid grid-cols-12 gap-4 mb-4">

                {/* Left: Bubble Chart + Narratives */}
                <div className="col-span-5 flex flex-col gap-4">
                    {/* Bubble Chart - Market Share */}
                    <div className="bg-gradient-to-br from-[#0a3d3d] via-[#0d4a4a] to-[#0a3535] rounded-xl relative overflow-hidden h-[310px] flex flex-col justify-center shadow-lg border border-[#0d4a4a]">
                        {/* Ambient glow effects */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#082320]/80 pointer-events-none"></div>

                        {/* Header - ABSOLUTE positioning at top */}
                        <div className="absolute top-4 left-0 right-0 z-10 text-center">
                            <h3 className="font-['Roboto'] !text-cyan-200 text-xs font-bold uppercase tracking-[0.25em] drop-shadow-md">
                                Market Share: Top 6 Indústrias - Performance
                            </h3>
                        </div>

                        {/* BubbleChart Component - Centered in full height */}
                        <div className="relative z-10 h-full w-full">
                            <BubbleChart
                                data={industries}
                                selectedIndustryId={selectedIndustry?.codigo}
                                metrica={filters.metrica}
                                onIndustryClick={(id) => setSelectedIndustry(prev => prev?.codigo === id ? null : industries.find(i => i.codigo === id))}
                            />
                        </div>
                    </div>

                    {/* Premium Narratives Widget (Moved Here) */}
                    <NarrativesWidget loading={loading} data={narrativesData} />
                </div>

                {/* Right: KPIs + Metas + Evolution */}
                <div className="col-span-7 flex flex-col gap-3">

                    {/* KPI Cards Row */}

                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-4 gap-3">
                        {/* Faturamento */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all text-center">
                            <p className="font-['Roboto'] text-xs font-bold text-slate-500 uppercase mb-1">Faturamento</p>
                            <h4 className="font-['Roboto'] text-lg font-black text-slate-800">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : formatCurrency(metrics?.total_vendido_current)}
                            </h4>
                            <div className="font-['Roboto'] flex items-center justify-center gap-1 mt-1">
                                {metrics?.vendas_percent_change !== undefined && (
                                    <span className={`text-[10px] font-bold ${parseFloat(metrics.vendas_percent_change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        M-1: {parseFloat(metrics.vendas_percent_change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(metrics.vendas_percent_change) || 0).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Qtd Pedidos */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all text-center">
                            <p className="font-['Roboto'] text-xs font-bold text-slate-500 uppercase mb-1">Qtd. Pedidos</p>
                            <h4 className="font-['Roboto'] text-lg font-black text-slate-800">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : formatNumber(metrics?.qtd_pedidos_current)}
                            </h4>
                            <div className="font-['Roboto'] flex items-center justify-center gap-1 mt-1">
                                {metrics?.pedidos_percent_change !== undefined && (
                                    <span className={`text-[10px] font-bold ${parseFloat(metrics.pedidos_percent_change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        M-1: {parseFloat(metrics.pedidos_percent_change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(metrics.pedidos_percent_change) || 0).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Clientes Atendidos */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all text-center">
                            <p className="font-['Roboto'] text-xs font-bold text-slate-500 uppercase mb-1">Clientes atendidos</p>
                            <h4 className="font-['Roboto'] text-lg font-black text-slate-800">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : formatNumber(metrics?.clientes_atendidos_current)}
                            </h4>
                            <div className="font-['Roboto'] flex items-center justify-center gap-1 mt-1">
                                {metrics?.clientes_percent_change !== undefined && (
                                    <span className={`text-[10px] font-bold ${parseFloat(metrics.clientes_percent_change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        M-1: {parseFloat(metrics.clientes_percent_change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(metrics.clientes_percent_change) || 0).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Qtd Vendida */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all text-center">
                            <p className="font-['Roboto'] text-xs font-bold text-slate-500 uppercase mb-1">Qtd. vendida</p>
                            <h4 className="font-['Roboto'] text-lg font-black text-slate-800">
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : formatNumber(metrics?.quantidade_vendida_current)}
                            </h4>
                            <div className="font-['Roboto'] flex items-center justify-center gap-1 mt-1">
                                {metrics?.quantidade_percent_change !== undefined && (
                                    <span className={`text-[10px] font-bold ${parseFloat(metrics.quantidade_percent_change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        M-1: {parseFloat(metrics.quantidade_percent_change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(metrics.quantidade_percent_change) || 0).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#0a3d3d] via-[#0d4a4a] to-[#0a3535] rounded-lg py-2 px-3 flex flex-col items-center justify-center overflow-hidden shadow-inner border border-[#0d4a4a] gap-1">
                        {/* Centralized Title - In Flow */}
                        <div className="bg-[#143228]/50 border border-[#1a2e35]/50 px-3 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-1.5">
                                <Target size={10} className="text-cyan-400" />
                                <span className="font-['Roboto'] text-[9px] font-bold !text-cyan-200 uppercase tracking-[0.15em] drop-shadow-sm">
                                    Metas atingidas (YTD) • Valor realizado vs Meta anual
                                </span>
                            </div>
                        </div>

                        <div className="w-full overflow-hidden relative h-6">
                            <div className="flex items-center gap-12 animate-marquee whitespace-nowrap absolute top-0 left-0 hover:[animation-play-state:paused] w-max">
                                {[...goalScrollerData, ...goalScrollerData].map((item, idx) => {
                                    const diff = item.total_sales - item.total_goal;
                                    const isSurplus = diff >= 0;
                                    const diffFormatted = new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(Math.abs(diff));

                                    return (
                                        <span key={`${item.industry}-${idx}`} className="font-['Roboto'] !text-white flex items-center gap-2 select-none">
                                            <span className="font-['Roboto'] text-xs font-bold !text-slate-100">{item.industry}</span>

                                            <span className={`font-['Roboto'] text-sm font-black ${isSurplus ? '!text-emerald-400' : '!text-red-400'}`}>
                                                {item.percent.toFixed(1)}%
                                            </span>

                                            <span className={`font-['Roboto'] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 ${isSurplus ? 'bg-emerald-500/20 !text-emerald-400' : 'bg-red-500/20 !text-red-400'}`}>
                                                {isSurplus ? 'Superavit' : 'Falta'}
                                                <span className="font-['Roboto'] font-normal opacity-90 !text-white">{diffFormatted}</span>
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                            <style>{`
                                @keyframes marquee {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-50%); } 
                                }
                                .animate-marquee {
                                    animation: marquee 60s linear infinite;
                                }
                            `}</style>
                        </div>
                    </div>

                    {/* Evolution Chart */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 pb-0 flex-1 min-h-[280px] flex flex-col">
                        <div className="text-center mb-1">
                            <p className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Evolução do Volume de {filters.metrica === 'Valor' ? 'Vendas' : 'Peças'}</p>
                            <p className="font-['Roboto'] text-xs text-slate-500 mt-1">Análise de Tendência Mensal (MoM) • {filters.metrica} • {filters.ano}</p>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-slate-300 w-5 h-5" />
                                </div>
                            ) : (
                                <EvolutionChart data={evolutionData} metrica={filters.metrica} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Bottom Charts */}
            <div className="grid grid-cols-12 gap-4">
                {/* Pareto Chart - Aligned with Bubble Chart (col-span-5) */}
                <div className="col-span-5 bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[300px] flex flex-col">
                    <div className="mb-1 text-center">
                        <p className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase">Curva ABC de Clientes (Pareto)</p>
                        <p className="text-xs text-slate-400 mt-1">Classificação 80/20 • {filters.metrica} • {filters.ano}</p>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-slate-300 w-5 h-5" />
                            </div>
                        ) : (
                            <ParetoChart data={paretoData} metrica={filters.metrica} />
                        )}
                    </div>
                </div>

                {/* Right column placeholder (col-span-7) */}
                <div className="col-span-7">
                    {/* Participação da Indústria */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[300px] flex flex-col">
                        <div className="mb-3 text-center">
                            <p className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase">Ranking e Participação de Mercado</p>
                            <p className="text-xs text-slate-400 mt-1">Desempenho por Indústria • {filters.metrica} • {filters.ano}</p>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-slate-300 w-5 h-5" />
                                </div>
                            ) : (
                                <IndustryPerformanceChart data={industryPerformanceData} metrica={filters.metrica} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
