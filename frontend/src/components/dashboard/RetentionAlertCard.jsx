import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, User, Phone } from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { useNavigate } from 'react-router-dom';

const RetentionAlertCard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRetentionData();
    }, []);

    const fetchRetentionData = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/intelligence/retention-alert'));
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados de retenção:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 h-full animate-pulse">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-slate-100 rounded"></div>
                    <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const top3 = data.slice(0, 3);
    const totalCount = data.length;

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden group"
            aria-labelledby="retention-alert-title"
        >
            {/* Top Red Bar Decor */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-orange-500 opacity-80" aria-hidden="true" />

            {/* Header */}
            <header className="p-6 pb-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <AlertTriangle size={20} aria-hidden="true" />
                        </div>
                        <h3 id="retention-alert-title" className="font-bold text-slate-800 tracking-tight">
                            Alerta de Retenção
                        </h3>
                    </div>
                </div>
                <p className="text-sm text-slate-600 leading-tight">
                    <span className="font-bold text-rose-700">{totalCount} clientes</span> sem comprar há mais de 6 meses.
                </p>
            </header>

            {/* Content / Preview */}
            <div className="flex-1 px-6 space-y-3">
                {top3.length > 0 ? (
                    <div className="space-y-3" role="list">
                        {top3.map((client, idx) => (
                            <div
                                key={client.cli_codigo}
                                role="listitem"
                                tabIndex={0}
                                onClick={() => navigate(`/clientes?id=${client.cli_codigo}`)}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/clientes?id=${client.cli_codigo}`)}
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all cursor-pointer group/item outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                aria-label={`Cliente ${client.cli_nomred}, inativo há ${client.dias_inatividade} dias`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover/item:text-rose-500 group-hover/item:border-rose-200 transition-colors">
                                        <User size={14} aria-hidden="true" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-slate-800 truncate group-hover/item:text-rose-800">
                                            {client.cli_nomred || 'Cliente S/N'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium">Inativo há {client.dias_inatividade} dias</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${client.dias_inatividade === 999
                                        ? 'bg-slate-200 text-slate-700'
                                        : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {client.dias_inatividade === 999 ? 'NUNCA COMPROU' : `${client.dias_inatividade} DIAS`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-center opacity-70">
                        <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                            <AlertTriangle size={24} aria-hidden="true" />
                        </div>
                        <p className="text-xs font-medium text-slate-600">Nenhum cliente em risco crítico.</p>
                    </div>
                )}
            </div>

            {/* Footer / CTA */}
            <footer className="p-4 bg-slate-50/50 mt-4">
                <button
                    onClick={() => navigate('/estatisticos/clientes-inativos')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 hover:border-rose-200 hover:shadow-sm transition-all uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    aria-label="Ver relatório completo de retenção"
                >
                    Ver Relatório Completo
                    <ChevronRight size={14} aria-hidden="true" />
                </button>
            </footer>
        </motion.section>
    );
};

export default RetentionAlertCard;
