
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    Users,
    Target,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    AlertCircle,
    ShoppingBag,
    FileText,
    Plus,
    X,
    MessageSquare,
    Phone,
    UserPlus,
    Send,
    Zap,
    Loader2,
    Sparkles,
    Building2,
    HardHat,
    Wallet,
    Trophy,
    Search,
    Filter,
    Eye,
    ShoppingCart
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { Badge } from "@/components/ui/badge";
import { AiInsightBox, KpiCard, Sparkline, CircleProgress, WhatsAppWidget } from "@/components/crm/dashboard/DashboardComponents";
import { Button } from "@/components/ui/button";


import NovaInteracaoModal from '../../components/crm/NovaInteracaoModal';
import NovaOportunidadeModal from '../../components/crm/NovaOportunidadeModal';
import OrderFormProjetos from '../../components/orders/OrderFormProjetos';
import WhatsAppLeadsCard from '../../components/dashboard/WhatsAppLeadsCard';
import './RepCrmDashboard.css';

// Formata Moeda
const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const RepCrmDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);

    // Restaurando estados perdidos
    const [stats, setStats] = useState({ totalMes: 0, metaMes: 80000 });
    const [pipeline, setPipeline] = useState([]);
    const [aiTyping, setAiTyping] = useState(true);

    const [agenda, setAgenda] = useState({ proximo: null, hoje: 0 });
    const [wallet, setWallet] = useState({ active: 0, prospects: 0 });

    // Modals state
    const [isInteracaoOpen, setIsInteracaoOpen] = useState(false);
    const [isOportunidadeOpen, setIsOportunidadeOpen] = useState(false);
    const [isProjetoOpen, setIsProjetoOpen] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [interacaoPreData, setInteracaoPreData] = useState(null);

    // Contexto
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tenantConfig = JSON.parse(sessionStorage.getItem('tenantConfig') || '{}');
    const isProjetos = user.ramoatv === 'Projetos' || tenantConfig.ramoatv === 'Projetos';
    const isWhatsAppEnabled = user.whatsappEnabled === true;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        const typingTimer = setTimeout(() => setAiTyping(false), 2500);
        fetchStats();
        fetchPipeline();
        fetchAgenda();
        fetchWalletHealth();

        return () => {
            clearInterval(timer);
            clearTimeout(typingTimer);
        };
    }, []);

    const fetchAgenda = async () => {
        try {
            const res = await axios.get('/agenda/resumo');
            if (res.data.success) {
                setAgenda({
                    proximo: res.data.data.proximo_compromisso,
                    hoje: res.data.data.tarefas_hoje
                });
            }
        } catch (error) {
            console.error('Erro agenda dashboard:', error);
        }
    };

    const fetchWalletHealth = async () => {
        try {
            // Active Clients
            const resClients = await axios.get('/clients', { params: { active: 'true', limit: 1 } });
            // Prospects (Status I or from pipeline stage 1)
            // For now, let's use Inactive clients as a proxy or if we had a proper Lead endpoint.
            // A better approach for "Prospecções" is counting opportunities in "Prospecção" stage (id: 1)
            // but we can also check inactive clients. Let's use Pipeline stage 1 count as "Prospecções Ativas".

            const totalActive = resClients.data.pagination?.total || 0;

            setWallet(prev => ({ ...prev, active: totalActive }));

        } catch (error) {
            console.error('Erro wallet health:', error);
        }
    };

    // Update wallet prospects when pipeline changes
    useEffect(() => {
        if (pipeline.length > 0) {
            const prospectingCount = pipeline.filter(p => p.etapa_id === 1).length;
            setWallet(prev => ({ ...prev, prospects: prospectingCount }));
        }
    }, [pipeline]);

    const fetchPipeline = async () => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const ven_codigo = userData.ven_codigo;

            const res = await axios.get('/crm/pipeline', {
                params: { ven_codigo: ven_codigo }
            });
            if (res.data.success) {
                const pipeData = res.data.data.flatMap(stage => stage.items.map(item => ({ ...item, fase_nome: stage.label })));
                setPipeline(pipeData);
            }
        } catch (error) {
            console.error('Erro pipeline crm:', error);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            const res = await axios.get('/reports/dashboard-summary', {
                params: { ano: year, mes: month }
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Erro dashboard crm:', error);
        } finally {
            setLoading(false);
        }
    };

    // Dados transformados para o layout premium
    const fat = stats.total_vendido_current || stats.totalMes || 0;
    const com = fat * 0.05; // 5% estimado
    const meta = stats.meta_total || stats.metaMes || 80000;
    const metaPct = meta > 0 ? Math.min(((fat / meta) * 100), 100).toFixed(1) : 0;

    const phases = [
        { id: 1, label: "Prospecção", color: "#60A5FA", icon: Search },      // Azul Suave
        { id: 2, label: "Qualificação", color: "#818CF8", icon: Filter },    // Indigo Suave
        { id: 3, label: "Proposta", color: "#FB923C", icon: Eye },           // Laranja Suave
        { id: 4, label: "Negociação", color: "#EAB308", icon: ArrowUpRight },// Amarelo
        { id: 5, label: "Fechamento", color: "#10B981", icon: Target }       // Verde
    ];

    const funnelData = phases.map(p => {
        const items = pipeline.filter(i => i.etapa_id === p.id);
        const total = items.reduce((acc, curr) => acc + (parseFloat(curr.valor_estimado || curr.valor) || 0), 0);
        return { ...p, value: total, count: items.length };
    });

    const funnelMax = Math.max(...funnelData.map(f => f.value), 1);

    const handleQuickInteraction = (canalId = null, tipoId = null) => {
        setInteracaoPreData({ canal_id: canalId, tipo_interacao_id: tipoId });
        setIsInteracaoOpen(true);
    };

    const handleQuickOpportunity = () => {
        if (isProjetos) setIsProjetoOpen(true);
        else setIsOportunidadeOpen(true);
    };

    const formattedDate = currentTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Welcome */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                            Dashboard <span className="text-emerald-500">CRM-Rep MASTER</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                            <Calendar size={14} className="text-slate-400" />
                            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 h-11 transition-colors"
                            onClick={() => handleQuickInteraction()}
                        >
                            <Plus size={18} className="mr-2" /> Novo Atendimento
                        </Button>
                        <Button
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold h-11 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            onClick={() => handleQuickOpportunity()}
                        >
                            <Target size={18} className="mr-2" /> Nova Oportunidade
                        </Button>
                    </div>
                </header>

                {/* AI Insight Box */}
                <AiInsightBox
                    typing={aiTyping}
                    insight={stats.insights?.gap || "Analisando sua carteira para identificar oportunidades estratégicas... Clique no botão para gerar um insight."}
                />

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard delay={0.1} glowColor="rgba(16, 185, 129, 0.15)">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={18} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendas do Mês</span>
                            </div>
                            <div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatBRL(fat)}</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 px-1.5 h-5 rounded-md">
                                        {stats.vendas_percent_change > 0 ? '+' : ''}{stats.vendas_percent_change || 0}%
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-medium">vs. anterior</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute right-0 bottom-4 opacity-20"><Sparkline data={[10, 25, 15, 30, 45, 20]} color="#10B981" /></div>
                    </KpiCard>

                    <KpiCard delay={0.2} glowColor="rgba(96, 165, 250, 0.15)">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Wallet size={18} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Comissões (Est.)</span>
                            </div>
                            <div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatBRL(com)}</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-500 border-blue-100 px-1.5 h-5 rounded-md">ℹ 5%</Badge>
                                    <span className="text-[10px] text-slate-400 font-medium">sobre linha pesada</span>
                                </div>
                            </div>
                        </div>
                    </KpiCard>

                    <KpiCard delay={0.3} glowColor="rgba(251, 146, 60, 0.15)">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col h-full justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Target size={18} /></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Atendimentos</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalInteracoes || 0}</span>
                                    <div className="mt-1">
                                        <span className="text-[10px] text-slate-400 font-medium">Interações este mês</span>
                                    </div>
                                </div>
                            </div>
                            <CircleProgress value={stats.totalInteracoes > 0 ? 100 : 0} color="#FB923C" size={48} />
                        </div>
                    </KpiCard>

                    <KpiCard delay={0.4} glowColor="rgba(234, 179, 8, 0.15)">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Trophy size={18} /></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Meta do Mês</span>
                            </div>
                            <div className="space-y-2">
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{formatBRL(meta)}</span>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metaPct}%` }}
                                        className="h-full bg-gradient-to-r from-yellow-400 to-emerald-500"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-emerald-600">{metaPct}%</span>
                                    <span className="text-slate-400">Restam {formatBRL(Math.max(0, meta - fat))}</span>
                                </div>
                            </div>
                        </div>
                    </KpiCard>
                </div>

                {/* Main Content Areas - Swapped for Action-First focus */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar: Strategic Overview */}
                    <div className="order-2 lg:order-1 space-y-6">
                        {/* Sales Funnel (Compact) */}
                        {/* Pipeline Comercial */}
                        <motion.div
                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-slate-800">Pipeline Comercial</h2>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-emerald-600 font-bold px-2 hover:bg-emerald-50" onClick={() => navigate('/vendas/campanhas')}>Ver Funil</Button>
                            </div>

                            <div className="space-y-4">
                                {funnelData.map((f, idx) => (
                                    <div key={f.id} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-slate-400 uppercase">{f.label}</span>
                                            <span className="text-slate-600">{f.count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(f.value / funnelMax) * 100}%` }}
                                                transition={{ duration: 1, delay: idx * 0.1 }}
                                                className="absolute left-0 top-0 h-full opacity-90 shadow-sm"
                                                style={{ backgroundColor: f.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Opportunities (Oportunidades Críticas) */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                        >
                            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                                Oportunidades Críticas
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">Ação Necessária</Badge>
                            </h2>
                            <div className="space-y-3">
                                {pipeline.slice(0, 3).map((opp, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between group cursor-pointer hover:border-emerald-200 transition-colors">
                                        <div className="flex gap-3">
                                            <div className="p-1.5 h-8 w-8 rounded-lg bg-white border border-slate-200 text-emerald-600 flex items-center justify-center group-hover:text-emerald-700">
                                                {isProjetos ? <HardHat size={14} /> : <Building2 size={14} />}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{opp.cliente_nome || opp.cli_nomred || 'Cliente não identificado'}</h4>
                                                <p className="text-[10px] text-slate-500 font-medium">{formatCurrency(opp.valor_estimado || opp.valor)} • {opp.fase_nome}</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                ))}
                                {pipeline.length === 0 && <p className="text-center py-6 text-xs text-slate-400 font-medium">Sem oportunidades críticas no momento.</p>}
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Area: Lead Management (Now expanded) */}
                    <div className="order-1 lg:order-2 lg:col-span-2 space-y-6">
                        {/* WhatsApp leads - Wide & Taller */}
                        <div className="h-[500px] lg:h-[550px]">
                            {isWhatsAppEnabled ? (
                                <WhatsAppLeadsCard />
                            ) : (
                                <WhatsAppWidget
                                    activeCount={0}
                                    onClick={() => navigate('/utilitarios/whatsapp-ia')}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Lower Grid: Agenda & Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                    <motion.div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-slate-800">Próximos Compromissos</h2>
                            <Button variant="link" className="text-xs font-bold p-0 h-auto text-emerald-600" onClick={() => navigate('/agenda')}>Ver minha agenda</Button>
                        </div>
                        <div className="space-y-4">
                            {agenda.proximo ? (
                                <div className="flex p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 items-center gap-4 hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => navigate('/agenda')}>
                                    <div className="text-center min-w-[50px] flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Horário</span>
                                        <span className="text-sm font-black text-emerald-600">{agenda.proximo.hora_inicio?.substring(0, 5) || 'HOJE'}</span>
                                    </div>
                                    <div className="h-8 w-[1px] bg-emerald-200" />
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-slate-800">{agenda.proximo.titulo}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">{agenda.proximo.tipo}</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100"><ArrowUpRight size={16} /></Button>
                                </div>
                            ) : (
                                <div className="flex p-3 rounded-xl border border-slate-100 bg-slate-50/50 items-center gap-4 hover:border-emerald-100 transition-colors">
                                    <div className="text-center min-w-[50px]"><span className="text-xs font-black text-slate-400">HOJE</span></div>
                                    <div className="h-4 w-[1px] bg-slate-200" />
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-slate-800">Sem compromissos agendados</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Sincronize com Google Calendar ou Outlook</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"><ArrowUpRight size={16} /></Button>
                                </div>
                            )}

                            {agenda.hoje > 0 && (
                                <div className="text-center pt-2">
                                    <span className="text-[10px] font-bold text-slate-400">Você tem mais <span className="text-emerald-600">{agenda.hoje} tarefas</span> para hoje.</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-slate-800">Saúde da Carteira</h2>
                            <span className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">Foco em Positivação</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center">
                                <Users className="text-emerald-600 mb-2" size={20} />
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{wallet.active}</span>
                                <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Clientes Ativos</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col justify-center items-center text-center">
                                <UserPlus className="text-blue-500 mb-2" size={20} />
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{wallet.prospects}</span>
                                <span className="text-[10px] font-bold text-blue-500/70 uppercase">Prospecções</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isInteracaoOpen && (
                    <NovaInteracaoModal
                        isOpen={isInteracaoOpen}
                        onClose={() => setIsInteracaoOpen(false)}
                        onSuccess={() => { toast.success('Interação registrada!'); fetchStats(); fetchPipeline(); }}
                        preData={interacaoPreData}
                    />
                )}
                {isOportunidadeOpen && (
                    <NovaOportunidadeModal
                        isOpen={isOportunidadeOpen}
                        onClose={() => setIsOportunidadeOpen(false)}
                        onSuccess={() => { toast.success('Oportunidade criada!'); fetchPipeline(); }}
                    />
                )}
                {isProjetoOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative"
                        >
                            <button onClick={() => setIsProjetoOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 z-10 transition-colors">
                                <X size={24} />
                            </button>
                            <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                                <OrderFormProjetos onClose={() => setIsProjetoOpen(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Action Button (FAB) */}
            <div className="repcrm-fab-container">
                <AnimatePresence>
                    {isFabOpen && (
                        <motion.div
                            className="repcrm-fab-menu"
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        >
                            <div className="fab-menu-item" onClick={() => { setIsOportunidadeOpen(true); setIsFabOpen(false); }}>
                                <span>Nova Oportunidade</span>
                                <div className="fab-icon bg-emerald-500 text-white"><Target size={18} /></div>
                            </div>
                            <div className="fab-menu-item" onClick={() => { setIsInteracaoOpen(true); setIsFabOpen(false); }}>
                                <span>Registrar Atendimento</span>
                                <div className="fab-icon bg-blue-500 text-white"><MessageSquare size={18} /></div>
                            </div>
                            {isProjetos && (
                                <div className="fab-menu-item" onClick={() => { setIsProjetoOpen(true); setIsFabOpen(false); }}>
                                    <span>Novo Projeto</span>
                                    <div className="fab-icon bg-blue-400 text-white"><HardHat size={18} /></div>
                                </div>
                            )}
                            {!isProjetos && (
                                <div className="fab-menu-item" onClick={() => { navigate('/vendas/novo-pedido'); setIsFabOpen(false); }}>
                                    <span>Novo Pedido</span>
                                    <div className="fab-icon bg-orange-500 text-white"><ShoppingCart size={18} /></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    className={`repcrm-fab-main ${isFabOpen ? 'active' : ''}`}
                    onClick={() => setIsFabOpen(!isFabOpen)}
                >
                    {isFabOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            {/* Float Help Assistant - REMOVED */}
        </div>
    );
};

export default RepCrmDashboard;
