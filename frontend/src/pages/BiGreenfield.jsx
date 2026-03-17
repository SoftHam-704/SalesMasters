import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    Sparkles,
    TrendingUp,
    Users,
    Search,
    Zap,
    BrainCircuit,
    BarChart3,
    Target,
    LayoutGrid,
    Building2,
    UserCircle,
    Package,
    ChevronRight,
    RefreshCw,
    CircleDashed,
    Calendar,
    ArrowUpRight,
    Plus
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

// --- Aura Sub-Components ---

// Flashlight Card Effect
const FlashlightCard = ({ children, className = "" }) => {
    const cardRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={`flashlight-card relative overflow-hidden ${className}`}
            style={{
                "--mouse-x": `${position.x}px`,
                "--mouse-y": `${position.y}px`,
            }}
        >
            <div className="relative z-10 h-full w-full">{children}</div>
        </div>
    );
};

// Metric Card with Aura Aesthetic
const MetricCardAura = ({ title, value, change, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <FlashlightCard className="p-6 bg-white/80 backdrop-blur-xl border border-stone-200 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-stone-100 rounded-2xl">
                    <Icon className="w-5 h-5 text-stone-600" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full border ${change >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(change)}%
                </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 block mb-1">{title}</span>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-display font-medium text-stone-900 tracking-tight">{value}</h3>
            </div>
        </FlashlightCard>
    </motion.div>
);

// Advanced Industry Bubble Cluster (Magnetic Bubble Packing "Caracol")
const IndustryBubbleClusterAura = ({ data }) => {
    const [nodes, setNodes] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Estratégia de Slots Fixos (Centros exatos conforme solicitado)
        const fixedSlots = [
            { id: "mob", size: 201, x: 185, y: 240 }, // Bolha 1 (Principal)
            { id: "ima", size: 163, x: 364, y: 192 }, // Bolha 2 (IMA)
            { id: "urb", size: 150, x: 256, y: 75 },  // Bolha 3 (Superior R)
            { id: "aut", size: 140, x: 108, y: 87 },  // Bolha 4 (Superior L)
            { id: "igu", size: 115, x: 32, y: 192 },  // Bolha 5 (Médio L)
            { id: "dri", size: 100, x: 42, y: 301 }   // Bolha 6 (WEL)
        ];

        const sorted = [...data].sort((a, b) => (parseFloat(b.revenue) || 0) - (parseFloat(a.revenue) || 0));

        const positioned = sorted.slice(0, 6).map((node, i) => ({
            ...node,
            ...fixedSlots[i]
        }));

        setNodes(positioned);
    }, [data]);

    if (!nodes.length) return null;

    return (
        <div
            className="relative w-full h-full flex items-center justify-center overflow-visible auraCluster"
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {/* Background Aura Glow */}
            <div className="absolute w-[450px] h-[450px] bg-cyan-500/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {nodes.map((node, i) => (
                <motion.div
                    key={node.name}
                    className="bubble absolute cursor-pointer"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: (hoveredIndex !== null && hoveredIndex !== i) ? 0.35 : 1
                    }}
                    whileHover={{
                        scale: 1.08,
                        zIndex: 1000
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 18,
                        delay: i * 0.06
                    }}
                    style={{
                        width: node.size,
                        height: node.size,
                        left: node.x - node.size / 2,
                        top: node.y - node.size / 2,
                        zIndex: 500 - Math.round(node.size),
                        animation: `auraFloat ${6 + i}s ease-in-out infinite`
                    }}
                >
                    <div
                        className="w-full h-full rounded-full bg-[#052c3f] border-2 border-[#00d4ff] flex items-center justify-center shadow-[0_18px_40px_rgba(0,0,0,0.25),inset_0_2px_3px_rgba(255,255,255,0.12)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(0,200,255,0.7),0_0_70px_rgba(0,200,255,0.25)]"
                    >
                        <div className="flex flex-col items-center justify-center p-6 transition-all duration-700">
                            {node.logo ? (
                                <img
                                    src={node.logo}
                                    alt={node.name}
                                    className="max-w-[65%] object-contain pointer-events-none brightness-110 contrast-125"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="font-display text-base font-bold text-white tracking-tight leading-none mb-1">{node.name.slice(0, 3)}</span>
                                    <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-widest leading-none">{node.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes auraFloat {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-2px); }
                    100% { transform: translateY(0px); }
                }
                .auraCluster:hover .bubble { opacity: 0.35; }
                .auraCluster .bubble:hover { opacity: 1; }
            `}} />
        </div>
    );
};

const GoalsScrollerAura = () => {
    const goals = [
        { label: 'BOA', val: '0.0%', lack: 'R$ 1.1M', status: 'critical' },
        { label: 'BOEING', val: '0.0%', lack: 'R$ 870k', status: 'critical' },
        { label: 'UMBRELLA', val: '79.0%', lack: 'R$ 159k', status: 'warning' },
        { label: 'WALMART', val: '0.0%', lack: 'R$ 1.1M', status: 'critical' },
        { label: 'SAMPEL', val: '45.0%', lack: 'R$ 200k', status: 'warning' },
        { label: 'VIEMAR', val: '92.0%', lack: 'R$ 45k', status: 'good' },
    ];

    const displayGoals = [...goals, ...goals];

    return (
        <div className="bg-white/60 backdrop-blur-xl border-y border-stone-200 py-10 overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#EAEAE5] to-transparent z-20" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#EAEAE5] to-transparent z-20" />

            <div className="flex items-center gap-6 mb-6 px-12 relative z-10">
                <CircleDashed className="w-5 h-5 text-emerald-500 animate-spin-slow" />
                <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-[0.4em]">Metas das Indústrias: Performance de Campo (YTD)</span>
            </div>

            <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {displayGoals.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-16 mx-12 border-l border-stone-200 pl-12 overflow-hidden group/item">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-stone-900 group-hover/item:text-emerald-600 transition-colors uppercase tracking-widest">{goal.label}</span>
                            <div className="flex items-center gap-4">
                                <span className={`text-xl font-display font-medium ${goal.status === 'warning' ? 'text-amber-500' : goal.status === 'good' ? 'text-emerald-500' : 'text-stone-400'}`}>{goal.val}</span>
                                <div className="h-1.5 w-16 bg-stone-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${goal.status === 'warning' ? 'bg-amber-500' : goal.status === 'good' ? 'bg-emerald-500' : 'bg-stone-400'}`} style={{ width: goal.val }} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-rose-400/80 uppercase tracking-tighter">Faltante</span>
                            <span className="text-xs font-mono font-bold text-stone-600">{goal.lack}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BiGreenfield = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('visao-geral');
    const [selectedYear, setSelectedYear] = useState(2026);
    const [summaryData, setSummaryData] = useState(null);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/v2/greenfield/summary`, {
                params: { ano: selectedYear }
            });
            if (response.data.success) {
                setSummaryData(response.data.data);
            }
        } catch (error) {
            console.error("❌ Erro ao buscar dados Greenfield:", error);
        } finally {
            // Pequeno delay para a animação do loader
            setTimeout(() => setLoading(false), 800);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const tabs = [
        { id: 'visao-geral', label: 'Visão Geral', icon: LayoutGrid },
        { id: 'industrias', label: 'Indústrias', icon: Building2 },
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
        { id: 'curva-abc', label: 'Curva ABC', icon: TrendingUp },
        { id: 'metas', label: 'Metas', icon: Target },
        { id: 'equipe', label: 'Equipe', icon: UserCircle },
        { id: 'produtos', label: 'Produtos', icon: Package },
    ];

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#E7E5E4] aura-bg overflow-hidden relative">
                <div className="noise" />
                <div className="bg-grid opacity-20" />
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="p-10 bg-white border border-stone-200 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <BrainCircuit className="w-12 h-12 text-stone-900 relative z-10" />
                    </div>
                    <div className="mt-12 flex flex-col items-center gap-3">
                        <span className="text-[11px] font-mono tracking-[0.5em] uppercase text-stone-500 font-bold">Iniciando Greenfield...</span>
                        <div className="h-[1.5px] w-48 bg-stone-200 rounded-full relative overflow-hidden">
                            <motion.div
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-emerald-500 shadow-[0_0_10px_#10B981]"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Fallbacks para dados vazios
    const kpis = summaryData?.kpis || {};
    const brandData = summaryData?.top_industries?.length > 0 ? summaryData.top_industries : [];
    const chartData = summaryData?.chart_data?.length > 0 ? summaryData.chart_data : [];

    return (
        <div className="h-full bg-[#EAEAE5] aura-bg overflow-y-auto custom-scrollbar flex flex-col relative font-sans text-stone-900 selection:bg-stone-900 selection:text-white">
            <div className="noise" />
            <div className="bg-grid opacity-10" />

            {/* --- HEADER --- */}
            <header className="px-12 pt-12 pb-6 relative z-10">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-stone-900" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-display font-medium tracking-tighter text-stone-900">Greenfield BI</h1>
                                <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest">Master Intelligence</div>
                            </div>
                            <p className="text-stone-400 text-xs font-mono uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Monitoramento em tempo real
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex bg-white/40 backdrop-blur-xl border border-stone-200 p-1.5 rounded-2xl">
                            {[2024, 2025, 2026].map((y) => (
                                <button
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-8 py-2.5 text-xs font-mono font-bold rounded-lg transition-all ${y === selectedYear ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
                                        }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                        <div className="h-8 w-[1px] bg-stone-200" />
                        <div className="flex items-center gap-4 px-3 cursor-pointer group">
                            <Calendar className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-tighter">Período Customizado</span>
                                <span className="text-xs font-mono font-bold text-stone-600">01 JAN - 31 DEZ</span>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="bg-white border border-stone-200 text-stone-900 p-4 rounded-xl hover:bg-stone-50 transition-colors shadow-sm active:scale-95 group"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CENTERED NAVIGATION --- */}
            <div className="px-12 py-4">
                <div className="max-w-[1600px] mx-auto flex justify-center">
                    <nav className="flex items-center gap-3 overflow-x-auto no-scrollbar p-1.5 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-10 py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-white border-stone-300 text-stone-900 shadow-md scale-[1.02]' : 'text-stone-400 border-transparent hover:text-stone-600 hover:bg-white/40'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <main className="flex-1 px-12 pb-24 relative z-10 mt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-[1600px] mx-auto space-y-12"
                    >
                        {activeTab === 'visao-geral' ? (
                            <div className="space-y-12">
                                {/* KPI Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <MetricCardAura
                                        title="Vendas Totais"
                                        value={formatCurrency(kpis?.vendas?.val)}
                                        change={kpis?.vendas?.change}
                                        icon={Zap}
                                        delay={0.1}
                                    />
                                    <MetricCardAura
                                        title="Clientes Atendidos"
                                        value={kpis?.clientes?.val || 0}
                                        change={kpis?.clientes?.change}
                                        icon={Users}
                                        delay={0.2}
                                    />
                                    <MetricCardAura
                                        title="Ticket Médio"
                                        value={formatCurrency(kpis?.ticket?.val)}
                                        change={kpis?.ticket?.change}
                                        icon={TrendingUp}
                                        delay={0.3}
                                    />
                                    <MetricCardAura
                                        title="Pedidos Realizados"
                                        value={kpis?.pedidos?.val || 0}
                                        change={kpis?.pedidos?.change}
                                        icon={BarChart3}
                                        delay={0.4}
                                    />
                                </div>

                                {/* Goals Scroller */}
                                <GoalsScrollerAura />

                                {/* Slide 3 Style Graph Card */}
                                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                    <div className="lg:col-span-8 bg-white border border-stone-200 rounded-[3.5rem] p-12 shadow-sm relative overflow-hidden group flex flex-col h-[580px]">
                                        <div className="flex justify-between items-start mb-12 relative z-10">
                                            <div className="space-y-2">
                                                <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-[0.3em]">Total Revenue Analysis</span>
                                                <h2 className="text-7xl font-display font-medium tracking-tighter text-stone-900">{formatCurrency(kpis?.vendas?.val)}</h2>
                                            </div>
                                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 text-xs font-mono font-bold">
                                                <Target className="w-4 h-4 text-emerald-500" />
                                                <span>META MENSAL ATINGIDA</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 relative z-10 w-full min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                                                        dy={10}
                                                    />
                                                    <YAxis hide />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#FFFFFF',
                                                            borderRadius: '1.5rem',
                                                            border: '1px solid #E5E7EB',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                            fontWeight: 700,
                                                            fontSize: '11px'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="valor"
                                                        stroke="#10B981"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorSales)"
                                                        animationDuration={2000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between relative z-10 pt-8 border-t border-stone-100">
                                            <div className="flex gap-12">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Growth rate</span>
                                                    <span className="text-xl font-display font-bold text-stone-900">+24.5%</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Active clients</span>
                                                    <span className="text-xl font-display font-bold text-stone-900">1,240</span>
                                                </div>
                                            </div>
                                            <button className="flex items-center gap-3 bg-stone-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-95">
                                                View Complete Report
                                            </button>
                                        </div>
                                    </div>

                                    {/* Industry Bubble Cluster (THE CARACOL) */}
                                    <div className="lg:col-span-4 bg-white border border-stone-200 rounded-[3.5rem] p-12 shadow-sm relative overflow-hidden h-[580px] flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-[0.2em]">Top 6 Indústrias</h4>
                                            <CircleDashed className="w-4 h-4 text-stone-300" />
                                        </div>
                                        <div className="flex-1 relative">
                                            {brandData.length > 0 ? (
                                                <IndustryBubbleClusterAura data={brandData} />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-stone-300 font-mono text-[10px]">Aguardando dados...</div>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-stone-400 font-mono text-center pt-8 lowercase opacity-60 italic">Matriz de faturamento proporcional / aura cluster v2.4</p>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-white border border-stone-200 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-sm">
                                    <iconify-icon icon="solar:programming-bold-duotone" class="text-4xl text-stone-300"></iconify-icon>
                                </div>
                                <h3 className="text-3xl font-display font-medium text-stone-900 uppercase tracking-tighter">Engine Blueprinting</h3>
                                <p className="text-stone-400 text-sm font-mono mt-3 lowercase tracking-widest">Integrating high-density data matrices...</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default BiGreenfield;
