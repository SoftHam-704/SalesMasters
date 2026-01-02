import React, { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

const NarrativesWidget = ({ loading, data }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // If no data or loading, verify safely
    const hasData = data && data.resumo_executivo && data.categorias;
    const categories = hasData ? [
        ...data.categorias.oportunidades.map(i => ({ ...i, type: 'oportunidade' })),
        ...data.categorias.alertas.map(i => ({ ...i, type: 'alerta' })),
        ...data.categorias.destaques.map(i => ({ ...i, type: 'destaque' })),
        ...(data.categorias.riscos || []).map(i => ({ ...i, type: 'risco' })),
    ] : [];

    useEffect(() => {
        if (categories.length > 1) {
            const interval = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % categories.length);
            }, 6000); // 6 seconds per slide
            return () => clearInterval(interval);
        }
    }, [categories.length]);

    if (loading) {
        return (
            <div className="w-full h-32 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm font-medium">Analisando dados com IA...</span>
                </div>
            </div>
        );
    }

    if (!hasData || categories.length === 0) {
        return null; // Don't show if empty
    }

    const currentItem = categories[activeIndex];

    // Design Tokens for types
    const styles = {
        oportunidade: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', accent: '#f59e0b' },
        alerta: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', accent: '#f43f5e' },
        destaque: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', accent: '#10b981' },
        risco: { icon: ShieldAlert, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', accent: '#6366f1' },
    };

    const style = styles[currentItem.type] || styles.oportunidade;
    const Icon = style.icon;

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {/* Premium Header Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

            <div className="p-5 flex gap-5 items-start">

                {/* Visual Icon Container */}
                <div className={`shrink-0 w-12 h-12 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center shadow-sm`}>
                    <Icon className={style.color} size={24} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-['Roboto'] font-bold text-slate-800 text-base truncate pr-4">
                            {currentItem.titulo}
                        </h4>
                        <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                            {currentItem.prioridade || currentItem.valor || 'Auto'}
                        </span>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-3">
                        {currentItem.detalhe}
                    </p>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/btn">
                            {currentItem.acao}
                            <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                        </button>
                        {currentItem.impacto && (
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                Impacto: {currentItem.impacto}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 right-4 flex gap-1.5">
                {categories.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-4 bg-slate-800' : 'w-1 bg-slate-200'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default NarrativesWidget;
