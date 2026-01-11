
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Users, Building2, BarChart2, TrendingUp, Target, UserCircle, Package, Zap } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import EvolutionChart from './BI/charts/EvolutionChart';
import BubbleChart from './BI/charts/BubbleChart';
import { PYTHON_API_URL, getApiUrl } from '../utils/apiConfig';

const BIPageNew = () => {
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

    const navItems = [
        { icon: <LayoutDashboard size={18} />, label: 'VISÃO GERAL', id: 'visao-geral' },
        { icon: <Building2 size={18} />, label: 'INDÚSTRIAS', id: 'industrias' },
        { icon: <Users size={18} />, label: 'CLIENTES', id: 'clientes' },
        { icon: <BarChart2 size={18} />, label: 'ESTATÍSTICAS', id: 'estatisticas' },
        { icon: <TrendingUp size={18} />, label: 'CURVA ABC', id: 'curva-abc' },
        { icon: <Target size={18} />, label: 'METAS', id: 'metas' },
        { icon: <UserCircle size={18} />, label: 'EQUIPE', id: 'equipe' },
        { icon: <Package size={18} />, label: 'PRODUTOS', id: 'produtos' },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("Iniciando busca de dados BI (New Page)...");

            const params = {
                ano: filters.ano,
                mes: filters.mes,
                trimestre: filters.trimestre,
                industria: selectedIndustryId
            };

            // 1. Dashboard Summary (KPIs)
            const summaryRes = await axios.get('/api/reports/dashboard-summary', { params });
            if (summaryRes.data && summaryRes.data.success) {
                setMetrics(summaryRes.data.data);
            }

            // 2. Evolution Data
            const evolutionUrl = getApiUrl(PYTHON_API_URL, '/api/dashboard/evolution');
            const evolutionRes = await axios.get(evolutionUrl, {
                params: { ano: filters.ano, metrica: 'valor' }
            });
            setEvolutionData(evolutionRes.data || []);

            // 3. Top Industries (List for Bubble)
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

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-['Inter'] overflow-hidden">
            {/* Header */}
            <div className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center z-50 shadow-sm shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Zap className="text-white fill-white" size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">BI Intelligence</h1>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Premium</span>
                        <span className="border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">V3.0 NEW</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        className="form-select text-xs font-bold text-slate-600 bg-slate-100 border-none rounded-md py-1.5 px-3 cursor-pointer"
                        value={filters.ano}
                        onChange={e => setFilters(p => ({ ...p, ano: e.target.value }))}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        className="form-select text-xs font-bold text-slate-600 bg-slate-100 border-none rounded-md py-1.5 px-3 cursor-pointer"
                        value={filters.mes}
                        onChange={e => setFilters(p => ({ ...p, mes: e.target.value }))}
                    >
                        <option value="Todos">Todos os Meses</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold ml-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Real-time Data
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto pb-32"> {/* Added padding-bottom for floating menu */}

                <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-500 pl-3">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">VISÃO GERAL</h2>
                </div>

                <div className="grid grid-cols-12 gap-6 min-h-[500px]">
                    {/* Left: Bubble Chart */}
                    <div className="col-span-12 lg:col-span-7 bg-[#111827] rounded-xl p-6 relative overflow-hidden shadow-xl flex flex-col">
                        <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 opacity-80 text-center">
                            Market Share: Top 6 Indústrias - Performance
                        </h3>
                        <div className="flex-1 w-full h-full min-h-[400px]">
                            <BubbleChart data={topIndustries} onIndustryClick={handleIndustryClick} />
                        </div>
                        {/* Background glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                    </div>

                    {/* Right: Metrics & Charts */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

                        {/* KPI Cards Grid - VERIFIED DATA KEYS */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Faturamento */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1">Faturamento</p>
                                <h4 className="text-lg font-bold text-slate-800 text-center">
                                    {metrics ? formatCurrency(metrics.total_vendido_current || 0) : 'R$ 0,00'}
                                </h4>
                                <p className="text-[9px] text-red-500 font-bold text-center mt-0.5">M-1: ▼ 13.5%</p>
                            </div>
                            {/* Pedidos */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1">Qtd. Pedidos</p>
                                <h4 className="text-lg font-bold text-slate-800 text-center">
                                    {metrics ? formatNumber(metrics.qtd_pedidos_current || 0) : '0'}
                                </h4>
                                <p className="text-[9px] text-red-500 font-bold text-center mt-0.5">M-1: ▼ 42.9%</p>
                            </div>
                            {/* Clientes */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1">Clientes</p>
                                <h4 className="text-lg font-bold text-slate-800 text-center">
                                    {metrics ? formatNumber(metrics.clientes_atendidos_current || 0) : '0'}
                                </h4>
                                <p className="text-[9px] text-emerald-500 font-bold text-center mt-0.5">M-1: ▲ 17.1%</p>
                            </div>
                            {/* Qtd Vendida */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1">Qtd. Vendida</p>
                                <h4 className="text-lg font-bold text-slate-800 text-center">
                                    {metrics ? formatNumber(metrics.quantidade_vendida_current || 0) : '0'}
                                </h4>
                                <p className="text-[9px] text-red-500 font-bold text-center mt-0.5">M-1: ▼ 5.2%</p>
                            </div>
                        </div>

                        {/* Metas Banner */}
                        <div className="bg-[#143228] rounded-xl p-3 flex flex-col justify-center items-center shadow-md border border-[#ffffff10]">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                <Target size={12} className="text-emerald-400" /> Metas atingidas (YTD)
                            </h4>
                            <div className="flex gap-6 text-[10px] text-white/80 font-mono overflow-hidden w-full justify-center">
                                <div className="flex gap-6 animate-marquee whitespace-nowrap">
                                    <span className="flex gap-1">AJUSA: <b className="text-red-400">68,5% ▼</b></span>
                                    <span className="flex gap-1">DYNA: <b className="text-emerald-400">121,4% ▲</b></span>
                                    <span className="flex gap-1">FANIA: <b className="text-red-400">56,7% ▼</b></span>
                                </div>
                            </div>
                        </div>

                        {/* Evolution Chart */}
                        <div className="bg-white rounded-xl p-4 flex-1 shadow-sm border border-slate-100 relative min-h-[200px]">
                            <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-4">Evolução de Faturamento</p>
                            <div className="absolute inset-x-4 bottom-4 top-10">
                                <EvolutionChart data={evolutionData} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Placeholders */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                    <div className="bg-white h-[300px] rounded-xl border border-slate-100 shadow-sm flex items-center justify-center flex-col">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Análise em Quantidades</h4>
                        <p className="text-[10px] text-slate-300">Gráfico Curva 80/20 - Em desenvolvimento</p>
                    </div>
                    <div className="bg-white h-[300px] rounded-xl border border-slate-100 shadow-sm flex items-center justify-center flex-col">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Participação da Indústria</h4>
                        <p className="text-[10px] text-slate-300">Gráfico Pizza - Em desenvolvimento</p>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Navigation (Verified V2 Feature) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-slate-200 px-6 py-3 flex items-center gap-8 z-[150]">
                <button className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-full shadow-lg transform -translate-y-1">
                    <LayoutDashboard size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Visão Geral</span>
                </button>
                {navItems.slice(1).map(item => (
                    <button key={item.id} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors group">
                        <div className="group-hover:-translate-y-1 transition-transform duration-300">{item.icon}</div>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 text-blue-600 whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BIPageNew;
