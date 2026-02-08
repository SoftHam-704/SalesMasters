import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { LayoutDashboard, Zap, Users, Building2, BarChart2, TrendingUp, Target, UserCircle, Package, Activity, RefreshCw, HelpCircle, Info } from 'lucide-react';
import OverviewTab from './BI/tabs/OverviewTab';
import IndustriasTab from './BI/tabs/IndustriasTab';
import ClientesTab from './BI/tabs/ClientesTab';
import AnalyticsTab from './BI/tabs/AnalyticsTab';
import CurvaABCTab from './BI/tabs/CurvaABCTab';
import MetasTab from './BI/tabs/MetasTab';
import EquipeTab from './BI/tabs/EquipeTab';
import ProdutosTab from './BI/tabs/ProdutosTab';
import { PYTHON_API_URL, getApiUrl } from '../utils/apiConfig';

// STABLE CONSTANTS - Outside component to prevent re-render loops
const MONTHS_MAP = { 'Todos': 'Todos', 'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04', 'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08', 'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12' };
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = ['Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const IntelligencePage = () => {
    const [activePage, setActivePage] = useState('VISAO_GERAL');
    const [user, setUser] = useState({ name: 'Usuário', avatar: null });

    // Lazy Loading State: Mantém registro de quais abas já foram abertas para não destruir o estado ao trocar
    const [visitedTabs, setVisitedTabs] = useState(new Set(['VISAO_GERAL']));

    useEffect(() => {
        setVisitedTabs(prev => {
            if (prev.has(activePage)) return prev;
            return new Set(prev).add(activePage);
        });
    }, [activePage]);

    // Filter states
    const [filters, setFilters] = useState({
        ano: 2025,
        mes: 'Todos',
        industria: 'Todos',
        cliente: 'Todos',
        metrica: 'valor',
        considerarAnoTodo: false,
        redeDeLojas: false
    });

    const [industryOptions, setIndustryOptions] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

    const handleRefresh = () => {
        setRefreshTrigger(Date.now());
    };

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;

        const fetchFilters = async () => {
            try {
                // Fetch full list for dropdowns
                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/filters-options');
                const res = await axios.get(url);

                // BUG FIX: Se as indústrias voltarem vazias em um ambiente populado, 
                // pode ser um "cold start" ou delay na conexão do tenant após restart.
                // Forçamos um retry automático para melhorar a experiência (UX).
                if ((!res.data || !res.data.industries || res.data.industries.length === 0) && retryCount < maxRetries) {
                    retryCount++;
                    console.warn(`[BI] Indústrias vazias. Tentando novamente (${retryCount}/${maxRetries}) em 2s...`);
                    setTimeout(fetchFilters, 2000);
                    return;
                }

                if (res.data) {
                    setIndustryOptions(res.data.industries || []);
                    setClientOptions(res.data.clients || []);
                }
            } catch (err) {
                console.error("Failed to fetch filter options", err);
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(fetchFilters, 3000);
                }
            }
        };
        fetchFilters();
    }, [refreshTrigger]);

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

    // Use module-level constants (YEARS, MONTHS, MONTHS_MAP)

    const activeItem = menuItems.find(item => item.id === activePage) || menuItems[0];

    // Check if should show client filter (hidden on Visão Geral)
    const showClientFilter = activePage !== 'VISAO_GERAL';

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
            <div className="relative py-2 pl-4 max-w-2xl mb-3 group transition-colors">
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-indigo-500 rounded-full"></div>
                <p className="font-['Roboto'] text-[13px] text-slate-500 italic leading-relaxed">
                    "Dados transformados em vantagem competitiva. <span className="text-indigo-600 font-bold not-italic text-[14px]">Onde outros veem números, você visualiza estratégias.</span>"
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
                {/* Right: Filter Controls - Enhanced with Hints */}
                <div className="flex items-center gap-6">
                    {/* Year & Global Year Checkbox - Refactor: Button Slicer */}
                    <div className="flex flex-col gap-1.5 min-w-[130px]">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Referência</label>
                            <div className="flex items-center gap-1">
                                {YEARS.slice(0, 4).map(y => (
                                    <button
                                        key={y}
                                        onClick={() => setFilters(p => ({ ...p, ano: y }))}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${parseInt(filters.ano) === y
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200 border-blue-600'
                                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                                            }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer group px-1">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.considerarAnoTodo}
                                    onChange={(e) => setFilters(p => ({ ...p, considerarAnoTodo: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-3.5 h-3.5 bg-white border-2 border-slate-200 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                                <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-[2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Ano Todo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group px-1 ml-4 border-l border-slate-100 pl-4">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.redeDeLojas}
                                    onChange={(e) => setFilters(p => ({ ...p, redeDeLojas: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-3.5 h-3.5 bg-white border-2 border-slate-200 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all"></div>
                                <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-[2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Rede de Lojas</span>
                        </label>
                    </div>

                    {/* Period (Date Range) */}
                    <div className={`flex flex-col gap-1.5 transition-opacity ${filters.considerarAnoTodo ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex items-center gap-1.5 px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Período</label>
                            <div className="group relative">
                                <Info size={10} className="text-slate-300 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                                    Selecione o intervalo de datas para análise.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                value={filters.startDate || `${filters.ano}-01-01`}
                                onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))}
                                className="font-['Roboto'] text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="text-slate-300 text-[10px]">até</span>
                            <input
                                type="date"
                                value={filters.endDate || `${filters.ano}-12-31`}
                                onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))}
                                className="font-['Roboto'] text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Industry Selector */}
                    {showClientFilter && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Indústria</label>
                                    <div className="group relative">
                                        <HelpCircle size={10} className="text-slate-300 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                                            Filtre os dados por uma marca/fornecedor específico.
                                        </div>
                                    </div>
                                </div>
                                <select
                                    value={filters.industria}
                                    onChange={(e) => setFilters(p => ({ ...p, industria: e.target.value }))}
                                    className="font-['Roboto'] text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors min-w-[140px]"
                                >
                                    <option value="Todos">Todas Indústrias</option>
                                    {industryOptions.map(ind => (
                                        <option key={ind.for_codigo} value={ind.for_codigo}>
                                            {ind.for_nomered}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Client Selector */}
                    {showClientFilter && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cliente</label>
                                    <div className="group relative">
                                        <HelpCircle size={10} className="text-slate-300 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                                            Visualize o comportamento de um cliente individual ou grupo.
                                        </div>
                                    </div>
                                </div>
                                <select
                                    value={filters.cliente}
                                    onChange={(e) => setFilters(p => ({ ...p, cliente: e.target.value }))}
                                    className="font-['Roboto'] text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors min-w-[140px]"
                                >
                                    <option value="Todos">Todos Clientes</option>
                                    {clientOptions.map(cli => (
                                        <option key={cli.cli_codigo} value={cli.cli_codigo}>
                                            {cli.cli_nomred}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Metric Selector */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Visão</label>
                                <div className="group relative">
                                    <Info size={10} className="text-slate-300 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
                                        Alterne entre valores financeiros ou volume físico.
                                    </div>
                                </div>
                            </div>
                            <select
                                value={filters.metrica}
                                onChange={(e) => setFilters(p => ({ ...p, metrica: e.target.value }))}
                                className="font-['Roboto'] text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                            >
                                <option value="valor">Financeiro (R$)</option>
                                <option value="quantidade">Volume (Qtd)</option>
                                <option value="unidades">Unidades (Un)</option>
                            </select>
                        </div>
                    </div>

                    {/* Real-time indicator & Refresh Button */}
                    <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-1">
                            <Activity size={10} className="animate-pulse" />
                            <span className="font-['Roboto'] text-[9px] font-black uppercase tracking-widest">Live Flow</span>
                        </div>

                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider group active:scale-95 border border-blue-500/50"
                        >
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500 text-white" />
                            <span className="!text-white">Atualizar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Central Panel - Fixed Height with Internal Scroll */}
            <div className="bg-white h-[70vh] rounded-2xl shadow-sm border border-slate-200 mb-8 relative z-0 overflow-hidden">
                {/* Smart Lazy Loading: Renderiza apenas se já foi visitada, esconde se não está ativa */}

                {visitedTabs.has('VISAO_GERAL') && (
                    <div className={`${activePage === 'VISAO_GERAL' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <OverviewTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('INDUSTRIAS') && (
                    <div className={`${activePage === 'INDUSTRIAS' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <IndustriasTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('CLIENTES') && (
                    <div className={`${activePage === 'CLIENTES' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <ClientesTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('ESTATISTICAS') && (
                    <div className={`${activePage === 'ESTATISTICAS' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <AnalyticsTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('CURVA_ABC') && (
                    <div className={`${activePage === 'CURVA_ABC' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <CurvaABCTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('METAS') && (
                    <div className={`${activePage === 'METAS' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <MetasTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('EQUIPE') && (
                    <div className={`${activePage === 'EQUIPE' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <EquipeTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {visitedTabs.has('PRODUTOS') && (
                    <div className={`${activePage === 'PRODUTOS' ? 'block' : 'hidden'} h-full overflow-y-auto`}>
                        <ProdutosTab filters={filters} refreshTrigger={refreshTrigger} />
                    </div>
                )}

                {/* Fallback for other tabs */}
                {!['VISAO_GERAL', 'INDUSTRIAS', 'CLIENTES', 'ESTATISTICAS', 'CURVA_ABC', 'METAS', 'EQUIPE', 'PRODUTOS'].includes(activePage) && (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-slate-400">
                        <Target size={48} className="mb-4 text-slate-200" />
                        <p className="text-lg font-medium">Módulo: {activeItem.label}</p>
                        <p className="text-sm">Em desenvolvimento</p>
                    </div>
                )}
            </div>

            {/* Scroll Indicator Arrow - Shows when there's more content */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-60 pointer-events-none z-40">
                <div className="w-5 h-5 border-b-2 border-r-2 border-slate-400 rotate-45 -mb-1"></div>
                <span className="text-[8px] text-slate-400 font-medium mt-1">Mais insights</span>
            </div>

            {/* Bottom Menu - Dynamic PageControl - FULL HD Quality */}
            <div className="fixed bottom-6 left-[calc(50%+9rem)] -translate-x-1/2 z-50">
                <div
                    className="bg-[#0c4545] border border-teal-400/40 shadow-lg shadow-teal-900/40 rounded-full px-5 py-2.5 flex items-center gap-1"
                    style={{
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'geometricPrecision',
                        willChange: 'transform',
                        transform: 'translate3d(0, 0, 0)',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    {menuItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                                    flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-[rgba(0,180,180,0.15)] border border-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.2)] scale-[1.02]'
                                        : 'bg-transparent border border-transparent hover:bg-teal-400/10 hover:border-teal-400/20 hover:scale-[1.02]'
                                    }
                                `}
                                style={{
                                    WebkitFontSmoothing: 'antialiased',
                                    textRendering: 'geometricPrecision'
                                }}
                            >
                                {React.cloneElement(item.icon, {
                                    size: 18,
                                    className: `transition-colors duration-300 ${item.color}`,
                                    style: { shapeRendering: 'geometricPrecision' }
                                })}

                                <span
                                    className={`font-['Roboto'] text-[12px] font-medium uppercase tracking-wide transition-colors duration-300 !text-white`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default IntelligencePage;
