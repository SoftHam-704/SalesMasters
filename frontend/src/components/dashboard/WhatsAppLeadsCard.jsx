import React, { useEffect, useState } from 'react';
import { MessageCircle, Bot, User, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';

const WhatsAppLeadsCard = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
        // Poll every 30 seconds
        const interval = setInterval(fetchLeads, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeads = async () => {
        try {
            // Usando axios para garantir headers de tenant/auth
            const response = await axios.get('/wpp-service/dashboard-stats');
            if (response.data.success) {
                setLeads(response.data.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'qualificado':
                return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'PRONTO' };
            case 'em_atendimento':
                return { color: 'bg-amber-100 text-amber-700', icon: Bot, label: 'EM IA' };
            case 'nova':
                return { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'NOVO' };
            case 'humano':
                return { color: 'bg-indigo-100 text-indigo-700', icon: User, label: 'HUMANO' };
            default:
                return { color: 'bg-slate-100 text-slate-600', icon: MessageCircle, label: status };
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;
        return `${Math.floor(diffHours / 24)}d atrás`;
    };

    if (loading && leads.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">Leads via WhatsApp</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">IA NEXUS ATIVA</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/utilitarios/whatsapp-ia')}
                    className="p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-centerh-32 text-center text-slate-400 py-8">
                        <Bot className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs font-medium">Nenhum atendimento ativo no momento</p>
                    </div>
                ) : (
                    leads.map((lead) => {
                        const status = getStatusConfig(lead.estado);
                        const StatusIcon = status.icon;

                        return (
                            <motion.div
                                key={lead.conversa_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
                                onClick={() => navigate(`/utilitarios/whatsapp-ia?conversa=${lead.conversa_id}`)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm truncate max-w-[120px]">
                                            {lead.nome_push || lead.telefone}
                                        </span>
                                        {lead.nome_marca && (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                                                {lead.nome_marca}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(lead.ultima_msg_at)}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-600 line-clamp-2 mb-2 italic">
                                    "{lead.ultima_mensagem}"
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {status.label}
                                    </span>

                                    {lead.ultima_direcao === 'inbound' && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Cliente aguardando resposta" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WhatsAppLeadsCard;
