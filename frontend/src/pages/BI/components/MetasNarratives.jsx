import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';

const MetasNarratives = ({ filters }) => {
    const [narratives, setNarratives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchNarratives = async () => {
            setLoading(true);
            try {
                // Determine parameters
                // Handle 'Todos' or string months
                const getMonthNumber = (m) => {
                    const map = {
                        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
                        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
                        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12,
                        'Todos': 12
                    };
                    return map[m] || 12;
                };

                const params = {
                    ano: filters.ano,
                    mes: getMonthNumber(filters.mes)
                };

                if (filters.industria && filters.industria !== 'Todos') {
                    params.industria = filters.industria;
                }

                // AI endpoint might be slower, so we don't block main dashboard
                // We could implement a manual trigger, but for now auto-fetch on filter change
                const response = await axios.get('http://localhost:8000/api/metas/narratives', { params });

                if (response.data && response.data.success && response.data.data) {
                    setNarratives(response.data.data.cards || []);
                    setLoaded(true);
                }
            } catch (error) {
                console.error("Error fetching AI narratives:", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce to avoid spamming AI while switching filters quickly
        const timeoutId = setTimeout(() => {
            fetchNarratives();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const getTypeStyles = (type) => {
        switch (type) {
            case 'positive': return { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50', icon: CheckCircle, iconColor: 'text-emerald-500' };
            case 'negative': return { border: 'border-l-red-500', bg: 'bg-red-50/50', icon: AlertTriangle, iconColor: 'text-red-500' };
            case 'warning': return { border: 'border-l-amber-500', bg: 'bg-amber-50/50', icon: AlertTriangle, iconColor: 'text-amber-500' };
            default: return { border: 'border-l-indigo-500', bg: 'bg-indigo-50/50', icon: Info, iconColor: 'text-indigo-500' };
        }
    };

    // Remove early return to ensure header is always visible
    // if (!loading && !loaded) return null;

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-violet-600" size={20} />
                <h3 className="text-base font-bold text-slate-800">
                    Insights Inteligentes
                </h3>
                {(loading || !loaded) && (
                    <span className="text-xs text-slate-400 font-medium animate-pulse ml-2">
                        Atualizando...
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {(loading || !loaded) ? (
                    // Loading Skeletons - Show this initially too
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-40 animate-pulse">
                            <div className="h-4 bg-slate-100 rounded w-1/2 mb-3"></div>
                            <div className="h-2 bg-slate-50 rounded w-full mb-2"></div>
                            <div className="h-2 bg-slate-50 rounded w-full mb-2"></div>
                            <div className="h-2 bg-slate-50 rounded w-3/4"></div>
                        </div>
                    ))
                ) : (
                    narratives.map((card, idx) => {
                        const style = getTypeStyles(card.type);
                        const Icon = style.icon;
                        return (
                            <div
                                key={idx}
                                className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm border-l-4 ${style.border} hover:shadow-md transition-shadow relative overflow-hidden group`}
                            >
                                <div className={`absolute top-0 right-0 p-2 opacity-50`}>
                                    <Icon size={40} className={`${style.iconColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                </div>

                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    {card.title}
                                </h4>

                                <div
                                    className="text-sm text-slate-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: card.content }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MetasNarratives;
