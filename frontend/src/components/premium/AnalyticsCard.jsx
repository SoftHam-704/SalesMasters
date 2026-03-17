import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const AnalyticsCard = ({
    totalSales = 0,
    progress = 0,
    ticketMedio = 0,
    totalOrders = 0,
    activeClients = 0,
    monthlyGoal = 0,
}) => {
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const formattedSales = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(totalSales);

    const formattedGoal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(monthlyGoal);

    const formattedTicket = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(ticketMedio);

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.15 }}
            className="card-premium-mobile p-6 relative z-10 shadow-lg overflow-hidden border border-white/40 mb-8"
        >
            {/* Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />

            {/* Header row */}
            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-[14px] font-black text-slate-800 tracking-tight uppercase">
                            Performance de Vendas
                        </h2>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md self-start px-3 py-1 rounded-xl border border-white/50 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {currentMonth} <span className="opacity-30">•</span> {currentYear}
                        </p>
                    </div>
                </div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                    className="flex flex-col items-end"
                >
                    <div className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-2xl px-3 py-2 shadow-lg">
                        <ArrowUpRight size={14} strokeWidth={3} />
                        <span className="text-[14px] font-black tabular-nums">{progress}%</span>
                    </div>
                </motion.div>
            </div>

            <div className="relative z-10 mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-[42px] font-black tracking-tighter text-slate-900 tabular-nums leading-none">
                        {formattedSales}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                        Meta: <span className="text-slate-600 font-black">{formattedGoal}</span>
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8 relative border border-slate-200/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] bg-[length:200%_100%] animate-shimmer" />
                </motion.div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Ticket Médio', value: formattedTicket, sub: 'por pedido', color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                    { label: 'Positivação', value: activeClients, sub: 'clientes', color: 'text-blue-500', bg: 'bg-blue-50/50' },
                    { label: 'Qtd Pedidos', value: totalOrders, sub: 'no mês', color: 'text-violet-500', bg: 'bg-violet-50/50' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className={`${stat.bg} rounded-[22px] py-4 px-2 text-center transition-transform hover:scale-105 border border-white/40 shadow-sm`}
                    >
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500/80 mb-1">
                            {stat.label}
                        </p>
                        <p className={`font-black tracking-tighter leading-none tabular-nums ${stat.color} ${String(stat.value).length > 6 ? 'text-[16px]' : 'text-[22px]'}`}>
                            {stat.value}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400/80 mt-1">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default AnalyticsCard;
