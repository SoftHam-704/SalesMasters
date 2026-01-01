
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Sidebar is now global in App.jsx, usually we don't need to import it if it's outside Routes.
// However, the user's system seems to have Sidebar inside some pages or global?
// In App.jsx line 88: <Sidebar /> is OUTSIDE the Routes. 
// So it should ALWAYS be visible unless covered by z-index.
// My previous BIPage.jsx had "fixed inset-0 z-[100]" which covered it.
// I will just make BIPage a normal rounded container that fits inside the main-content area.

import { LayoutDashboard, Zap, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import EvolutionChart from './BI/charts/EvolutionChart';
import BubbleChart from './BI/charts/BubbleChart';

const BIPage = () => {
    const [metrics, setMetrics] = useState(null);
    const [evolutionData, setEvolutionData] = useState([]);
    const [topIndustries, setTopIndustries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndustryId, setSelectedIndustryId] = useState(null);
    const [filters, setFilters] = useState({
        ano: new Date().getFullYear(),
        mes: String(new Date().getMonth() + 1).padStart(2, '0'),
        trimestre: 'Todos'
    });

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("Iniciando busca de dados BI (Intelligence)...");

            const params = {
                ano: filters.ano,
                mes: filters.mes,
                trimestre: filters.trimestre,
                industria: selectedIndustryId
            };

            const summaryRes = await axios.get('/api/reports/dashboard-summary', { params });
            if (summaryRes.data && summaryRes.data.success) {
                setMetrics(summaryRes.data.data);
            }

            const evolutionRes = await axios.get('http://localhost:8000/api/dashboard/evolution', {
                params: { ano: filters.ano, metrica: 'valor' }
            });
            setEvolutionData(evolutionRes.data || []);

            const topRes = await axios.get('/api/reports/top-industries', {
                params: { ...params, metrica: 'Valor' }
            });
            if (topRes.data && topRes.data.success) {
                setTopIndustries(topRes.data.data);
            }

        } catch (error) {
            console.error('Erro ao buscar dados BI:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, selectedIndustryId]);

    const handleIndustryClick = (id) => setSelectedIndustryId(prev => prev === id ? null : id);

    // REMOVED 'fixed inset-0 z-[100]' to allow Sidebar to show
    return (
        <div className="flex flex-col h-full font-['Inter'] relative p-6">

            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                        <Zap className="text-white fill-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Intelligence</h1>
                        <p className="text-xs text-slate-500 font-medium">Análise Estratégica & Performance</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <select
                        className="form-select text-xs font-bold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                        value={filters.ano}
                        onChange={e => setFilters(p => ({ ...p, ano: e.target.value }))}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div className="h-4 w-[1px] bg-slate-200"></div>
                    <select
                        className="form-select text-xs font-bold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                        value={filters.mes}
                        onChange={e => setFilters(p => ({ ...p, mes: e.target.value }))}
                    >
                        <option value="Todos">Todos os Meses</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 min-h-[500px]">
                {/* Left: Bubble Chart */}
                <div className="col-span-12 lg:col-span-7 bg-[#0F172A] rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col group transition-all hover:scale-[1.005]">
                    {/* Header */}
                    <div className="flex justify-between items-start z-10 mb-2">
                        <h3 className="text-white/90 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            Market Share
                        </h3>
                        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">Top 6 Indústrias</span>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 w-full h-full min-h-[400px] relative z-10">
                        <BubbleChart data={topIndustries} onIndustryClick={handleIndustryClick} />
                    </div>

                    {/* Background Effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F172A]/80 pointer-events-none"></div>
                </div>

                {/* Right: Metrics & Charts */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Faturamento */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex justify-between">
                                Faturamento
                                <span className="text-emerald-500 bg-emerald-50 px-1.5 rounded text-[9px]">Live</span>
                            </p>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">
                                {metrics ? formatCurrency(metrics.total_vendido_current || 0) : '...'}
                            </h4>
                            <div className="h-1 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
                                <div className="h-full w-[70%] bg-blue-500 rounded-full"></div>
                            </div>
                        </div>

                        {/* Pedidos */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Qtd. Pedidos</p>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">
                                {metrics ? formatNumber(metrics.qtd_pedidos_current || 0) : '...'}
                            </h4>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                                <span className="text-red-500 font-bold">▼ 12%</span> vs mês ant.
                            </div>
                        </div>

                        {/* Clientes */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Clientes</p>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">
                                {metrics ? formatNumber(metrics.clientes_atendidos_current || 0) : '...'}
                            </h4>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                                <span className="text-emerald-500 font-bold">▲ 5%</span> vs mês ant.
                            </div>
                        </div>

                        {/* Qtd Vendida */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Qtd. Itens</p>
                            <h4 className="text-xl font-bold text-slate-800 mt-1">
                                {metrics ? formatNumber(metrics.quantidade_vendida_current || 0) : '...'}
                            </h4>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                                <span className="text-slate-500 font-bold">-</span> estável
                            </div>
                        </div>
                    </div>

                    {/* Metas Banner */}
                    <div className="bg-[#143228] rounded-xl p-3 flex flex-col justify-center items-center shadow-lg border border-[#ffffff10] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2 z-10">
                            <Target size={12} className="text-emerald-400" /> Atingimento de Metas (YTD)
                        </h4>
                        <div className="flex gap-6 text-[10px] text-white/80 font-mono overflow-hidden w-full justify-center z-10">
                            <div className="flex gap-6 animate-marquee whitespace-nowrap">
                                <span className="flex gap-1">AJUSA: <b className="text-red-400">68,5%</b></span>
                                <span className="flex gap-1">DYNA: <b className="text-emerald-400">121,4%</b></span>
                                <span className="flex gap-1">FANIA: <b className="text-red-400">56,7%</b></span>
                            </div>
                        </div>
                    </div>

                    {/* Evolution Chart */}
                    <div className="bg-white rounded-xl p-5 flex-1 shadow-sm border border-slate-100 relative min-h-[180px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Tendência de Faturamento</p>
                        <div className="absolute inset-x-4 bottom-4 top-10">
                            <EvolutionChart data={evolutionData} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BIPage;
