import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    TrendingUp,
    Users,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    BrainCircuit,
    BarChart3,
    Target,
    LayoutGrid,
    Building2,
    UserCircle,
    Package,
    ChevronRight,
    Filter,
    Calendar,
    RefreshCw,
    CircleDashed
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const BiGreenfield = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('visao-geral');
    const [selectedYear, setSelectedYear] = useState(2026);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const tabs = [
        { id: 'visao-geral', label: 'VISÃO GERAL', icon: LayoutGrid, iconColor: 'text-slate-800' },
        { id: 'industrias', label: 'INDÚSTRIAS', icon: Building2, iconColor: 'text-[#10B981]' },
        { id: 'clientes', label: 'CLIENTES', icon: Users, iconColor: 'text-[#3B82F6]' },
        { id: 'estatisticas', label: 'ESTATÍSTICAS', icon: BarChart3, iconColor: 'text-[#818CF8]' },
        { id: 'curva-abc', label: 'CURVA ABC', icon: TrendingUp, iconColor: 'text-[#F59E0B]' },
        { id: 'metas', label: 'METAS', icon: Target, iconColor: 'text-[#F43F5E]' },
        { id: 'equipe', label: 'EQUIPE', icon: UserCircle, iconColor: 'text-[#A855F7]' },
        { id: 'produtos', label: 'PRODUTOS', icon: Package, iconColor: 'text-[#06B6D4]' },
    ];

    const chartData = [
        { name: 'Jan', value: 4000 },
        { name: 'Fev', value: 3000 },
        { name: 'Mar', value: 2000 },
        { name: 'Abr', value: 2780 },
        { name: 'Mai', value: 1890 },
        { name: 'Jun', value: 2390 },
        { name: 'Jul', value: 3490 },
    ];

    const brandData = [
        { name: 'VIEMAR', share: 30, logo: 'https://viemar.com.br/wp-content/uploads/2021/05/Logo-Viemar-Automotive.png' },
        { name: 'IMA', share: 22, logo: 'https://img.image_grid.com/ind/ima.png' },
        { name: 'FUCHS', share: 18, logo: 'https://img.image_grid.com/ind/fuchs.png' },
        { name: 'MTE-THOMSON', share: 12, logo: 'https://img.image_grid.com/ind/mte.png' },
        { name: 'SAMPEL', share: 10, logo: 'https://img.image_grid.com/ind/sampel.png' },
        { name: 'SYL', share: 8, logo: 'https://img.image_grid.com/ind/syl.png' },
    ];

    // --- Component: Compact Legacy Styled KPI Card ---
    const KpiCardCompact = ({ title, value, change }) => (
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-[0.1em] mb-1">{title}</span>
            <h3 className="text-sm font-black text-[#1E293B] tracking-tight mb-1">{value}</h3>
            <div className={`flex items-center gap-1 text-[8px] font-black ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className="opacity-60">M-1:</span>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="p-5 rounded-[2rem] bg-emerald-600 shadow-2xl shadow-emerald-600/30"
                >
                    <BrainCircuit className="w-10 h-10 text-white" />
                </motion.div>
                <div className="mt-8 flex flex-col items-center gap-3">
                    <h2 className="text-[#10B981] font-black tracking-[0.3em] uppercase text-xs">Greenfield Engine</h2>
                    <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="h-full w-full bg-[#10B981] shadow-[0_0_10px_#10B981]"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#F8FAFC] overflow-y-auto custom-scrollbar flex flex-col">

            {/* --- HEADER --- */}
            <header className="px-8 pt-6 pb-2 bg-white/40 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
                <div className="max-w-[1700px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
                        <div className="flex items-start gap-4">
                            <motion.div className="p-3.5 bg-[#10B981] rounded-[1.5rem] shadow-2xl relative">
                                <Zap className="w-7 h-7 text-white" />
                            </motion.div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl font-black text-[#1E293B] tracking-tight">BI Intelligence</h1>
                                    <div className="flex gap-1.5">
                                        <span className="px-3 py-1 bg-[#FEF9C3] text-[#92400E] text-[10px] font-medium rounded-md border border-[#FEF08A] shadow-sm italic">PREMIUM</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded-md border border-slate-200 uppercase">V3.0 Greenfield</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Plataforma de Análise Estratégica & Performance</p>
                            </div>
                        </div>

                        {/* NOVO GLOBAL FILTERS - MATCH PRINT */}
                        <div className="bg-white rounded-[1rem] p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col xl:flex-row xl:items-start justify-between gap-8 flex-1 xl:max-w-max">
                            {/* Left/Middle Section Wrapper */}
                            <div className="flex flex-col md:flex-row gap-8 xl:gap-12">
                                {/* Referência */}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REFERÊNCIA</span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            {[2026, 2025, 2024, 2023].map(y => (
                                                <button
                                                    key={y}
                                                    onClick={() => setSelectedYear(y)}
                                                    className={`px-4 py-1.5 text-xs font-bold rounded-[0.5rem] border transition-all ${y === selectedYear ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    {y}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-2 ml-1">
                                            <label className="flex items-center gap-2 cursor-pointer group w-max">
                                                <div className="relative flex items-center">
                                                    <input type="checkbox" className="peer appearance-none w-3.5 h-3.5 rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                                                    <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white left-0.5"><Zap className="w-2 h-2 fill-current" /></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">ANO TODO</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer ml-5 w-max group">
                                                <div className="relative flex items-center">
                                                    <input type="checkbox" className="peer appearance-none w-3.5 h-3.5 rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                                                    <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white left-0.5"><Users className="w-2 h-2 fill-current" /></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">REDE DE LOJAS</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Período & Visão */}
                                <div className="flex gap-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PERÍODO</span>
                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold">i</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <input type="text" value="01/01/2025" readOnly className="pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-[0.5rem] outline-none hover:border-slate-300 focus:border-blue-500 w-[110px] shadow-sm transition-colors cursor-pointer" />
                                                <Calendar className="w-4 h-4 text-slate-800 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">até</span>
                                            <div className="relative">
                                                <input type="text" value="31/12/2025" readOnly className="pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-[0.5rem] outline-none hover:border-slate-300 focus:border-blue-500 w-[110px] shadow-sm transition-colors cursor-pointer" />
                                                <Calendar className="w-4 h-4 text-slate-800 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VISÃO</span>
                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold">i</div>
                                        </div>
                                        <div className="relative">
                                            <select className="appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-[0.5rem] outline-none hover:border-slate-300 focus:border-blue-500 w-36 cursor-pointer shadow-sm transition-colors">
                                                <option>Financeiro (R$)</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1L5 5L9 1" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section: Atualizar */}
                            <div className="flex flex-col items-center xl:items-end gap-3 mt-4 xl:mt-0 xl:pt-1">
                                <div className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 xl:mr-1">
                                    <Zap className="w-3 h-3 fill-current" />
                                    <span className="text-[10px] font-black tracking-widest uppercase">LIVE FLOW</span>
                                </div>
                                <button className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-8 py-2.5 rounded-[0.6rem] transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5">
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-sm font-black tracking-[0.05em] uppercase">ATUALIZAR</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs - CENTERED */}
            <div className="sticky top-0 z-40 px-8 py-4 bg-[#F8FAFC]/90 backdrop-blur-lg">
                <div className="max-w-[1700px] mx-auto flex justify-center">
                    <div className="bg-[#123E3A] border border-[#115E59]/30 rounded-full p-2.5 flex items-center shadow-[0_10px_30px_-5px_rgba(18,62,58,0.4)]">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 border ${activeTab === tab.id
                                        ? 'bg-[#0F5A53] border-[#10B981]/40 text-white font-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                        : 'bg-transparent border-transparent text-white font-black hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.iconColor : tab.iconColor}`} />
                                    <span className="text-[10px] tracking-widest uppercase">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 px-8 pb-12 pt-2">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1700px] mx-auto">

                        {activeTab === 'visao-geral' && (
                            <div className="space-y-4">

                                {/* 1. AI Narrative Card */}
                                <div className="bg-gradient-to-br from-[#064e4b] to-[#012423] rounded-[2rem] p-6 relative overflow-hidden shadow-2xl border border-emerald-400/20">
                                    <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                                        <div className="p-4 bg-white/10 backdrop-blur-3xl rounded-[1.5rem] border border-white/10"><Zap className="w-8 h-8 text-amber-300 animate-pulse" /></div>
                                        <div className="flex-1">
                                            <div className="px-3 py-1 bg-[#FEF9C3] text-[#92400E] text-[10px] font-medium uppercase tracking-[0.1em] rounded-md inline-block mb-3 shadow-sm border border-[#FEF08A]">Análise AI</div>
                                            <h2 className="text-xl font-black mb-1 tracking-tight text-[#FFFFFF]">Foco Estratégico: <span className="text-amber-300 underline decoration-[#EAB308]">Indústria Bertolini</span></h2>
                                            <p className="text-[#F8FAFC] text-xs leading-relaxed max-w-2xl font-bold opacity-90">
                                                Crescimento de 12% projetado. Verticalização da linha Premium em clientes Curva A impulsionando o ticket.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-6 py-3 bg-[#10B981] text-[#022c22] font-black text-[10px] uppercase rounded-xl shadow-lg">Pipeline</button>
                                            <button className="px-6 py-3 bg-white/10 text-white font-black text-[10px] uppercase rounded-xl border border-white/20">Relatório</button>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. MARKET SHARE & KPI Cluster - Re-compacted in same row */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                                    {/* Market Share Bubble Grid - MATCH PRINT 1 */}
                                    <div className="xl:col-span-8 bg-[#09332D] p-6 rounded-[1rem] flex flex-col items-center justify-center shadow-lg relative min-h-[180px]">
                                        <h3 className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em] mb-6">MARKET SHARE: TOP 6 INDÚSTRIAS - PERFORMANCE</h3>
                                        <div className="flex items-center justify-center w-full gap-4 md:gap-8 px-4 flex-wrap mt-[20px]">
                                            {brandData.map((brand, i) => {
                                                const size = 60 + (brand.share * 1.5);
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        whileHover={{ scale: 1.1, y: -4 }}
                                                        style={{ width: size, height: size }}
                                                        className="rounded-full border-[1.5px] border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center p-1.5 cursor-pointer flex-shrink-0"
                                                    >
                                                        <div className="w-full h-full rounded-full border border-slate-500/30 bg-gradient-to-b from-[#112332] to-[#040D17] flex items-center justify-center p-2 relative overflow-hidden">
                                                            <img
                                                                src={brand.logo}
                                                                alt={brand.name}
                                                                className="max-w-[85%] max-h-[85%] object-contain"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'block';
                                                                }}
                                                            />
                                                            <span className="text-[8px] font-black text-white text-center leading-tight hidden">{brand.name}</span>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* KPI Cluster in same line */}
                                    <div className="xl:col-span-4 grid grid-cols-2 gap-3">
                                        <KpiCardCompact title="Faturamento" value="R$ 35.4M" change={11.4} />
                                        <KpiCardCompact title="Qtd. Pedidos" value="2.090" change={12.4} />
                                        <KpiCardCompact title="Clientes" value="141" change={21.6} />
                                        <KpiCardCompact title="Quantidades" value="791.5K" change={33.8} />
                                    </div>
                                </div>

                                {/* 3. Goals Bar Optimized */}
                                <div className="bg-[#0b3b3a] px-6 py-3 rounded-[1.5rem] border border-emerald-800/60 shadow-inner flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <CircleDashed className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                                        <span className="text-[8px] font-black text-emerald-100/60 uppercase tracking-widest">METAS ATINGIDAS (YTD)</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                                        {[
                                            { label: 'BOA', val: '0.0%', lack: 'R$ 1.1M', color: 'text-emerald-400' },
                                            { label: 'BOEING', val: '0.0%', lack: 'R$ 870k', color: 'text-emerald-400' },
                                            { label: 'UMBRELLA', val: '79.0%', lack: 'R$ 159k', color: 'text-amber-400' },
                                            { label: 'WALMART', val: '0.0%', lack: 'R$ 1.1M', color: 'text-emerald-400' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-[#FFFFFF]">{item.label}</span>
                                                <span className={`text-[9px] font-black ${item.color}`}>{item.val}</span>
                                                <div className="flex items-center gap-1 bg-slate-900/40 px-1.5 py-0.5 rounded border border-white/5">
                                                    <span className="text-[7px] font-bold text-rose-400/80">FALTA</span>
                                                    <span className="text-[8px] font-black text-rose-100">{item.lack}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Charts Bottom Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Area Chart */}
                                    <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm h-[320px] flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-black text-[#1E293B] tracking-tight">Curva de Faturamento</h3>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">SÉRIE HISTÓRICA CONSOLIDADA</p>
                                        </div>
                                        <div className="flex-1 w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                                    <YAxis hide />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fill="url(#colorMain)" dot={{ r: 3, fill: '#fff', stroke: '#2563EB', strokeWidth: 2 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Industry Performance Bars */}
                                    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm h-[320px] flex flex-col">
                                        <h3 className="text-sm font-black text-[#1E293B] tracking-tight mb-4 uppercase">Performance Industrial</h3>
                                        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                                            {[
                                                { name: "Bertolini S.A", val: 82, color: "bg-emerald-500" },
                                                { name: "Móveis Finger", val: 68, color: "bg-blue-500" },
                                                { name: "Ferramentas Star", val: 45, color: "bg-amber-500" },
                                                { name: "Plásticos Total", val: 32, color: "bg-indigo-500" },
                                            ].map((ind, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-[10px] font-black text-[#1E293B] mb-1.5 px-1 truncate">
                                                        <span>{ind.name}</span>
                                                        <span>{ind.val}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${ind.val}%` }} className={`h-full ${ind.color}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'visao-geral' && (
                            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center">
                                    <Zap className="w-12 h-12 text-[#10B981] mb-4" />
                                    <h2 className="text-xl font-black text-[#1E293B] mb-1 uppercase tracking-tighter">Greenfield Intel</h2>
                                    <p className="text-slate-500 text-xs max-w-sm mb-6">Módulo em calibração estratégica para o padrão 2026.</p>
                                    <button className="px-8 py-3 bg-[#10B981] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Roadmap</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default BiGreenfield;
