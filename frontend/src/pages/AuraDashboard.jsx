import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Users,
    Target,
    TrendingUp,
    ArrowRight,
    Flame,
    Sparkles,
    Cake,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    PieChart as PieChartIcon,
    AlertTriangle,
    Clock,
    ShieldAlert,
    RefreshCw,
    Info,
    Factory,
    UserCircle,
    Calendar as CalendarIcon,
    Maximize2,
    ChevronRight,
    Check,
    X,
    ChevronUp,
    ChevronDown,
    Settings,
    LineChart
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import DashboardAlertPanel from '../components/dashboard/DashboardAlertPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Combobox } from '../components/ui/combobox';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

import { SalesPerformanceTable } from '../components/dashboard/SalesPerformanceTable';
import MetasIndustriasTable from '../components/dashboard/MetasIndustriasTable';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, ComposedChart, CartesianGrid } from 'recharts';

// Import fonts via style tag for strict Design System adherence
const DesignSystemStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif !important; }
        .font-display { font-family: 'Space Grotesk', sans-serif !important; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        
        body { background-color: #EAEAE5 !important; font-family: 'Inter', sans-serif; }

        @keyframes auraBeamRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes auraSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .aura-beam-modal {
            background: #ffffff;
            border-radius: 32px;
            /* Removemos overflow: hidden aqui para que o :before que é inset -2 possa ser visto,
               mas o DialogContent já tem bordas, então usaremos inset 0 */
        }

        .aura-beam-modal::before {
            content: "";
            position: absolute;
            inset: 0px; 
            background: conic-gradient(from 0deg at 50% 50%, 
                transparent 0%, 
                rgba(99, 102, 241, 0.4) 25%, 
                transparent 50%, 
                rgba(139, 92, 246, 0.4) 75%, 
                transparent 100%
            );
            animation: auraBeamRotate 4s linear infinite;
            z-index: -1;
            pointer-events: none;
            border-radius: 32px; /* Acompanha o container */
        }

        .aura-spin-bg {
            animation: auraSpin 20s linear infinite;
        }

        .glass-card-insight {
            background: rgba(255, 255, 255, 0.6);
            backdrop-blur: 12px;
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;
        }

        /* flashlight-card-modal classes removed here to avoid conflicting with Tailwind's fixed and overflow-hidden in DialogContent */
        .flashlight-card-modal {}

        .flashlight-card-modal::after {
            content: "";
            position: absolute;
            inset: 0px;
            background: radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0),
                    rgba(255, 255, 255, 0.8),
                    transparent 40%);
            opacity: 0;
            transition: opacity 0.5s;
            pointer-events: none;
            z-index: 1;
        }

        .flashlight-card-modal:hover::after {
            opacity: 1;
        }
    ` }} />
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltipAura = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/50 p-4 rounded-3xl shadow-2xl shadow-stone-300/40 min-w-[180px]">
                <p className="text-[12px] font-black text-stone-900 mb-2 uppercase tracking-tight">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 py-1.5 border-t border-stone-100/50 first:border-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                            <span className="text-[13px] font-medium text-stone-600">{entry.name}</span>
                        </div>
                        <span className="text-[14px] font-bold text-stone-950 font-mono">
                            {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('r$') || entry.dataKey === 'vendas')
                                ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : entry.value.toLocaleString('pt-BR')}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const MetricCardAura = ({ title, value, change, mom, yoy, icon: Icon, delay = 0, onClick }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!cardRef.current) return;
            const { left, top } = cardRef.current.getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;
            cardRef.current.style.setProperty('--mouse-x', `${x}px`);
            cardRef.current.style.setProperty('--mouse-y', `${y}px`);
        };

        const card = cardRef.current;
        card?.addEventListener('mousemove', handleMouseMove);
        return () => card?.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            onClick={onClick}
            className="flashlight-card relative overflow-hidden bg-white border border-stone-200 rounded-xl p-3 cursor-pointer group hover:shadow-lg hover:border-stone-300 transition-all duration-500"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-900 group-hover:bg-stone-950 group-hover:text-white transition-colors duration-500">
                    <Icon size={14} />
                </div>

                <div className="flex items-center gap-2">
                    {mom !== undefined && (
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter mb-0.5">MoM</span>
                            <div className={`flex items-center gap-1 text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md border shadow-sm transition-all duration-500 ${Number(mom) >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                {Number(mom) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                <span>{Math.abs(Number(mom)).toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                    {yoy !== undefined && (
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter mb-0.5">YoY</span>
                            <div className={`flex items-center gap-1 text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md border shadow-sm transition-all duration-500 ${Number(yoy) >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                {Number(yoy) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                <span>{Math.abs(Number(yoy)).toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-0.5">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 transition-colors duration-500 font-display">
                    {title}
                </div>
                <div className="font-display text-xl font-black text-stone-950 tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-500 leading-none">
                    {value}
                </div>
            </div>
        </motion.div>
    );
};

const IndustryTicker = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Repetimos os dados para garantir que o scroller nunca fique vazio
    const displayData = [...data, ...data];

    return (
        <div className="w-full bg-white/40 backdrop-blur-xl border-b border-stone-200/60 py-3 overflow-hidden relative shadow-sm">
            <motion.div
                className="flex whitespace-nowrap w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 60,
                        ease: "linear",
                    },
                }}
            >
                {displayData.map((item, index) => {
                    const faturamento = Number(item.total_faturamento || 0);
                    const meta = Number(item.total_meta || 0);
                    const atingido = meta > 0 ? (faturamento / meta) * 100 : 0;
                    const faltante = meta - faturamento;
                    const isMetaBatida = faltante <= 0 && meta > 0;

                    return (
                        <div key={index} className="flex items-center gap-8 mx-10 group relative h-10">
                            {/* Industry Brand */}
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 transition-colors font-display">
                                    {item.for_nomered}
                                </span>
                                {/* Progress Bar Mini */}
                                {meta > 0 && (
                                    <div className="w-full h-[2px] bg-stone-100 mt-1 overflow-hidden rounded-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(atingido, 100)}%` }}
                                            className={`h-full ${isMetaBatida ? 'bg-emerald-500' : 'bg-stone-300'}`}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Values & Badges */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline gap-1.5 leading-none">
                                    <span className="text-[10px] font-mono text-stone-300 font-bold">R$</span>
                                    <span className="font-display font-black text-stone-900 tracking-tighter text-[16px]">
                                        {faturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>

                                {meta > 0 && (
                                    <div className={`px-2 py-1 rounded-lg flex items-center gap-2 border shadow-sm transition-all duration-500 ${isMetaBatida
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100/20'
                                        : 'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-100/20'
                                        }`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black uppercase tracking-tighter leading-none mb-0.5 opacity-60">
                                                {isMetaBatida ? 'Atingido' : 'Meta'}
                                            </span>
                                            <span className="text-[10px] font-mono font-black leading-none">
                                                {atingido.toFixed(1)}%
                                            </span>
                                        </div>
                                        {!isMetaBatida && (
                                            <div className="h-4 w-[1px] bg-rose-200/50 mx-0.5" />
                                        )}
                                        {!isMetaBatida && (
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase tracking-tighter leading-none mb-0.5 opacity-60">Faltam</span>
                                                <span className="text-[10px] font-mono font-black leading-none">
                                                    R$ {faltante.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        )}
                                        {isMetaBatida && <Sparkles size={12} className="text-emerald-500 animate-pulse" />}
                                    </div>
                                )}
                            </div>

                            {/* Divider Dot */}
                            <div className="w-1 h-1 rounded-full bg-stone-200 ml-2" />
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};


const StrategicInsightModal = ({ isOpen, onClose, data }) => {
    const modalRef = useRef(null);
    if (!data) return null;

    const handleMouseMove = (e) => {
        if (!modalRef.current) return;
        const { left, top } = modalRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        modalRef.current.style.setProperty('--mouse-x', `${x}px`);
        modalRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                ref={modalRef}
                onMouseMove={handleMouseMove}
                className="max-w-4xl p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white aura-beam-modal flashlight-card-modal group flex flex-col max-h-[90vh]"
            >
                <div className="bg-white rounded-[31px] overflow-hidden flex flex-col flex-1 min-h-0 relative z-10">
                    {/* Header - Modular Style */}
                    <div className="p-8 pb-6 border-b border-stone-100 relative overflow-hidden">
                        <div className="absolute top-4 right-8 aura-spin-bg opacity-5 pointer-events-none">
                            <Settings size={120} className="text-stone-900" />
                        </div>

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-900 shadow-inner group-hover:scale-110 transition-transform duration-700">
                                    <data.Icon size={24} style={{ color: data.color || '#44403c' }} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${data.typeClassName || 'bg-stone-50 text-stone-500 border-stone-200'}`}>{data.type}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${data.impactClassName || 'bg-stone-50 text-stone-500 border-stone-200'}`}>{data.impact}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-4xl font-black text-stone-900 font-display tracking-tight leading-none group-hover:translate-x-1 transition-transform duration-500">
                                            {data.title}
                                        </h2>
                                        {data.metricValue && (
                                            <span className="text-3xl font-black text-stone-300 font-mono tracking-tighter opacity-70">
                                                {data.metricValue}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-stone-900 border border-stone-800 !text-white rounded-full text-xs font-display font-medium hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <X size={14} /> FECHAR
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-6 pb-4 scrollbar-thin scrollbar-thumb-stone-200">
                        <p className="text-lg font-light text-stone-500 mb-8 leading-relaxed max-w-2xl font-sans">
                            {data.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="glass-card-insight p-8 rounded-[28px] border border-stone-100 relative group/info hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
                                <div className="flex items-center gap-2 text-rose-500 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                                        <X size={16} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Problema Atual</span>
                                </div>
                                <p className="text-sm font-bold text-stone-600 leading-relaxed italic pr-4">
                                    {data.problem}
                                </p>
                            </div>

                            <div className="glass-card-insight p-8 rounded-[28px] border border-stone-100 relative group/info hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
                                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <Check size={16} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ação Sugerida</span>
                                </div>
                                <p className="text-sm font-bold text-stone-700 leading-relaxed pr-4 font-sans">
                                    {data.solution}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-stone-50/50 p-6 rounded-[24px] border border-stone-100">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2 font-sans opacity-60">Frequência/Lógica</span>
                                <code className="text-[11px] font-mono font-bold text-stone-500 break-all leading-relaxed">{data.formula}</code>
                            </div>
                            <div className="bg-stone-50/50 p-6 rounded-[24px] border border-stone-100">
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2 font-sans opacity-60">Referência Real</span>
                                <span className="text-[12px] font-bold text-stone-900 group-hover:text-stone-950 transition-colors italic block mt-1">
                                    "{data.visualExample}"
                                </span>
                            </div>
                            <div className="bg-stone-50 p-6 rounded-[24px] border border-stone-200/60 relative overflow-hidden shadow-inner group/trigger">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 group-hover/trigger:w-2 transition-all" />
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2 font-sans opacity-60 ml-2">Gatilho de Decisão</span>
                                <span className="text-[12px] font-black text-amber-700 leading-tight block ml-2">{data.alertTrigger}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Premium AI Focus */}
                    <div className="p-8 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between flex-none">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/40 relative overflow-hidden">
                                <LineChart size={18} className="text-white animate-pulse relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-stone-800 to-stone-900" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-stone-900 font-display tracking-tight uppercase">SOFTHAM AI AGENT</span>
                                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Automating Commercial Intelligence</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-[10px] font-black text-stone-950 leading-none">V 3.0 PREVIEW</span>
                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Ready for Generation</span>
                            </div>
                            <button className="px-6 py-2.5 bg-stone-900 border border-stone-800 !text-white rounded-full text-[10px] font-display font-medium uppercase tracking-widest opacity-50 cursor-not-allowed">
                                Ativar IA Preditiva
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const InsightCardAura = ({ title, subtitle, icon: Icon, badge, type, color, children, helpData, metricValue }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white rounded-[32px] p-4 pt-3 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col h-full relative group/aura-card overflow-visible">
                <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-900 shadow-sm transition-transform group-hover/aura-card:scale-110 duration-500">
                            <Icon size={14} style={{ color: color || '#44403c' }} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-[10px] font-black text-stone-900 font-display uppercase tracking-tight leading-none">{title}</h3>
                            </div>
                            {type && <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-widest mt-0.5">{type}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {helpData && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[9px] font-black text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1 uppercase tracking-tighter"
                            >
                                <ChevronDown size={10} className="rotate-180" /> ver detalhes
                            </button>
                        )}
                        {badge && (
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black font-mono uppercase tracking-tighter ${badge.className}`}>
                                {badge.text}
                            </span>
                        )}
                    </div>
                </div>
                <div className="px-2 py-0 flex-1 relative flex flex-col items-center justify-center min-h-[90px] w-full">
                    {children}
                </div>
            </div>

            {helpData && (
                <StrategicInsightModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    data={{ ...helpData, Icon, color, title, type, metricValue }}
                />
            )}
        </>
    );
};

// 1. CONCENTRAÇÃO DE CARTEIRA (Donut Moderno)
const ConcentrationChart = ({ data }) => {
    const value = data?.value || 0;
    const totalPeriodo = data?.total_período || 0;
    const top3Total = data?.top_3_total || 0;
    const topCount = data?.top_count || 0;

    const chartData = [
        { name: 'Top 3', value: value, fill: value > 60 ? '#ef4444' : '#6366f1' },
        { name: 'Outros', value: 100 - value, fill: '#f5f5f4' }
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center group/chart relative">
            <div className="absolute top-0 left-0 right-0 flex justify-center gap-4 z-10">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: value > 60 ? '#ef4444' : '#6366f1' }} />
                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-tighter">Top 3</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-stone-100" />
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Outros</span>
                </div>
            </div>

            <div className="w-full h-[110px] mt-2 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={110}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="55%"
                            innerRadius={38}
                            outerRadius={50}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} cornerRadius={index === 0 ? 10 : 0} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/95 border border-stone-200 p-4 rounded-[24px] shadow-2xl z-[80] backdrop-blur-xl min-w-[220px]">
                                            <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-2 font-mono">Análise de Risco</p>
                                            <div className="space-y-3">
                                                <div className="flex justify-between gap-8 items-baseline">
                                                    <span className="text-[11px] font-bold text-stone-500 font-sans">Total Top 3:</span>
                                                    <span className="text-sm font-black text-stone-900 font-mono">
                                                        {top3Total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-8 items-baseline">
                                                    <span className="text-[11px] font-bold text-stone-500 font-sans">Total Geral:</span>
                                                    <span className="text-sm font-black text-stone-900 font-mono">
                                                        {totalPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                                <div className={`mt-3 text-[10px] font-bold italic p-3 rounded-xl border leading-relaxed shadow-inner flex items-start gap-2 ${value > 60 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                                                    <Sparkles size={12} className={`shrink-0 mt-0.5 ${value > 60 ? 'text-red-500' : 'text-orange-500'}`} />
                                                    <span>Aura Insight: {value > 60 ? "Alta dependência detectada. Diversificar recomendado." : "Concentração equilibrada."}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4 group-hover/chart:opacity-0 transition-opacity duration-300">
                    <span className="text-2xl font-black text-stone-950 leading-none font-display">{value}%</span>
                    <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight mt-1 font-mono">Concentric</span>
                </div>
            </div>
        </div>
    );
};

// 2. ATIVAÇÃO REAL (Custom Aura Pill Chart)
const ActivationBarChart = ({ data }) => {
    const [isHovered, setIsHovered] = useState(false);
    if (!data) return null;

    const chartData = [
        { name: 'Ativo', value: data.find(d => d.name === 'Ativo')?.value || 0, fill: '#10b981', label: '< 60 d' },
        { name: 'Dormindo', value: data.find(d => d.name === 'Dormindo')?.value || 0, fill: '#f59e0b', label: '60-120 d' },
        { name: 'Inativo', value: data.find(d => d.name === 'Inativo')?.value || 0, fill: '#ef4444', label: '> 120 d' }
    ];

    const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div
            className="w-full h-full flex flex-col pt-0 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* UNIFIED SMART HOVER */}
            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-[220px] bg-white/95 border border-stone-200 p-4 rounded-[28px] shadow-2xl z-[100] backdrop-blur-xl transition-all duration-500 pointer-events-none ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 border-b border-stone-100 pb-2 text-center italic">Monitor de Retenção</div>
                <div className="space-y-2">
                    {chartData.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-stone-50/50 p-1.5 rounded-xl">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="text-[10px] font-bold text-stone-600">{item.name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-stone-900 font-mono">{item.value}</span>
                                <span className="text-[8px] font-bold text-stone-400 px-1 bg-stone-100 rounded mt-0.5">{item.label}</span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 mt-1 border-t border-stone-100 flex justify-between items-center px-1">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Total Geral</span>
                        <span className="text-sm font-black text-stone-900 font-mono">{total}</span>
                    </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[8px] border-transparent border-t-white/95" />
            </div>

            <div className="flex-1 min-h-[110px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={110}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 800, fill: '#a8a29e' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 600, fill: '#d6d3d1' }}
                        />
                        <Tooltip content={<div className="hidden" />} />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            barSize={28}
                            animationDuration={1500}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// 3. RETENÇÃO / RISCO DE INATIVIDADE (Burnout List) - Compact & Premium
const RiskRetentionChart = ({ data }) => {
    const count = data?.count || 0;

    return (
        <div className="w-full flex flex-col items-center justify-center py-2">
            <div className="flex items-center justify-center bg-orange-50 w-24 h-24 rounded-full border-4 border-white shadow-xl shadow-orange-100 relative mb-2">
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-orange-600 leading-none">{count}</span>
                    <span className="text-[10px] text-orange-400 font-black uppercase tracking-tighter">Críticos</span>
                </div>
                {count > 0 && <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-ping opacity-75" />}
            </div>
        </div>
    );
};

// 4. CICLO DE RECOMPRA (Timeline Stats)
const RebuyCycleChart = ({ data }) => {
    const avgDays = data?.avg_days || 0;
    const expired = data?.expired_count || 0;
    return (
        <div className="w-full h-full flex flex-col items-center justify-center py-2">
            <div className="w-24 h-24 rounded-full border-4 border-stone-100 flex items-center justify-center flex-col relative mb-2 bg-purple-50 hover:bg-white transition-colors duration-500 shadow-inner">
                <span className="text-3xl font-black text-purple-700 tracking-tighter leading-none">{avgDays}d</span>
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Ciclo Médio</span>
                {expired > 0 && (
                    <div className="absolute -top-1 -right-1 bg-white border border-purple-100 px-2 py-0.5 rounded-full shadow-sm">
                        <span className="text-[10px] font-black text-purple-600">{expired}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// 5. SAÚDE DO CLIENTE (Trend 90d Bar) - Set 1 Concept
const CustomerHealthChart = ({ data }) => {
    if (!data) return null;
    const colors = { 'Crescendo': '#10b981', 'Estável': '#6366f1', 'Em Queda': '#ef4444' };
    const displayData = Object.keys(colors).map(name => ({
        name,
        value: data.find(d => d.name === name)?.value || 0
    }));

    return (
        <div className="w-full h-[110px] py-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={110}>
                <BarChart data={displayData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#78716c' }} axisLine={false} tickLine={false} />
                    <Tooltip
                        content={<CustomTooltipAura />}
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    />
                    <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// 6. MIX COVERAGE (Count Industries) - Set 1 Concept
const MixCoverageChart = ({ data }) => {
    if (!data) return null;
    return (
        <div className="w-full h-[110px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={110}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={40} innerRadius={25} paddingAngle={2} dataKey="value" labelLine={false}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b'][index % 3]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltipAura />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center">
                <p className="text-[10px] text-stone-900 font-bold uppercase tracking-tight font-sans">Cobertura de Indústrias</p>
            </div>
        </div>
    );
};

// 7. GAP DE MIX POR INDÚSTRIA (Horizontal Opportunity)
const IndustryGapChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.value)) || 1;
    return (
        <div className="w-full h-[110px] flex flex-col gap-2.5 py-1 justify-center">
            {data.slice(0, 3).map((item, index) => (
                <div key={index} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase font-mono">
                        <span className="text-stone-900 truncate max-w-[100px]">{item.industry}</span>
                        <span className="text-emerald-600 font-display">R$ {Math.round(item.value / 1000)}k</span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / maxVal) * 100}%` }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// 8. RANKING TOP 5 SKUs (Horizontal Bars) - Set 1 Concept
const TopSkusRankingChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.value)) || 1;
    return (
        <div className="w-full h-full flex flex-col gap-2 py-1 justify-center">
            {data.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-300 w-3 font-mono">{index + 1}</span>
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between text-[8px] font-black uppercase truncate mb-0.5 font-sans">
                            <span className="text-stone-900 truncate max-w-[110px]">{item.name}</span>
                            <span className="text-stone-400 font-mono">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / maxVal) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AuraDashboard = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Filter states
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedClient, setSelectedClient] = useState('');

    // Reference Data States
    const [industries, setIndustries] = useState([]);
    const [clients, setClients] = useState([]);

    // Data States
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Usuário');
    const [userInitials, setUserInitials] = useState('US');
    const [birthdayCount, setBirthdayCount] = useState(0);
    const [birthdays, setBirthdays] = useState([]);
    const [loadingBirthdays, setLoadingBirthdays] = useState(true);
    const [industryRevenue, setIndustryRevenue] = useState([]);
    const [isMetasModalOpen, setIsMetasModalOpen] = useState(false);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

    // Chart States
    const [salesComparison, setSalesComparison] = useState([]);
    const [quantitiesComparison, setQuantitiesComparison] = useState([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [loadingQuantities, setLoadingQuantities] = useState(true);

    // New Insights States
    const [insightsData, setInsightsData] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);

    useEffect(() => {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                if (user.nome) {
                    setUserName(user.nome);
                    const initials = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    setUserInitials(initials);
                }
            } catch (e) { console.error(e); }
        }
        fetchIndustries();
        fetchClients();
        fetchBirthdays();
    }, []);

    useEffect(() => {
        fetchDashboardMetrics();
        fetchBirthdays();
        fetchIndustryRevenue();
        fetchSalesComparison();
        fetchQuantitiesComparison();
        fetchAuraInsights();
    }, [selectedYear, selectedMonth, selectedIndustry, selectedClient]);

    const [showStrategicInfo, setShowStrategicInfo] = useState(false);

    const fetchAuraInsights = async () => {
        try {
            setLoadingInsights(true);
            const params = new URLSearchParams({ ano: selectedYear });
            if (selectedMonth) params.append('mes', selectedMonth);
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);
            if (selectedClient) params.append('cli_codigo', selectedClient);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/aura-insights?${params}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && data.data) {
                setInsightsData(data.data);
            } else {
                setInsightsData({
                    concentracao: {},
                    risco_inativacao: {},
                    ciclo: {},
                    gap: [],
                    ativacao: [],
                    saude: [],
                    top_skus: [],
                    mix_coverage: []
                });
            }
        } catch (error) {
            console.error('Erro ao buscar insights Aura:', error);
            setInsightsData(null);
        } finally {
            setLoadingInsights(false);
        }
    };

    const fetchBirthdays = async () => {
        try {
            setLoadingBirthdays(true);
            const mesBusca = selectedMonth || new Date().getMonth() + 1;
            const url = getApiUrl(NODE_API_URL, `/api/cli-aniv/birthdays?mes=${mesBusca}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setBirthdayCount(data.data?.length || 0);
                setBirthdays(data.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error);
        } finally {
            setLoadingBirthdays(false);
        }
    };

    const fetchIndustries = async () => {
        try {
            const url = getApiUrl(NODE_API_URL, `/api/dashboard/industries-list`);
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setIndustries(data.data);
        } catch (error) { console.error('Error fetching industries:', error); }
    };

    const fetchClients = async () => {
        try {
            const url = getApiUrl(NODE_API_URL, `/api/clients?limit=1000`);
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                const formatted = data.data.map(c => ({
                    value: String(c.cli_codigo),
                    label: c.cli_nomred || c.cli_nome
                }));
                setClients(formatted);
            }
        } catch (error) { console.error('Error fetching clients:', error); }
    };

    const fetchIndustryRevenue = async () => {
        try {
            const params = new URLSearchParams({ ano: selectedYear });
            if (selectedMonth) params.append('mes', selectedMonth);
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);
            if (selectedClient) params.append('cli_codigo', selectedClient);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/industry-revenue?${params}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setIndustryRevenue(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar faturamento por indústria:', error);
        }
    };

    const fetchDashboardMetrics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ ano: selectedYear });
            if (selectedMonth) params.append('mes', selectedMonth);
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);
            if (selectedClient) params.append('cli_codigo', selectedClient);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/metrics?${params}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) setMetrics(data.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchSalesComparison = async () => {
        try {
            setLoadingSales(true);
            const previousYear = selectedYear - 1;
            const params = new URLSearchParams({
                anoAtual: selectedYear,
                anoAnterior: previousYear
            });
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);
            if (selectedClient) params.append('cli_codigo', selectedClient);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/sales-comparison?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome ? item.mes_nome.substring(0, 3) : '???',
                    atual: Number(item.vendas_ano_atual || 0) / 1000,
                    anterior: Number(item.vendas_ano_anterior || 0) / 1000
                }));
                setSalesComparison(chartData);
            }
        } catch (error) { console.error(error); }
        finally { setLoadingSales(false); }
    };

    const fetchQuantitiesComparison = async () => {
        try {
            setLoadingQuantities(true);
            const previousYear = selectedYear - 1;
            const params = new URLSearchParams({
                anoAtual: selectedYear,
                anoAnterior: previousYear
            });
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);
            if (selectedClient) params.append('cli_codigo', selectedClient);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/quantities-comparison?${params}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome ? item.mes_nome.substring(0, 3) : '???',
                    atual: parseFloat(item.quantidade_ano_atual || 0),
                    anterior: parseFloat(item.quantidade_ano_anterior || 0)
                }));
                setQuantitiesComparison(chartData);
            }
        } catch (error) { console.error(error); }
        finally { setLoadingQuantities(false); }
    };





    // Derived states for UI
    const YEARS = [2022, 2023, 2024, 2025, 2026];
    const MONTHS = [
        { value: 1, label: 'Jan' }, { value: 2, label: 'Fev' }, { value: 3, label: 'Mar' },
        { value: 4, label: 'Abr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Set' },
        { value: 10, label: 'Out' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dez' },
    ];

    const getFilteredMonths = () => {
        if (selectedYear === currentYear) {
            return MONTHS.filter(month => month.value <= currentMonth);
        }
        return MONTHS;
    };
    const filteredMonths = getFilteredMonths();

    const handleYearChange = (year) => {
        setSelectedYear(year);
        if (selectedMonth && year === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(null);
        } else if (selectedMonth && !getFilteredMonths().some(m => m.value === selectedMonth)) {
            setSelectedMonth(null);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#EAEAE5] font-sans selection:bg-stone-800 selection:text-white pb-20">
            <DesignSystemStyles />
            {/* NOISE OVERLAY */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[9999]" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
            }} />

            <div className="max-w-[1440px] mx-auto border-x border-stone-300 relative bg-[#EAEAE5] min-h-screen shadow-2xl shadow-stone-200/50">
                {/* VERTICAL GRID LINES */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-0 z-0 h-full w-full opacity-40">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className="border-r border-stone-300 h-full col-span-1"></div>
                    ))}
                </div>

                <div className="relative z-10">
                    {/* STICKY HEADER & FILTERS WITH GLASSMORPHISM */}
                    <div className="sticky top-0 z-50 bg-[#EAEAE5]/80 backdrop-blur-xl border-b border-stone-200 px-8 pt-8 pb-0 transition-all duration-300">
                        {/* NEW HERO SECTION - MATCHING IMAGE */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col"
                            >
                                <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 flex items-center gap-3">
                                    {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, <span className="uppercase tracking-tighter">{userName.split(' ')[0]}</span> ! <span className="text-amber-500">✦</span>
                                </h1>
                                <p className="text-[10px] font-mono text-stone-400 mt-2 flex items-center gap-2 uppercase tracking-[0.3em] font-bold">
                                    <span className="text-orange-500">🔥</span> Inteligência comercial que guia decisões.
                                </p>
                            </motion.div>

                            <DashboardAlertPanel
                                userName={userName}
                                userInitials={userInitials}
                                onLogout={() => {
                                    sessionStorage.clear();
                                    navigate('/login');
                                }}
                                onOpenAgenda={() => navigate('/agenda')}
                            />
                        </header>

                        {/* Filters Section - Definitive Matrix V2 Alignment */}
                        <div className="bg-white/40 border-t border-stone-200/60 py-3 -mx-8 px-8 relative"> {/* Reduzido py-6 para py-3 */}
                            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end"> {/* Reduzido gap-6 para gap-3 */}
                                {/* ANO */}
                                <div className="lg:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 font-bold">
                                        <CalendarIcon className="w-3.5 h-3.5" /> ANO
                                    </Label>
                                    <div className="flex bg-stone-100/50 p-1 rounded-xl border border-stone-200 shadow-inner h-11 items-center">
                                        {YEARS.map(y => (
                                            <button
                                                key={y}
                                                onClick={() => handleYearChange(y)}
                                                className={`
                                                flex-1 px-1 py-2 rounded-lg text-xs font-sans font-bold transition-all duration-300
                                                ${selectedYear === y
                                                        ? 'bg-white text-stone-900 shadow-md transform scale-105'
                                                        : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'}
                                            `}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* MÊS */}
                                <div className="lg:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 font-bold">
                                        <CalendarIcon className="w-3.5 h-3.5" /> MÊS <span className="text-stone-300 ml-1 font-normal opacity-50">(OPCIONAL)</span>
                                    </Label>
                                    <div className="flex overflow-x-auto scrollbar-hide bg-stone-100/50 p-1 rounded-xl border border-stone-200 shadow-inner h-11 items-center">
                                        {filteredMonths.map((m) => (
                                            <button
                                                key={m.value}
                                                onClick={() => setSelectedMonth(selectedMonth === m.value ? null : m.value)}
                                                className={`
                                                whitespace-nowrap px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all
                                                ${selectedMonth === m.value
                                                        ? 'bg-white text-stone-900 shadow-md transform scale-105'
                                                        : 'text-stone-400 hover:bg-white/30'}
                                            `}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* INDÚSTRIA */}
                                <div className="lg:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 font-bold">
                                        <Factory className="w-3.5 h-3.5" /> INDÚSTRIA
                                    </Label>
                                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                        <SelectTrigger className="w-full bg-white border border-stone-200 text-stone-900 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm h-11 focus:ring-stone-900/5 transition-all hover:border-stone-300 px-4">
                                            <SelectValue placeholder="TODAS AS INDÚSTRIAS" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-stone-200 shadow-2xl max-h-[400px]">
                                            <SelectItem value="ALL" className="focus:bg-stone-50 cursor-pointer">
                                                <div className="flex items-center gap-3 py-1.5">
                                                    <div className="bg-stone-100 p-1.5 rounded-md text-stone-400">
                                                        <Factory className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-sans font-bold text-stone-400 text-xs uppercase tracking-widest">CONSIDERAR TODAS</span>
                                                </div>
                                            </SelectItem>
                                            {industries.map(ind => (
                                                <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)} className="focus:bg-stone-50 cursor-pointer">
                                                    <div className="flex items-start gap-3 py-1.5">
                                                        <div className="mt-0.5 bg-stone-100 p-1.5 rounded-md text-stone-600">
                                                            <Factory className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-sans font-semibold text-stone-800 text-sm leading-tight tracking-tight">{ind.for_nomered}</span>
                                                            <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-widest uppercase">ID: {ind.for_codigo}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* CLIENTE */}
                                <div className="lg:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-2 flex items-center gap-2 font-bold">
                                        <UserCircle className="w-3.5 h-3.5" /> CLIENTE
                                    </Label>
                                    <Combobox
                                        items={[
                                            {
                                                value: "ALL",
                                                label: "TODOS OS CLIENTES",
                                                icon: <UserCircle className="w-4 h-4" />,
                                                sublabel: "CONSIDERAR TODOS"
                                            },
                                            ...clients.map(c => ({
                                                value: String(c.value),
                                                label: c.label,
                                                icon: <UserCircle className="w-4 h-4" />,
                                                sublabel: `ID: ${c.value}`
                                            }))
                                        ]}
                                        value={selectedClient}
                                        onChange={setSelectedClient}
                                        placeholder="TODOS OS CLIENTES"
                                        searchPlaceholder="Pesquisar cliente..."
                                        className="bg-white border border-stone-200 text-stone-900 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm h-11 focus:ring-stone-900/5 transition-all hover:border-stone-300 px-4"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pt-4"> {/* Reduzido de pt-6 */}
                        {/* Industry Revenue Ticker */}
                        <IndustryTicker data={industryRevenue} />

                        {/* Strategic Redesign Header - MOVED UP */}
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div>
                                <h1 className="text-xl font-black text-stone-900 tracking-tighter uppercase font-display leading-tight">Insights Estratégicos SalesMasters</h1>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 font-mono">Dados de Performance e Risco em Tempo Real</p>
                            </div>
                            <button
                                onClick={() => setShowStrategicInfo(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/70 backdrop-blur-md border border-stone-200 rounded-xl hover:bg-stone-50 transition-all group shadow-sm"
                            >
                                <Info size={14} className="text-stone-400 group-hover:text-stone-900 transition-colors" />
                                <span className="text-[9px] font-black text-stone-400 group-hover:text-stone-900 tracking-widest uppercase">Estudo de Impacto</span>
                            </button>
                        </div>

                        <div className="mb-6"> {/* Reduzido de py-8 lg:py-12 */}
                            {/* Metrics Section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <MetricCardAura
                                    title="Vendas Totais"
                                    value={loading ? "..." : `R$ ${parseFloat(metrics?.total_vendido_current || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                                    mom={metrics?.vendas_mom}
                                    yoy={metrics?.vendas_yoy}
                                    icon={DollarSign}
                                    delay={0.1}
                                />
                                <MetricCardAura
                                    title="Volume de Itens"
                                    value={loading ? "..." : parseFloat(metrics?.quantidade_vendida_current || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    mom={metrics?.quantidade_mom}
                                    yoy={metrics?.quantidade_yoy}
                                    icon={Factory}
                                    delay={0.15}
                                />
                                <MetricCardAura
                                    title="Clientes Ativos"
                                    value={loading ? "..." : parseFloat(metrics?.clientes_atendidos_current || 0).toLocaleString('pt-BR')}
                                    mom={metrics?.clientes_mom}
                                    yoy={metrics?.clientes_yoy}
                                    icon={Users}
                                    delay={0.2}
                                />
                                <MetricCardAura
                                    title="Ticket Médio"
                                    value={loading ? "..." : `R$ ${parseFloat(metrics?.ticket_medio_current || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                                    mom={metrics?.ticket_mom}
                                    yoy={metrics?.ticket_yoy}
                                    icon={Target}
                                    delay={0.3}
                                />
                            </div>

                        </div>

                        {/* Comparison Dialog */}
                        <Dialog open={showStrategicInfo} onOpenChange={setShowStrategicInfo}>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 bg-stone-50 border-none shadow-2xl">
                                <DialogHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                                        <DialogTitle className="text-2xl font-black text-stone-900 uppercase font-display">Redesign de Insights Estratégicos SalesMasters</DialogTitle>
                                    </div>
                                    <p className="text-stone-500 text-sm font-sans">
                                        Estudo de substituição dos indicadores de baixo valor decisório por métricas acionáveis.
                                    </p>
                                </DialogHeader>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                                    <div className="bg-white p-5 rounded-2xl border-t-4 border-red-500 shadow-sm">
                                        <div className="text-3xl font-black text-red-500">3</div>
                                        <div className="text-xs font-bold text-stone-900 uppercase tracking-tight">Insights Substituídos</div>
                                        <p className="text-[10px] text-stone-400 mt-1">QTDE SKUs · Aniversariantes · IA Score</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border-t-4 border-orange-500 shadow-sm">
                                        <div className="text-3xl font-black text-orange-500">1</div>
                                        <div className="text-xs font-bold text-stone-900 uppercase tracking-tight">Insight Aprimorado</div>
                                        <p className="text-[10px] text-stone-400 mt-1">Mix → Gap por Indústria (Opportunity $)</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border-t-4 border-emerald-500 shadow-sm">
                                        <div className="text-3xl font-black text-emerald-500">Alto</div>
                                        <div className="text-xs font-bold text-stone-900 uppercase tracking-tight">Impacto Comercial</div>
                                        <p className="text-[10px] text-stone-400 mt-1">Direcionamento real de vendas</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Matriz de Evolução (Antes vs Depois)</h3>
                                    <div className="overflow-hidden border border-stone-200 rounded-2xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-stone-100/50 border-b border-stone-200">
                                                <tr>
                                                    <th className="p-4 font-black text-stone-400 uppercase tracking-tighter">Card Anterior</th>
                                                    <th className="p-4 font-black text-stone-400 uppercase tracking-tighter">Valor</th>
                                                    <th className="p-4 font-black text-stone-600 uppercase tracking-tighter">Novo Insight Proposto</th>
                                                    <th className="p-4 font-black text-stone-600 uppercase tracking-tighter">Ganho Real</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                <tr className="border-b border-stone-100 italic opacity-60">
                                                    <td className="p-4 text-stone-400 line-through">QTDE SKUs</td>
                                                    <td className="p-4 text-red-500 font-bold">Baixo</td>
                                                    <td className="p-4 font-bold text-stone-900">Concentração de Carteira</td>
                                                    <td className="p-4 text-emerald-600 font-black">Visibilidade de Risco</td>
                                                </tr>
                                                <tr className="border-b border-stone-100 italic opacity-60">
                                                    <td className="p-4 text-stone-400 line-through">Aniversariantes</td>
                                                    <td className="p-4 text-amber-500 font-bold">Médio</td>
                                                    <td className="p-4 font-bold text-stone-900">Monitor de Retenção</td>
                                                    <td className="p-4 text-emerald-600 font-black">Ação de Resgate</td>
                                                </tr>
                                                <tr className="border-b border-stone-100 italic opacity-60">
                                                    <td className="p-4 text-stone-400 line-through">Insights IA Score</td>
                                                    <td className="p-4 text-red-500 font-bold">Baixo</td>
                                                    <td className="p-4 font-bold text-stone-900">Ciclo de Recompra</td>
                                                    <td className="p-4 text-emerald-600 font-black">Previsibilidade</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4 text-stone-400">Penetração (Generalista)</td>
                                                    <td className="p-4 text-amber-500 font-bold">Médio</td>
                                                    <td className="p-4 font-bold text-stone-900">Gap de Mix em R$</td>
                                                    <td className="p-4 text-emerald-600 font-black">Foco em Faturamento</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-stone-200 flex justify-end">
                                    <button
                                        onClick={() => setShowStrategicInfo(false)}
                                        className="px-8 py-3 bg-stone-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-800 transition-all shadow-lg hover:shadow-stone-900/20 active:scale-95"
                                    >
                                        Entendido, Voltar ao Dashboard
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        {/* ROW 1: RISK & RETENTION (Strategic Focus) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            <InsightCardAura
                                title="Concentração"
                                type="Risco da Carteira"
                                icon={ShieldAlert}
                                color="#ef4444"
                                metricValue={insightsData?.concentracao ? `${insightsData.concentracao.value}%` : null}
                                helpData={{
                                    sourceMetric: "(Top 3 Clientes)",
                                    impact: "Impacto ALTO",
                                    description: "% do faturamento total que vem dos 3 maiores clientes. Revela dependência e risco.",
                                    problem: "O faturamento está concentrado em poucos compradores. Se um deles sair ou reduzir compras, o impacto no resultado é devastador.",
                                    solution: "Diversificar a carteira focando em clientes médios com potencial de crescimento para diluir o risco.",
                                    formula: "Proporção das 3 maiores contas sobre o faturamento total",
                                    visualExample: "Top 3 clientes = 71% do faturamento",
                                    alertTrigger: "Se > 60%, risco alto de dependência estratégica",
                                    typeClassName: "bg-red-50 text-red-600 border-red-100",
                                    impactClassName: "bg-red-100 text-red-700 border-red-200"
                                }}
                                badge={insightsData?.concentracao?.value > 60 ? { text: 'Impacto ALTO', className: 'bg-red-100 text-red-700' } : null}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <ConcentrationChart data={insightsData?.concentracao} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Ativação Real"
                                type="Monitor de Retenção"
                                icon={Target}
                                color="#10b981"
                                metricValue={insightsData?.ativacao ? `${insightsData.ativacao.find(d => d.name === 'Ativo')?.value || 0}` : null}
                                helpData={{
                                    sourceMetric: "(Base de Clientes)",
                                    impact: "Saúde Operacional",
                                    description: "Classificação da base pelo tempo desde a última compra. Essencial para evitar o 'churrasco' (perda) de clientes.",
                                    problem: "Muitos clientes na zona 'Dormindo' ou 'Inativo' mostram falha no acompanhamento do ciclo de vida.",
                                    solution: "Implementar régua de relacionamento automática para clientes que entram na zona 'Dormindo' (> 60 dias).",
                                    formula: "Distribuição por intervalo de inatividade (Status Time)",
                                    visualExample: "70% Ativos | 20% Dormindo | 10% Inativos",
                                    alertTrigger: "Inativos > 20% da base requer ação de resgate urgente",
                                    typeClassName: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                    impactClassName: "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <ActivationBarChart data={insightsData?.ativacao} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Burnout Rate"
                                type="Risco Inatividade"
                                icon={Flame}
                                color="#f97316"
                                metricValue={insightsData?.risco_inativacao ? `${insightsData.risco_inativacao.count}` : null}
                                helpData={{
                                    sourceMetric: "(Mês Atual vs Anterior)",
                                    impact: "Perda Imediata",
                                    description: "Clientes que compraram no mês passado mas ainda não realizaram pedidos no mês atual.",
                                    problem: "A perda de recorrência é um sinal claro de insatisfação ou avanço da concorrência.",
                                    solution: "Lista prioritária de contatos para o representante. Ligar hoje para entender por que não houve pedido.",
                                    formula: "Inatividade detectada no ciclo de faturamento mensal",
                                    visualExample: "32 clientes em Burnout = R$ 45k de faturamento em risco",
                                    alertTrigger: "Qualquer aumento no volume de Burnout em relação à média",
                                    typeClassName: "bg-orange-50 text-orange-600 border-orange-100",
                                    impactClassName: "bg-orange-100 text-orange-700 border-orange-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <RiskRetentionChart data={insightsData?.risco_inativacao} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Predictability"
                                type="Ciclo de Recompra"
                                icon={RefreshCw}
                                color="#8b5cf6"
                                metricValue={insightsData?.ciclo ? `${insightsData.ciclo.avg_days}d` : null}
                                helpData={{
                                    sourceMetric: "(Frequência Média)",
                                    impact: "Previsibilidade",
                                    description: "Tempo médio em dias entre pedidos. Ajuda a prever quando o cliente deve comprar novamente.",
                                    problem: "Clientes que ultrapassam o ciclo médio em 20% estão em 'Atraso' e podem estar comprando de outro fornecedor.",
                                    solution: "Antecipar o contato 2 ou 3 dias antes do ciclo vencer para garantir o pedido na data prevista.",
                                    formula: "Média de dias decorridos entre transações consecutivas",
                                    visualExample: "Ciclo de 21 dias -> Alerta no dia 25 sem compra",
                                    alertTrigger: "Atraso > 20% do ciclo médio individual",
                                    typeClassName: "bg-purple-50 text-purple-600 border-purple-100",
                                    impactClassName: "bg-purple-100 text-purple-700 border-purple-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <RebuyCycleChart data={insightsData?.ciclo} />}
                            </InsightCardAura>
                        </div>

                        {/* ROW 2: PERFORMANCE & GROWTH (Operational Focus) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <InsightCardAura
                                title="Tendência 90d"
                                type="Saúde dos Clientes"
                                icon={TrendingUp}
                                color="#10b981"
                                helpData={{
                                    sourceMetric: "(Quarter Comparison)",
                                    impact: "Crescimento Base",
                                    description: "Compara o faturamento de faturamento dos últimos 90 dias com o período anterior.",
                                    problem: "Uma tendência negativa sustentada pode indicar erosão da base de clientes ou perda de competitividade.",
                                    solution: "Analisar as contas com maior queda no faturamento e realizar visitas técnicas/negociais para recuperação.",
                                    formula: "Variação Percentual do Volume Trimestral",
                                    visualExample: "+15% de crescimento vs trimestre anterior",
                                    alertTrigger: "Tendência < -10% requer revisão de estratégia regional",
                                    typeClassName: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                    impactClassName: "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <CustomerHealthChart data={insightsData?.saude} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Mix Pro"
                                type="Cobertura Portfolio"
                                icon={PieChartIcon}
                                color="#6366f1"
                                helpData={{
                                    sourceMetric: "(Share of Wallet)",
                                    impact: "Cross-Selling",
                                    description: "Distribuição dos clientes pela quantidade de marcas/indústrias que consomem.",
                                    problem: "Clientes que compram apenas 1 ou 2 marcas são 'monomarca' e estão vulneráveis a propostas da concorrência.",
                                    solution: "Focar em ampliar o mix de indústrias nos clientes atuais (Cross-sell) para aumentar o ticket médio.",
                                    formula: "Contagem de Marcas distintas ativas no faturamento",
                                    visualExample: "45% dos clientes compram apenas 1 marca",
                                    alertTrigger: "Alta concentração em clientes com mix < 3 indústrias",
                                    typeClassName: "bg-blue-50 text-blue-600 border-blue-100",
                                    impactClassName: "bg-blue-100 text-blue-700 border-blue-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <MixCoverageChart data={insightsData?.mix_coverage} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Gap Indústria"
                                type="Oportunidade Cross"
                                icon={Target}
                                color="#059669"
                                badge={{ text: 'Top 1', className: 'bg-emerald-100 text-emerald-700' }}
                                helpData={{
                                    sourceMetric: "(Opportunity R$)",
                                    impact: "Potencial de Venda",
                                    description: "Estima o potencial de faturamento de vender uma marca para clientes que ainda não a compram.",
                                    problem: "Ignorar o potencial de cross-sell deixa faturamento 'na mesa' em clientes que já confiam na sua representação.",
                                    solution: "Utilizar a lista do Gap para oferecer as marcas certas para os clientes certos com base no perfil de compra.",
                                    formula: "Diferencial de Abastecimento baseado na Média Regional",
                                    visualExample: "R$ 12k de Gap na marca 'SOFTHAM Cosméticos'",
                                    alertTrigger: "Gap total acima de R$ 50k indica grande oportunidade represada",
                                    typeClassName: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                    impactClassName: "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <IndustryGapChart data={insightsData?.gap} />}
                            </InsightCardAura>

                            <InsightCardAura
                                title="Ranking Top 5"
                                type="Produtos Estrela"
                                icon={Factory}
                                color="#4f46e5"
                                metricValue={insightsData?.top_skus && insightsData.top_skus[0] ? `${insightsData.top_skus[0].pct}%` : null}
                                helpData={{
                                    sourceMetric: "(Representatividade %)",
                                    impact: "Foco de Mix",
                                    description: "Os 5 itens mais vendidos e sua participação sobre o faturamento total.",
                                    problem: "Dependência excessiva de poucos SKUs (Curva A extrema) pode ser perigoso se houver ruptura de estoque.",
                                    solution: "Monitorar a ruptura desses itens e trabalhar a introdução de 'substitutos' ou complementares.",
                                    formula: "Participação Relativa no Valor Total Vendido",
                                    visualExample: "Item X representa 22% do faturamento total",
                                    alertTrigger: "Concentração do Top 1 SKU acima de 25%",
                                    typeClassName: "bg-indigo-50 text-indigo-600 border-indigo-100",
                                    impactClassName: "bg-indigo-100 text-indigo-700 border-indigo-200"
                                }}
                            >
                                {loadingInsights ? <div className="animate-pulse w-full h-full bg-stone-100/50 rounded-2xl" /> : <TopSkusRankingChart data={insightsData?.top_skus} />}
                            </InsightCardAura>
                        </div>

                        {/* COMPARISON CHARTS SECTION */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4 mt-4"> {/* Reduzido gap e margins */}
                            {/* Chart 1: Quantidades Vendidas */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500"
                            >
                                <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Volume de Vendas</div>
                                        <h3 className="text-base font-bold text-stone-900 leading-tight">Quantidades Vendidas ({selectedYear - 1} vs {selectedYear})</h3>
                                    </div>
                                    <button onClick={() => navigate('/estatisticos/mapa-quantidades')} className="p-2 hover:bg-white rounded-xl text-stone-400 hover:text-stone-900 transition-all">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                                <div className="p-6 h-[260px] w-full"> {/* Reduzido padding e height de 320 para 260 */}
                                    {loadingQuantities ? (
                                        <div className="h-full flex items-center justify-center text-stone-400 font-mono text-[10px] uppercase tracking-widest">
                                            Processando Dados...
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={quantitiesComparison}>
                                                <defs>
                                                    <linearGradient id="colorQtyAtual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorQtyAnterior" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="mes"
                                                    stroke="#a8a29e"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#a8a29e"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) => v.toLocaleString()}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                                                        backdropFilter: "blur(16px)",
                                                        border: "1px solid #e7e5e4",
                                                        borderRadius: "20px",
                                                        boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
                                                        padding: "16px"
                                                    }}
                                                    itemStyle={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace' }}
                                                    formatter={(v) => [v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), ""]}
                                                    labelStyle={{ marginBottom: '8px', fontWeight: 800, color: '#1c1917', fontSize: '12px' }}
                                                />
                                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="atual"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorQtyAtual)"
                                                    name={String(selectedYear)}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="anterior"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    fillOpacity={1}
                                                    fill="url(#colorQtyAnterior)"
                                                    name={String(selectedYear - 1)}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>

                            {/* Chart 2: Comparação de Faturamento */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white border border-stone-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500"
                            >
                                <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Desempenho Financeiro</div>
                                        <h3 className="text-base font-bold text-stone-900 leading-tight">Comparação de Vendas ({selectedYear - 1} vs {selectedYear})</h3>
                                    </div>
                                    <button className="p-2 hover:bg-white rounded-xl text-stone-400 hover:text-stone-900 transition-all">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                                <div className="p-6 h-[260px] w-full"> {/* Reduzido padding e height de 320 para 260 */}
                                    {loadingSales ? (
                                        <div className="h-full flex items-center justify-center text-stone-400 font-mono text-[10px] uppercase tracking-widest">
                                            Analizando Balanço...
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={salesComparison}>
                                                <defs>
                                                    <linearGradient id="colorSalesAtual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorSalesAnterior" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="mes"
                                                    stroke="#a8a29e"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#a8a29e"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) => `R$${v}k`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                                                        backdropFilter: "blur(16px)",
                                                        border: "1px solid #e7e5e4",
                                                        borderRadius: "20px",
                                                        boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
                                                        padding: "16px"
                                                    }}
                                                    itemStyle={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace' }}
                                                    formatter={(v) => [`R$ ${(v * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, ""]}
                                                    labelStyle={{ marginBottom: '8px', fontWeight: 800, color: '#1c1917', fontSize: '12px' }}
                                                />
                                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="atual"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorSalesAtual)"
                                                    name={String(selectedYear)}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="anterior"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    fillOpacity={1}
                                                    fill="url(#colorSalesAnterior)"
                                                    name={String(selectedYear - 1)}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* INSIGHT PANELS ROW: Performance + Metas */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4 mt-4"> {/* Reduzido gap e margins de 12 para 4 */}
                            {/* Card 1 — Performance de Vendedores (Direct Interaction) */}
                            <div className="bg-white border border-stone-200 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
                                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Insight</div>
                                        <h3 className="text-base font-bold text-stone-900">Performance de Vendedores</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsPerformanceModalOpen(true)}
                                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-900 transition-colors"
                                        title="Maximizar"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                                <div className="p-4 flex-1 h-[350px] overflow-y-auto relative custom-scrollbar">

                                    <SalesPerformanceTable
                                        selectedYear={selectedYear}
                                        selectedMonth={selectedMonth}
                                        selectedIndustry={selectedIndustry}
                                        limit={8}
                                    />
                                </div>
                            </div>

                            {/* Card 2 — Metas por Indústria (Direct Interaction) */}
                            <div className="bg-white border border-stone-200 rounded-[24px] overflow-hidden shadow-sm flex flex-col group">
                                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Insight</div>
                                        <h3 className="text-base font-bold text-stone-900">Metas por Indústria</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsMetasModalOpen(true)}
                                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-900 transition-colors"
                                        title="Maximizar"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                                <div className="p-4 flex-1 h-[350px] overflow-hidden relative">
                                    <MetasIndustriasTable
                                        selectedYear={selectedYear}
                                        selectedMonth={selectedMonth}
                                        selectedIndustry={selectedIndustry}
                                        limit={1}
                                    />

                                    {/* DESIGN SYSTEM GLASSMORPHIC OVERLAY */}
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center p-6 text-center z-50 pointer-events-none group-hover:pointer-events-auto">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5 }}
                                            className="bg-white/80 backdrop-blur-2xl border border-white/50 p-8 rounded-[32px] shadow-2xl shadow-stone-200/50 max-w-[260px] relative overflow-hidden"
                                        >
                                            <div className="absolute -top-6 -right-6 opacity-5 rotate-12">
                                                <Target size={120} className="text-stone-900" />
                                            </div>

                                            <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-stone-900/20 relative z-10">
                                                <Target className="text-white" size={24} />
                                            </div>

                                            <h4 className="text-lg font-display font-bold text-stone-900 mb-2 relative z-10">Metas Completas</h4>
                                            <p className="text-[11px] text-stone-500 font-sans mb-8 leading-relaxed relative z-10 px-2">
                                                Visualize o desempenho detalhado de todas as indústrias cadastradas.
                                            </p>

                                            <button
                                                onClick={() => setIsMetasModalOpen(true)}
                                                className="btn-beam w-full p-[1px] rounded-xl group/btn transition-transform active:scale-95"
                                            >
                                                <div className="btn-beam-content py-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                                                    Abrir Relatório
                                                </div>
                                            </button>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full Performance Modal */}
                        <Dialog open={isPerformanceModalOpen} onOpenChange={setIsPerformanceModalOpen}>
                            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-stone-200 shadow-2xl rounded-[32px]">
                                <DialogHeader className="p-8 border-b border-stone-100 bg-stone-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Users className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-display font-bold text-stone-900">Performance Detalhada de Vendedores</DialogTitle>
                                            <p className="text-sm text-stone-500 font-medium uppercase tracking-widest mt-1">Análise de Novos Clientes e SKUs</p>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="flex-1 overflow-auto p-8 bg-white/50">
                                    <SalesPerformanceTable
                                        selectedYear={selectedYear}
                                        selectedMonth={selectedMonth}
                                        selectedIndustry={selectedIndustry}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Full Metas Modal */}
                        <Dialog open={isMetasModalOpen} onOpenChange={setIsMetasModalOpen}>
                            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-stone-200 shadow-2xl rounded-[32px]">
                                <DialogHeader className="p-8 border-b border-stone-100 bg-stone-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-display font-bold text-stone-900">Relatório Completo de Metas</DialogTitle>
                                            <p className="text-stone-500 text-xs font-medium uppercase tracking-widest mt-1">Análise Setorial por Indústria</p>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="flex-1 overflow-auto p-8 bg-white/50">
                                    <MetasIndustriasTable
                                        selectedYear={selectedYear}
                                        selectedMonth={selectedMonth}
                                        selectedIndustry={selectedIndustry}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Inline Styles for Beam Button & Flashlight */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

                .font-display {
                    font-family: 'Space Grotesk', sans-serif;
                }

                /* BEAM BUTTON - Exact from design_system.html */
                .btn-beam {
                    position: relative;
                    z-index: 10;
                    overflow: hidden;
                }

                .btn-beam::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    z-index: -1;
                    background: conic-gradient(from 90deg at 50% 50%, #E2E8F0 0%, #000000 50%, #E2E8F0 100%);
                    animation: spin 4s linear infinite;
                    border-radius: inherit;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .btn-beam:hover::before {
                    opacity: 1;
                }

                .btn-beam-content {
                    background-color: #1c1917;
                    color: white;
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* FLASHLIGHT CARD EFFECT */
                .flashlight-card {
                    position: relative;
                    overflow: hidden;
                }

                .flashlight-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        600px circle at var(--mouse-x, 0) var(--mouse-y, 0),
                        rgba(255, 255, 255, 0.8),
                        transparent 40%
                    );
                    opacity: 0;
                    transition: opacity 0.5s;
                    pointer-events: none;
                    z-index: 2;
                }

            `
                    }} />
                </div>
            </div>
        </div>
    );
};

export default AuraDashboard;
