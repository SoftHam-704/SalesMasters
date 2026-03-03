import { motion } from "framer-motion";
import { Sparkles, MessageSquare, ChevronRight, Loader2 } from "lucide-react";

export const AiInsightBox = ({ typing, insight }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm backdrop-blur-sm"
        >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />

            <div className="relative flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 shadow-sm text-emerald-600">
                    <Sparkles className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-emerald-900">CRM-Rep AI</h3>
                        <span className="inline-flex items-center rounded-md bg-emerald-200/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <Sparkles className="mr-1 h-2.5 w-2.5" /> Inteligência Estratégica
                        </span>
                    </div>

                    <div className="text-sm leading-relaxed text-emerald-800/90 font-medium">
                        {typing ? (
                            <span className="animate-pulse">Analisando dados estratégicos...</span>
                        ) : (
                            insight
                        )}
                        {" "}
                        {/* Blinking Cursor Logic could go here */}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const KpiCard = ({ children, delay = 0, glowColor = "rgba(16, 185, 129, 0.1)", accentColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -4, boxShadow: `0 10px 30px -10px ${glowColor}` }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300"
        >
            {/* Background Gradient Blob */}
            <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-2xl"
                style={{ backgroundColor: glowColor }}
            />

            {/* Accent Bar on Hover */}
            {accentColor && (
                <div
                    className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full"
                    style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, transparent)` }}
                />
            )}

            <div className="relative z-10 h-full flex flex-col justify-between">
                {children}
            </div>
        </motion.div>
    );
};

export const Sparkline = ({ data, color = "#10B981" }) => {
    // Simple SVG Sparkline
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 30;

    // Normalize points
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible opacity-80" style={{ color }}>
            <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`M0,${height} L${points} L${width},${height} Z`}
                fill={`url(#grad-${color})`}
                stroke="none"
            />
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export const CircleProgress = ({ value, color = "#8B5CF6", size = 52 }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox="0 0 52 52" className="transform -rotate-90">
            {/* Background Circle */}
            <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100"
            />
            {/* Progress Circle */}
            <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeLinecap="round"
            />
        </svg>
    );
}

export const FunnelBar = ({ label, value, maxValue, color, delay, count, icon: Icon }) => {
    const percent = (value / maxValue) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay / 1000, duration: 0.5 }}
            className="group relative mb-3 last:mb-0"
        >
            <div className="flex items-center justify-between mb-1.5 z-10 relative">
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-white transition-colors duration-300"
                        style={{ '--hover-bg': color }}
                    >
                        {Icon && <Icon className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{count} opções</span>
                </div>
                <span className="text-xs font-bold text-slate-900 font-mono tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden relative">
                {/* Background track pattern/gradient could be here */}

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: (delay + 300) / 1000, duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{ backgroundColor: color }}
                >
                    <div className="absolute inset-0 bg-white/20" />
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>
            </div>
        </motion.div>
    )
}

export const WhatsAppWidget = ({ activeCount = 0, lastMessage, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer grouphover:shadow-md transition-all relative overflow-hidden"
        >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Leads via WhatsApp</h2>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                            IA Nexus Ativa
                        </span>
                    </div>
                </div>

                <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <ChevronRight className="h-3.5 w-3.5" />
                </div>
            </div>

            {activeCount > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="flex h-2 w-2 absolute -top-0.5 -right-0.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                                    {activeCount}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{activeCount} Conversas Ativas</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                    {lastMessage || "Aguardando resposta..."}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">Responder</span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                        <MessageSquare className="h-4 w-4 opacity-50" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">Nenhum atendimento ativo no momento</p>
                </div>
            )}
        </motion.div>
    );
}
