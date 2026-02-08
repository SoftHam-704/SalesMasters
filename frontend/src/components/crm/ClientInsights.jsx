
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const ClientInsights = ({ clientId, insights: initialInsights = [] }) => {
    const [insights, setInsights] = useState(initialInsights);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchClientInsights = async () => {
        if (!clientId) return;

        setLoading(true);
        setError(null);
        try {
            // Chamando agora o seu Backend NODE principal
            const url = getApiUrl(NODE_API_URL, `/api/clients/${clientId}/insights`);
            console.log(`[IA NODE] Consultando inteligência em: ${url}`);

            const response = await axios.get(url);

            if (response.data.success) {
                const fetchedInsights = response.data.insights.map(item => ({
                    ...item,
                    icon: getIconForType(item.type),
                    color: getColorForType(item.type),
                    bgColor: getBgColorForType(item.type),
                    borderColor: getBorderColorForType(item.type)
                }));
                setInsights(fetchedInsights);
            } else {
                setError("O motor de IA não retornou insights válidos.");
            }
        } catch (error) {
            console.error("Erro ao buscar insights da IA (Node):", error);
            setError("Falha ao processar inteligência do cliente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchClientInsights();
        } else {
            setInsights([]);
        }
    }, [clientId]);

    const getIconForType = (type) => {
        switch (type) {
            case 'opportunity': return <Target size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'insight': return <Lightbulb size={16} />;
            default: return <Lightbulb size={16} />;
        }
    };

    const getColorForType = (type) => {
        switch (type) {
            case 'opportunity': return 'text-emerald-600';
            case 'warning': return 'text-amber-600';
            case 'insight': return 'text-blue-600';
            default: return 'text-slate-500';
        }
    };

    const getBgColorForType = (type) => {
        switch (type) {
            case 'opportunity': return 'bg-emerald-50';
            case 'warning': return 'bg-amber-50';
            case 'insight': return 'bg-blue-50';
            default: return 'bg-slate-50';
        }
    };

    const getBorderColorForType = (type) => {
        switch (type) {
            case 'opportunity': return 'border-emerald-100';
            case 'warning': return 'border-amber-100';
            case 'insight': return 'border-blue-100';
            default: return 'border-slate-100';
        }
    };

    if (error && insights.length === 0) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={16} />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Inteligência Offline</h4>
                </div>
                <div className="p-4 rounded-2xl border border-red-100 bg-red-50/30 text-center">
                    <p className="text-[10px] text-red-600 font-medium mb-3">{error}</p>
                    <button
                        onClick={fetchClientInsights}
                        className="text-[10px] font-bold uppercase tracking-tighter text-red-700 hover:underline"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    const displayInsights = insights.length > 0 ? insights : [
        {
            type: 'insight',
            title: 'Análise de Perfil',
            description: loading ? 'Sincronizando com motor de IA...' : 'Nenhum padrão detectado para este cliente no momento.',
            icon: loading ? <RefreshCw size={16} className="animate-spin" /> : <Lightbulb size={16} />,
            color: 'text-slate-400',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-100'
        }
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                        <TrendingUp size={16} />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Inteligência de Vendas</h4>
                </div>
                {loading && <RefreshCw size={10} className="animate-spin text-emerald-500" />}
                {!loading && <span className="text-[10px] font-medium text-slate-400">{insights.length} Analisados</span>}
            </div>

            <div className="grid gap-3">
                {displayInsights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "group p-4 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default",
                            "bg-white",
                            insight.borderColor || "border-slate-100"
                        )}
                    >
                        <div className="flex gap-3">
                            <div className={cn(
                                "p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center transition-colors",
                                insight.bgColor || "bg-slate-50",
                                insight.color || "text-slate-500"
                            )}>
                                {insight.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase tracking-wider",
                                        insight.color || "text-slate-600"
                                    )}>
                                        {insight.title}
                                    </span>
                                    <ArrowRight size={10} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-[11px] text-slate-800 leading-relaxed font-semibold">
                                    {insight.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                insight.type === 'opportunity' ? "bg-emerald-500 w-3/4" :
                                    insight.type === 'warning' ? "bg-amber-500 w-1/2" : "bg-blue-500 w-2/3"
                            )} />
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={fetchClientInsights}
                disabled={loading}
                className="w-full py-3 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all border border-transparent hover:border-emerald-100/50 flex items-center justify-center gap-2"
            >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : null}
                {loading ? 'Consultando IA...' : 'Atualizar Inteligência'}
            </button>
        </div>
    );
};

export default ClientInsights;
