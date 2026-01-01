
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, AlertTriangle, Star, ShieldAlert,
    ArrowRight, Lightbulb, RefreshCw, XCircle, CheckCircle, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper de formatação simples
const formatCurrency = (val) => {
    if (!val && val !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const SmartInsights = ({ data }) => {
    const [activeTab, setActiveTab] = useState('oportunidades');

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <RefreshCw className="animate-spin mb-2" size={24} />
                <p className="text-sm font-medium">Buscando inteligência de vendas...</p>
            </div>
        );
    }

    if (data.error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-red-400">
                <AlertTriangle className="mb-2" size={24} />
                <p className="text-sm font-medium">Não foi possível gerar insights agora.</p>
                <p className="text-xs opacity-75">{data.error}</p>
            </div>
        );
    }

    const categories = [
        { id: 'oportunidades', label: 'Oportunidades', icon: <TrendingUp size={16} />, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'alertas', label: 'Alertas', icon: <AlertTriangle size={16} />, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'destaques', label: 'Destaques', icon: <Star size={16} />, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'riscos', label: 'Riscos', icon: <ShieldAlert size={16} />, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
    ];

    const currentItems = data.categorias ? data.categorias[activeTab] : [];

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden font-['Inter']">
            {/* Header / Resumo */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {data.industria_analisada}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                        • {new Date().getFullYear()}
                    </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: data.resumo_executivo?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>') }} />
                </p>
            </div>

            {/* Tabs */}
            <div className="flex px-4 pt-4 gap-2 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {categories.map((cat) => {
                    const isActive = activeTab === cat.id;
                    const count = data.categorias && data.categorias[cat.id] ? data.categorias[cat.id].length : 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all relative",
                                isActive
                                    ? `text-slate-800 bg-white border border-gray-100 border-b-white shadow-sm -mb-px z-10`
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <div className={cn("p-1 rounded-md", isActive ? cat.bg : "bg-transparent")}>
                                <div className={cn(isActive ? cat.text : "text-slate-400")}>
                                    {cat.icon}
                                </div>
                            </div>
                            <span>{cat.label}</span>
                            {count > 0 && (
                                <span className={cn(
                                    "ml-1 text-[10px] py-0.5 px-1.5 rounded-full font-bold",
                                    isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                                )}>
                                    {count}
                                </span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className={cn("absolute top-0 left-0 right-0 h-0.5 rounded-t-full", cat.color)}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 bg-slate-50/50 min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {currentItems && currentItems.length > 0 ? (
                            currentItems.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                                        activeTab === 'oportunidades' ? 'bg-emerald-500' :
                                            activeTab === 'alertas' ? 'bg-amber-500' :
                                                activeTab === 'destaques' ? 'bg-blue-500' : 'bg-red-500'
                                    )}></div>

                                    <div className="pl-3 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                                {item.titulo}
                                                {item.prioridade === 'Alta' && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded uppercase">Alta</span>}
                                            </h4>
                                            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                                                {item.detalhe}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {item.valor && (
                                                <p className="text-sm font-bold text-slate-900">{item.valor}</p>
                                            )}
                                            {item.impacto && (
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
                                                    Impacto: {item.impacto}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4 pl-3 flex items-center justify-between border-t border-gray-50 pt-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                            {item.acao || "Analisar"}
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Lightbulb className="text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">Nenhum item nesta categoria para o período.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SmartInsights;
