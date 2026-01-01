import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Zap, Users, Building2, BarChart2, TrendingUp, Target, UserCircle, Package, Activity, Loader2 } from 'lucide-react';
import BubbleChart from './BI/charts/BubbleChart';

// Formatters
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const IntelligencePage = () => {
    const [activePage, setActivePage] = useState('VISAO_GERAL');
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [hoveredIndustry, setHoveredIndustry] = useState(null);

    // Filter states
    const [filters, setFilters] = useState({
        ano: 2025,
        mes: 'Todos',
        industria: 'Todos',
        cliente: 'Todos',
        metrica: 'Valor'
    });

    const menuItems = [
        { id: 'VISAO_GERAL', label: 'Visão Geral', icon: <LayoutDashboard size={20} />, color: 'text-white' },
        { id: 'INDUSTRIAS', label: 'Indústrias', icon: <Building2 size={20} />, color: 'text-emerald-500' },
        { id: 'CLIENTES', label: 'Clientes', icon: <Users size={20} />, color: 'text-blue-500' },
        { id: 'ESTATISTICAS', label: 'Estatísticas', icon: <BarChart2 size={20} />, color: 'text-indigo-500' },
        { id: 'CURVA_ABC', label: 'Curva ABC', icon: <TrendingUp size={20} />, color: 'text-amber-500' },
        { id: 'METAS', label: 'Metas', icon: <Target size={20} />, color: 'text-rose-500' },
        { id: 'EQUIPE', label: 'Equipe', icon: <UserCircle size={20} />, color: 'text-violet-500' },
        { id: 'PRODUTOS', label: 'Produtos', icon: <Package size={20} />, color: 'text-cyan-500' },
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = ['Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthsMap = { 'Todos': 'Todos', 'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04', 'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08', 'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12' };

    const activeItem = menuItems.find(item => item.id === activePage) || menuItems[0];

    // Check if should show client filter (hidden on Visão Geral)
    const showClientFilter = activePage !== 'VISAO_GERAL';

    // Fetch KPIs from API - filtered by selected industry
    useEffect(() => {
        const fetchMetrics = async () => {
            if (activePage !== 'VISAO_GERAL') return;

            setLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    mes: monthsMap[filters.mes] || 'Todos',
                    industria: selectedIndustry?.codigo || null
                };

                const response = await axios.get('/api/reports/dashboard-summary', { params });

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
    }, [filters.ano, filters.mes, activePage, selectedIndustry]);

    // Fetch Top Industries for Bubble Chart
    useEffect(() => {
        const fetchIndustries = async () => {
            if (activePage !== 'VISAO_GERAL') return;

            try {
                const params = {
                    ano: filters.ano,
                    mes: monthsMap[filters.mes] || 'Todos',
                    metrica: filters.metrica
                };

                const response = await axios.get('/api/reports/top-industries', { params });

                if (response.data && response.data.success) {
                    setIndustries(response.data.data);
                }
            } catch (error) {
                console.error('Erro ao buscar indústrias:', error);
            }
        };

        fetchIndustries();
    }, [filters.ano, filters.mes, filters.metrica, activePage]);

    // Calculate bubble sizes (proportional to max value)
    const getSize = (value, maxValue) => {
        const minSize = 50;
        const maxSize = 120;
        const ratio = value / maxValue;
        return minSize + (maxSize - minSize) * ratio;
    };

    return (
        <div className="p-6 font-['Inter'] min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Corner Ribbon */}
            <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 pointer-events-none z-10">
                <div className="absolute top-[20px] right-[-35px] transform rotate-45 bg-slate-400 text-white text-[10px] font-bold py-1 w-[150px] text-center shadow-md border-b-2 border-slate-500/50">
                    PRE-ORDER
                </div>
            </div>

            {/* Header - Premium Design */}
            <div className="flex items-center justify-between mb-3">
                {/* Left: Branding */}
                <div className="flex items-center gap-4">
                    {/* Icon with glow effect */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-[#0077B6] to-[#023E8A] p-3 rounded-2xl shadow-xl">
                            <Zap className="text-white fill-white drop-shadow-lg" size={26} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="font-['Roboto'] text-2xl font-black text-slate-800 tracking-tight">
                                BI Intelligence
                            </h1>
                            <div className="flex items-center gap-2">
                                {/* Premium Badge with shimmer */}
                                <span className="relative overflow-hidden bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-200 shadow-sm">
                                    <span className="relative z-10">⭐ Premium</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                </span>
                                {/* Version Badge */}
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                                    V2.0
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Plataforma de Análise Estratégica & Performance</p>
                    </div>
                </div>

                {/* Right: Engine Branding - Alive version */}
                <div className="flex items-center gap-4 mr-12">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="font-['Roboto'] text-[11px] font-bold text-slate-500 uppercase tracking-widest">SalesMasters</span>
                            <span className="font-['Roboto'] text-[12px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                AI Engine
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Animated pulse dot */}
                            <div className="relative flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping absolute"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                                Powered by <span className="font-bold text-slate-500">SoftHam</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtitle / Quote Box - Elegant Design */}
            <div className="relative bg-gradient-to-r from-slate-50 to-slate-100/50 border-l-4 border-l-[#0077B6] border-y border-r border-slate-200/80 rounded-r-lg py-2 px-4 max-w-2xl mb-3 group hover:border-l-indigo-500 transition-colors">
                <p className="font-['Roboto'] text-[11px] text-slate-500 italic leading-relaxed">
                    "Dados transformados em vantagem competitiva. <span className="text-slate-600 font-medium not-italic">Onde outros veem números, você visualiza estratégias.</span>"
                </p>
            </div>

            {/* Filter Bar - Caption + Filters */}
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 mb-4 flex items-center justify-between shadow-sm">
                {/* Left: Active Page Caption */}
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#0077B6] rounded-full"></div>
                    <span className="font-['Roboto'] text-sm font-bold uppercase tracking-wide text-slate-700">
                        {activeItem.label}
                    </span>
                </div>

                {/* Right: Filter Controls */}
                <div className="flex items-center gap-3">
                    {/* Year */}
                    <select
                        value={filters.ano}
                        onChange={(e) => setFilters(p => ({ ...p, ano: e.target.value }))}
                        className="font-['Roboto'] text-xs font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {/* Month */}
                    <select
                        value={filters.mes}
                        onChange={(e) => setFilters(p => ({ ...p, mes: e.target.value }))}
                        className="font-['Roboto'] text-xs font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {/* Industry - Hidden on Visão Geral */}
                    {showClientFilter && (
                        <select
                            value={filters.industria}
                            onChange={(e) => setFilters(p => ({ ...p, industria: e.target.value }))}
                            className="font-['Roboto'] text-xs font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                        >
                            <option value="Todos">Indústrias</option>
                        </select>
                    )}

                    {/* Client - Hidden on Visão Geral */}
                    {showClientFilter && (
                        <select
                            value={filters.cliente}
                            onChange={(e) => setFilters(p => ({ ...p, cliente: e.target.value }))}
                            className="font-['Roboto'] text-xs font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                        >
                            <option value="Todos">Clientes</option>
                        </select>
                    )}

                    {/* Metric */}
                    <select
                        value={filters.metrica}
                        onChange={(e) => setFilters(p => ({ ...p, metrica: e.target.value }))}
                        className="font-['Roboto'] text-xs font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                    >
                        <option value="Valor">Valor</option>
                        <option value="Quantidade">Quantidade</option>
                    </select>

                    {/* Real-time indicator */}
                    <div className="flex items-center gap-1.5 ml-2 text-emerald-600">
                        <Activity size={14} className="animate-pulse" />
                        <span className="font-['Roboto'] text-[10px] font-medium uppercase tracking-wide">Real-time Data</span>
                    </div>
                </div>
            </div>

            {/* Central Panel - Fixed Height with Internal Scroll */}
            <div className="bg-white h-[55vh] rounded-2xl shadow-sm border border-slate-200 mb-8 relative z-0 overflow-hidden">
                {/* Scrollable Content */}
                <div className="h-full overflow-y-auto p-5 scroll-smooth" id="central-panel-scroll">

                    {/* Row 1: Market Share + KPIs/Charts */}
                    <div className="grid grid-cols-12 gap-4 mb-4">

                        {/* Left: Bubble Chart - Market Share */}
                        <div className="col-span-5 bg-gradient-to-br from-[#0a2a28] via-[#0d3d38] to-[#082320] rounded-xl p-4 relative overflow-hidden min-h-[280px]">
                            {/* Ambient glow effects */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#082320]/80 pointer-events-none"></div>

                            {/* Header - CENTERED */}
                            <div className="relative z-10 text-center mb-2">
                                <h3 className="font-['Roboto'] text-cyan-400/90 text-[10px] font-bold uppercase tracking-[0.25em]">
                                    Market Share: Top 6 Indústrias - Performance
                                </h3>
                            </div>

                            {/* BubbleChart Component */}
                            <div className="relative z-10 h-[230px]">
                                <BubbleChart
                                    data={industries}
                                    selectedIndustryId={selectedIndustry?.codigo}
                                    metrica={filters.metrica}
                                    onIndustryClick={(id) => setSelectedIndustry(prev => prev?.codigo === id ? null : industries.find(i => i.codigo === id))}
                                />
                            </div>
                        </div>

                        {/* Right: KPIs + Metas + Evolution */}
                        <div className="col-span-7 flex flex-col gap-3">

                            {/* KPI Cards Row */}
                            <div className="grid grid-cols-4 gap-3">
                                {/* Faturamento */}
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:shadow-md transition-all text-center">
                                    <p className="font-['Roboto'] text-[10px] text-slate-400 font-bold uppercase mb-1">Faturamento</p>
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
                                    <p className="font-['Roboto'] text-[10px] text-slate-400 font-bold uppercase mb-1">Qtd. Pedidos</p>
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
                                    <p className="font-['Roboto'] text-[10px] text-slate-400 font-bold uppercase mb-1">Clientes atendidos</p>
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
                                    <p className="font-['Roboto'] text-[10px] text-slate-400 font-bold uppercase mb-1">Qtd. vendida</p>
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

                            {/* Metas Bar */}
                            <div className="bg-gradient-to-r from-[#1a2e35] to-[#143228] rounded-lg p-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={12} className="text-emerald-400" />
                                    <span className="font-['Roboto'] text-[9px] font-bold text-white uppercase tracking-wide">
                                        Metas atingidas (YTD) = Valor realizado vs Meta anual
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-mono">
                                    <span className="text-white">FANIA: <b className="text-red-400">56,7%</b> ▼</span>
                                    <span className="text-white">FUCHS: <b className="text-emerald-400">232,4%</b> ▲</span>
                                    <span className="text-white">HENGST: <b className="text-red-400">99,1%</b> ▼</span>
                                    <span className="text-white">HI TECH: <b className="text-emerald-400">125,9%</b> ▲</span>
                                </div>
                            </div>

                            {/* Evolution Chart */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex-1 min-h-[140px]">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-['Roboto'] text-[10px] font-bold text-slate-600 uppercase">Evolução do Faturamento</p>
                                        <p className="text-[8px] text-slate-400">Análise de Tendência Mensal (MM) • Valor (R$)</p>
                                    </div>
                                </div>
                                {/* Chart Placeholder */}
                                <div className="h-[90px] flex items-end justify-between gap-1 px-2">
                                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                                        <div key={m} className="flex flex-col items-center gap-1 flex-1">
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-500"
                                                style={{ height: `${[30, 25, 35, 28, 45, 40, 38, 50, 55, 60, 75, 20][i]}px` }}
                                            ></div>
                                            <span className="text-[7px] text-slate-400 font-medium">{m}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Bottom Charts */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Análise em Quantidades */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[120px]">
                            <div className="mb-2">
                                <p className="font-['Roboto'] text-[11px] font-bold text-slate-700">Análise em Quantidades</p>
                                <p className="text-[9px] text-slate-400">Curva 80/20</p>
                            </div>
                            <div className="flex items-center justify-center h-[70px] text-slate-300 text-[10px]">
                                Gráfico Curva 80/20 - Em desenvolvimento
                            </div>
                        </div>

                        {/* Participação da Indústria */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[120px]">
                            <div className="mb-2">
                                <p className="font-['Roboto'] text-[11px] font-bold text-slate-700">Participação da Indústria</p>
                                <p className="text-[9px] text-slate-400">Em relação ao faturamento total</p>
                            </div>
                            <div className="flex items-center justify-center h-[70px] text-slate-300 text-[10px]">
                                Gráfico Pizza - Em desenvolvimento
                            </div>
                        </div>
                    </div>

                </div >

                {/* Scroll Indicator Arrow - Shows when there's more content */}
                < div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-60 pointer-events-none" >
                    <div className="w-5 h-5 border-b-2 border-r-2 border-slate-400 rotate-45 -mb-1"></div>
                    <span className="text-[8px] text-slate-400 font-medium mt-1">Mais insights</span>
                </div >
            </div >

            {/* Bottom Menu - Dynamic PageControl */}
            < div className="fixed bottom-6 left-[calc(50%+9rem)] -translate-x-1/2 z-50" >
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-5 py-2.5 flex items-center gap-1">
                    {menuItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                                    flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 
                                    ${isActive
                                        ? 'bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white shadow-lg shadow-slate-900/30 scale-[1.02]'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:scale-[1.02]'
                                    }
                                `}
                            >
                                {React.cloneElement(item.icon, {
                                    size: 18,
                                    className: `transition-colors duration-300 ${isActive ? 'text-white drop-shadow-sm' : item.color}`
                                })}

                                <div className="flex flex-col items-start leading-none">
                                    <span className={`font-['Roboto'] text-[11px] font-bold uppercase tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                        {item.label}
                                    </span>
                                    <span className={`text-[8px] font-semibold uppercase tracking-wider ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                        EXPLORAR
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div >
        </div >
    );
};

export default IntelligencePage;
