import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SidebarBriefing({ narrative, loading }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 mx-3 mt-auto mb-6 bg-gradient-to-br from-white/80 to-slate-50/50 dark:from-slate-900/80 dark:to-slate-800/50 backdrop-blur-xl rounded-[24px] border border-emerald-200/40 dark:border-white/10 shadow-2xl shadow-emerald-500/10 relative overflow-hidden group"
        >
            {/* Decorative Background Elements */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-700" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shadow-inner border border-emerald-200/50 dark:border-emerald-500/30">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                </div>
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-300 leading-none">
                        Briefing IA
                    </h4>
                    <p className="text-[9px] font-bold text-emerald-600/60 dark:text-slate-500 mt-0.5">
                        Insights em tempo real
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 min-h-[100px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center space-y-3 py-4"
                        >
                            <div className="relative">
                                <BrainCircuit className="h-8 w-8 text-emerald-500/30 animate-pulse" />
                                <motion.div 
                                    className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600/40 uppercase tracking-widest animate-pulse">
                                Processando Dados...
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-3"
                        >
                            <div className="p-3.5 bg-white/40 dark:bg-black/20 rounded-2xl border border-emerald-100/30 dark:border-white/5 shadow-inner">
                                <p className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic">
                                    "{narrative || "Selecione uma indústria para receber o briefing estratégico de mercado do SalesMasters Intelligence."}"
                                </p>
                            </div>
                            
                            {!narrative && (
                                <div className="flex items-center gap-2 px-1">
                                    <Info className="h-3 w-3 text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        Selecione uma indústria para começar
                                    </span>
                                </div>
                            )}
                            
                            {narrative && (
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            Status: Ativo
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" />
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </motion.div>
    );
}
