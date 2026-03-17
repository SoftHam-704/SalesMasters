import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, Sparkles } from 'lucide-react';

const SmartInsights = ({ campaigns = [] }) => {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl grad-amber-soft flex items-center justify-center shadow-sm">
                        <Zap size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-[17px] font-black text-slate-900 tracking-tight uppercase">Smart Insights</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                    <Sparkles size={12} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">IA Engine</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {campaigns.length > 0 ? (
                    campaigns.map((camp, idx) => (
                        <motion.div
                            key={camp.cli_codigo || idx}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 + idx * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                            whileHover={{ y: -4 }}
                            className="relative card-premium-mobile p-5 cursor-pointer overflow-hidden border-slate-100/60 bg-white"
                        >
                            {/* Accent line */}
                            <div className={`absolute left-0 top-4 bottom-4 w-[4px] rounded-r-full ${camp.tipo === 'AUTO' ? 'bg-emerald-500' : 'bg-violet-500'}`} />

                            <div className="flex items-center gap-2 mb-3 pl-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${camp.tipo === 'AUTO' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}>
                                    {camp.tipo === 'AUTO' ? 'Sugestão de Giro' : 'Oportunidade de Campanha'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pl-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[16px] font-black text-slate-900 truncate tracking-tight uppercase leading-tight">
                                        {camp.cliente_fantasia}
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                                        {camp.industria}
                                    </p>
                                </div>

                                <div className="text-right ml-4 flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Estimativa</p>
                                        <p className="text-[20px] font-black text-emerald-600 tabular-nums tracking-tighter leading-none mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(camp.gap_vlr || 0)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-sm">
                                        <ArrowUpRight size={18} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full card-premium-mobile p-12 text-center border-dashed border-2 bg-slate-50/10 flex flex-col items-center justify-center">
                        <Sparkles size={32} className="text-amber-200 mb-4 animate-pulse" />
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                            Analisando padrões de compra...<br />
                            <span className="text-[11px] font-bold opacity-60">Gerando insights estratégicos para você</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartInsights;
