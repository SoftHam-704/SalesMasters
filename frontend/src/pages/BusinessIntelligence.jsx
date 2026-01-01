import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
    LayoutGrid,
    Factory,
    Users,
    BarChart3,
    TrendingUp,
    Target,
    UserCog,
    Package,
    Sparkles,
    Zap
} from "lucide-react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

const chartData = [
    { name: "Mar", faturamento: 1475372.93, meta: 3.89 },
    { name: "Abr", faturamento: 2701949.80, meta: 3.89 },
    { name: "Mai", faturamento: 4154583.90, meta: 4.01 },
    { name: "Jun", faturamento: 3753977.15, meta: 4.11 },
    { name: "Jul", faturamento: 3933342.84, meta: 4.21 },
    { name: "Ago", faturamento: 5110407.72, meta: 4.31 },
    { name: "Set", faturamento: 4831369.86, meta: 4.42 },
    { name: "Out", faturamento: 5001898.28, meta: 4.63 },
    { name: "Nov", faturamento: 5142100.83, meta: 4.84 },
    { name: "Dez", faturamento: 2922255.97, meta: 4.15 },
];

const navItems = [
    { icon: LayoutGrid, label: "Visão Geral", active: true, color: "blue" },
    { icon: Factory, label: "Indústrias", active: false, color: "emerald" },
    { icon: Users, label: "Clientes", active: false, color: "violet" },
    { icon: BarChart3, label: "Estatísticos", active: false, color: "amber" },
    { icon: TrendingUp, label: "Curva ABC", active: false, color: "rose" },
    { icon: Target, label: "Metas", active: false, color: "indigo" },
    { icon: UserCog, label: "Equipe", active: false, color: "cyan" },
    { icon: Package, label: "Produtos", active: false, color: "orange" },
];

const formatCurrency = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2).replace('.', ',')} Mi`;
    }
    return value.toLocaleString('pt-BR');
};

const formatFullCurrency = (value) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Faturamento: <span className="text-primary font-bold">R$ {formatFullCurrency(payload[0]?.value)}</span>
                    </p>
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Meta: <span className="text-amber-600 font-bold">{payload[1]?.value?.toFixed(2).replace('.', ',')} Mi</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function BusinessIntelligence() {
    const currentDate = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="flex flex-col h-full p-8 bg-slate-50/50 overflow-auto">
            {/* Header Premium - Ultra Modern */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start mb-10"
            >
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-primary to-blue-700 rounded-2xl text-white shadow-lg shadow-primary/20">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">BI Intelligence</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md flex items-center gap-1 border border-amber-200 uppercase tracking-widest">
                                    <Sparkles size={10} /> Premium
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v2.0 Advanced</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium italic text-sm max-w-xl border-l-4 border-primary/20 pl-4 py-1">
                        "Dados transformados em vantagem competitiva. Onde outros veem números, você visualiza estratégias."
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status do Sistema</div>
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-bold text-slate-700">Real-time Data</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-12 gap-8 mb-10 flex-1 min-h-[500px]">
                {/* Chart Section - Glassmorphic */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-12 xl:col-span-12"
                >
                    <div className="h-full rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700">
                            <BarChart3 size={240} className="text-primary" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-primary rounded-full" />
                                    Relação Faturamento vs Metas Mensais
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faturamento</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                            </linearGradient>
                                        </defs>

                                        <XAxis
                                            dataKey="name"
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            fontWeight={700}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            fontWeight={700}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => formatCurrency(value)}
                                            width={70}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#94a3b8"
                                            fontSize={11}
                                            fontWeight={700}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}M`}
                                            domain={[0, 6]}
                                            width={40}
                                        />

                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.03)', radius: 12 }} />

                                        <Bar
                                            yAxisId="left"
                                            dataKey="faturamento"
                                            fill="url(#premiumGradient)"
                                            radius={[12, 12, 12, 12]}
                                            barSize={32}
                                            label={{
                                                position: 'top',
                                                fill: 'hsl(var(--primary))',
                                                fontSize: 10,
                                                fontWeight: 800,
                                                offset: 12,
                                                formatter: (value) => `R$ ${formatCurrency(value)}`
                                            }}
                                        />

                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="meta"
                                            stroke="#f59e0b"
                                            strokeWidth={4}
                                            dot={{
                                                fill: '#f59e0b',
                                                stroke: '#fff',
                                                strokeWidth: 3,
                                                r: 6
                                            }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modern Navigation Grid - Scroll-free Refinement */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-auto px-4"
            >
                <div className="bg-white/80 backdrop-blur-2xl border border-white/40 p-2 rounded-[2.5rem] shadow-2xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 max-w-7xl mx-auto ring-1 ring-slate-200/50 w-full overflow-hidden">
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.button
                                key={item.label}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "relative group flex items-center lg:flex-col lg:justify-center xl:flex-row xl:justify-start gap-2.5 px-4 py-3 rounded-[1.75rem] transition-all duration-300",
                                    item.active
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                                        : "hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 text-slate-600 border border-transparent"
                                )}
                                onClick={() => window.location.href = item.path}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 duration-500 flex-shrink-0",
                                    item.active ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    <Icon size={18} strokeWidth={item.active ? 2.5 : 2} />
                                </div>
                                <div className="flex flex-col items-start translate-y-0.5 min-w-0">
                                    <span className={cn(
                                        "text-[11px] font-black uppercase tracking-tight truncate w-full",
                                        item.active ? "text-white" : "text-slate-700"
                                    )}>{item.label}</span>
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-tight opacity-50",
                                        item.active ? "text-blue-200" : "text-slate-400"
                                    )}>Explorar</span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Footer Systemic */}
            <div className="flex items-center justify-between px-4 mt-8 pt-6 border-t border-slate-200/50 text-slate-400">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">Sincronizado: {currentDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">Base de Dados: Firebird + Postgres</span>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-8 h-[1px] bg-slate-200" />
                    SalesMasters <span className="text-primary italic">AI Engine</span> by SoftHam
                    <div className="w-8 h-[1px] bg-slate-200" />
                </div>
            </div>
        </div>
    );
}
