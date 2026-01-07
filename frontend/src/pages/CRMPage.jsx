import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Plus, Phone, Mail, MessageSquare, Users, Calendar,
    TrendingUp, AlertTriangle, Clock, Search, Filter,
    ChevronRight, Building2, User, Activity, Columns, List,
    Briefcase, LayoutDashboard, ArrowUpRight, Cake, Loader2,
    ArrowRight, CheckCircle2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NovaInteracaoModal from '@/components/crm/NovaInteracaoModal';
import NovaOportunidadeModal from '@/components/crm/NovaOportunidadeModal';
import CRMHelpModal from '@/components/crm/CRMHelpModal';
import KanbanBoard from '@/components/crm/KanbanBoard';
import { NODE_API_URL } from '../utils/apiConfig';

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Icon mapping for interaction types
const getTypeIcon = (tipo) => {
    const lower = (tipo || '').toLowerCase();
    if (lower.includes('telefon') || lower.includes('ligação')) return Phone;
    if (lower.includes('email')) return Mail;
    if (lower.includes('whatsapp') || lower.includes('mensagem')) return MessageSquare;
    if (lower.includes('visita') || lower.includes('reunião')) return Users;
    return Activity;
};

// Color mapping for results
const getResultColor = (resultado) => {
    if (!resultado) return 'bg-slate-100 text-slate-600';
    const lower = resultado.toLowerCase();
    if (lower.includes('venda') || lower.includes('fechado')) return 'bg-emerald-100 text-emerald-700';
    if (lower.includes('sem interesse') || lower.includes('perdido')) return 'bg-red-100 text-red-700';
    if (lower.includes('retornar') || lower.includes('aguardando')) return 'bg-amber-100 text-amber-700';
    if (lower.includes('negociação') || lower.includes('proposta')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
};

const CRMDashboard = ({ stats, onNavigate }) => {
    const [birthdays, setBirthdays] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDash = async () => {
            try {
                const [res1, res2, res3] = await Promise.all([
                    fetch(`${NODE_API_URL}/api/crm/stats/birthdays`),
                    fetch(`${NODE_API_URL}/api/crm/stats/industries`),
                    fetch(`${NODE_API_URL}/api/crm/stats/team`)
                ]);

                const d1 = await res1.json();
                const d2 = await res2.json();
                const d3 = await res3.json();

                if (d1.success) setBirthdays(d1.data);
                if (d2.success) setIndustries(d2.data);
                if (d3.success) setTeam(d3.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDash();
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="h-full overflow-y-auto p-2 space-y-6">

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare className="w-24 h-24" /></div>
                    <CardContent className="p-6">
                        <p className="text-blue-100 font-medium text-sm">Interações Hoje</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalHoje || 0}</h3>
                        <div className="mt-4 flex items-center text-xs bg-blue-500/30 w-fit px-2 py-1 rounded">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            <span>12% essa semana</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 font-medium text-sm">Total Semana</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalSemana || 0}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 font-medium text-sm">Pendentes</p>
                                <h3 className="text-3xl font-bold text-amber-600 mt-2">{stats.pendentes || 0}</h3>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 gap-6">

                {/* Ranking Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Team Ranking */}
                    <Card className="border-blue-100">
                        <CardHeader className="py-3 border-b border-slate-100">
                            <CardTitle className="text-base text-slate-700">Atividade da Equipe</CardTitle>
                        </CardHeader>
                        <div className="p-0 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="text-left p-3 pl-4">Operador</th>
                                        <th className="text-center p-3">Geral</th>
                                        <th className="text-center p-3">No Mês</th>
                                        <th className="text-center p-3">Hoje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {team.map((t, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30">
                                            <td className="p-3 pl-4 font-medium text-slate-700">{t.operador}</td>
                                            <td className="p-3 text-center text-slate-500">{t.total}</td>
                                            <td className="p-3 text-center text-blue-600 font-bold bg-blue-50/50">{t.no_mes}</td>
                                            <td className="p-3 text-center text-emerald-600 font-bold">{t.no_dia || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Industry Activity */}
                    <Card className="border-blue-100">
                        <CardHeader className="py-3 border-b border-slate-100">
                            <CardTitle className="text-base text-slate-700">Atividade no CRM por Indústria (%)</CardTitle>
                        </CardHeader>
                        <div className="p-0 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="text-left p-3 pl-4">Indústria</th>
                                        <th className="text-center p-3">Geral</th>
                                        <th className="text-center p-3">No Mês</th>
                                        <th className="text-right p-3 pr-4">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {industries.map((ind, i) => {
                                        const totalAll = industries.reduce((acc, curr) => acc + parseInt(curr.no_mes), 0);
                                        const share = totalAll > 0 ? ((parseInt(ind.no_mes) / totalAll) * 100).toFixed(1) : 0;
                                        return (
                                            <tr key={i} className="hover:bg-blue-50/30">
                                                <td className="p-3 pl-4 font-medium text-slate-700 text-xs">{ind.industria}</td>
                                                <td className="p-3 text-center text-slate-400 text-xs">{ind.total}</td>
                                                <td className="p-3 text-center text-slate-700 font-medium">{ind.no_mes}</td>
                                                <td className="p-3 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-xs text-slate-500">{share}%</span>
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${share}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};



// ... (CRMDashboard component code is already above here) ...

import { useSearchParams } from 'react-router-dom';

// ...

export default function CRMPage() {
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view') === 'dashboard' ? 'dashboard' : 'kanban';

    const [viewMode, setViewMode] = useState(initialView); // 'kanban', 'list', 'dashboard'
    const [interacoes, setInteracoes] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHoje: 0,
        totalSemana: 0,
        pendentes: 0,
        semContato: 0
    });

    // Modals
    const [novaInteracaoOpen, setNovaInteracaoOpen] = useState(false);
    const [novaOportunidadeOpen, setNovaOportunidadeOpen] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null); // For Edit Mode
    const [helpOpen, setHelpOpen] = useState(false);

    // Fetch All Data
    const refreshData = async () => {
        setLoading(true);
        try {
            const venCodigo = 1; // TODO: Auth

            // Parallel Fetch
            const [intRes, pipeRes] = await Promise.all([
                fetch(`${NODE_API_URL}/api/crm/interacoes?ven_codigo=${venCodigo}`),
                fetch(`${NODE_API_URL}/api/crm/pipeline?ven_codigo=${venCodigo}`)
            ]);

            const intData = await intRes.json();
            const pipeData = await pipeRes.json();

            if (intData.success) {
                setInteracoes(intData.data);
                // Calculate Stats
                const today = new Date().toDateString();
                const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                setStats({
                    totalHoje: intData.data.filter(i => new Date(i.data_interacao).toDateString() === today).length,
                    totalSemana: intData.data.filter(i => new Date(i.data_interacao) >= weekAgo).length,
                    pendentes: intData.data.filter(i => !i.resultado).length,
                    semContato: 0
                });
            }

            if (pipeData.success) {
                setPipeline(pipeData.data);
            }

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar CRM');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    // Drag & Drop Handler
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dropped on itself
        if (activeId === overId) return;

        const oppId = activeId.replace('opp-', '');

        // Find Source Stage
        const sourceStage = pipeline.find(stage => stage.items.some(i => `opp-${i.oportunidade_id}` === activeId));
        if (!sourceStage) return;

        // Find Target Stage ID
        let targetStageId = null;
        if (overId.startsWith('stage-')) {
            targetStageId = overId.replace('stage-', '');
        } else if (overId.startsWith('opp-')) {
            const targetStage = pipeline.find(stage => stage.items.some(i => `opp-${i.oportunidade_id}` === overId));
            if (targetStage) targetStageId = targetStage.etapa_id;
        }

        if (!targetStageId) return;

        // --- SCENARIO 1: SAME COLUMN (Reorder) ---
        if (sourceStage.etapa_id == targetStageId) {
            // We need to reorder the items in the specific stage
            const stageIndex = pipeline.findIndex(s => s.etapa_id == sourceStage.etapa_id);
            const oldIndex = sourceStage.items.findIndex(i => `opp-${i.oportunidade_id}` === activeId);
            const newIndex = sourceStage.items.findIndex(i => `opp-${i.oportunidade_id}` === overId);

            if (stageIndex !== -1 && oldIndex !== -1 && newIndex !== -1) {
                const newPipeline = [...pipeline];
                // Using dnd-kit's arrayMove manually or just logic
                const newItems = [...sourceStage.items];
                const [movedItem] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, movedItem);

                newPipeline[stageIndex] = { ...sourceStage, items: newItems };
                setPipeline(newPipeline);
                // Note: Reorder persistence in DB is not implemented yet, but UI will work.
            }
            return;
        }

        // --- SCENARIO 2: DIFFERENT COLUMN (Move) ---
        // Optimistic UI Update
        const newPipeline = pipeline.map(stage => {
            // Source: Remove
            if (stage.etapa_id == sourceStage.etapa_id) {
                return { ...stage, items: stage.items.filter(i => i.oportunidade_id != oppId) };
            }
            // Target: Add
            if (stage.etapa_id == targetStageId) {
                const item = sourceStage.items.find(i => i.oportunidade_id == oppId);
                return {
                    ...stage,
                    items: [...stage.items, { ...item, etapa_id: parseInt(targetStageId) }]
                };
            }
            return stage;
        });

        setPipeline(newPipeline);

        // API Call
        try {
            await fetch(`${NODE_API_URL}/api/crm/oportunidades/${oppId}/move`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ etapa_id: parseInt(targetStageId) })
            });
            toast.success('Movido com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar movimento');
            refreshData(); // Revert
        }
    };
    // Quick Action Handler (Zero Friction)
    const handleQuickAction = async (action, data) => {
        if (action === 'whatsapp') {
            const phone = data.cli_fone1?.replace(/\D/g, ''); // Remove non-digits
            if (!phone) {
                toast.error('Telefone inválido');
                return;
            }

            // 1. Open WhatsApp
            window.open(`https://wa.me/55${phone}`, '_blank');

            // 2. Auto-log interaction (Magic)
            try {
                const venCodigo = 1; // TODO: Get from Auth

                // IDs based on Seed Data: Canal 3 = WhatsApp, Tipo 4 = Negociação (Assuming connection to Opportunity)
                const payload = {
                    cli_codigo: data.cli_codigo,
                    ven_codigo: venCodigo,
                    tipo_interacao_id: 4, // Negociação
                    canal_id: 3, // WhatsApp
                    descricao: `Contato rápido via WhatsApp referente à oportunidade #${data.oportunidade_id} (${data.titulo})`,
                    resultado_id: 2 // Neutro (Started)
                };

                await fetch(`${NODE_API_URL}/api/crm/interacoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                toast.success('Interação registrada automaticamente!');
                refreshData(); // Refresh to show in history
            } catch (error) {
                console.error("Auto-log failed", error);
                toast.error('WhatsApp aberto, mas falha ao registrar histórico.');
            }
        }
    };

    const handleCardClick = (opp) => {
        setSelectedOpportunity(opp);
        setNovaOportunidadeOpen(true);
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-blue-100 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            CRM 2.0
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de Vendas & Relacionamento</p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHelpOpen(true)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                        title="Como usar o CRM?"
                    >
                        <AlertTriangle className="w-6 h-6" />
                    </Button>

                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'dashboard' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'kanban' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Columns className="w-4 h-4" />
                            Funil
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <List className="w-4 h-4" />
                            Histórico
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {viewMode === 'kanban' ? (
                            <Button
                                onClick={() => setNovaOportunidadeOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Briefcase className="w-4 h-4 mr-2" />
                                Nova Oportunidade
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setNovaInteracaoOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Interação
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                        </div>
                    ) : viewMode === 'dashboard' ? (
                        <CRMDashboard stats={stats} />
                    ) : viewMode === 'kanban' ? (
                        <KanbanBoard
                            pipeline={pipeline}
                            onDragEnd={handleDragEnd}
                            onCardClick={handleCardClick}
                            onQuickAction={handleQuickAction}
                        />
                    ) : (
                        /* TIMELINE VIEW (New) */
                        <Card className="h-full bg-white/60 backdrop-blur-sm border-blue-100 flex flex-col">
                            <CardHeader className="border-b border-blue-100 shrink-0 flex flex-row items-center justify-between py-4">
                                <div>
                                    <CardTitle className="text-lg text-slate-800">Linha do Tempo</CardTitle>
                                    <p className="text-sm text-slate-500">Histórico de todas as interações e contatos</p>
                                </div>
                                <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    {interacoes.length} registros
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden bg-slate-50/50">
                                <ScrollArea className="h-full p-4">
                                    <div className="max-w-3xl mx-auto space-y-6 pb-10">
                                        {interacoes.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400">
                                                <p>Nenhuma interação registrada ainda.</p>
                                            </div>
                                        ) : (
                                            interacoes.map((item, index) => {
                                                const Icon = getTypeIcon(item.tipo);
                                                const isLast = index === interacoes.length - 1;
                                                return (
                                                    <div key={item.interacao_id} className="relative flex gap-4 group">
                                                        {/* Timeline Line */}
                                                        {!isLast && (
                                                            <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors" />
                                                        )}

                                                        {/* Icon Bubble */}
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white transition-all shadow-sm",
                                                            item.resultado === 'Positivo' || item.resultado === 'Pedido gerado' ? "border-emerald-200 text-emerald-600" :
                                                                item.resultado === 'Negativo' ? "border-red-200 text-red-600" :
                                                                    "border-blue-100 text-blue-500"
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>

                                                        {/* Content Card */}
                                                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group-hover:border-blue-200">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-bold text-slate-700 text-sm md:text-base">
                                                                            {item.cli_nomred}
                                                                        </span>
                                                                        {item.industria_related && ( // Assuming future support or mapped field
                                                                            <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500">
                                                                                {item.industria_related}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                        <span className="flex items-center gap-1">
                                                                            <User className="w-3 h-3" />
                                                                            {item.ven_nome || 'Vendedor'}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="font-medium text-blue-600 bg-blue-50 px-1.5 rounded">
                                                                            {item.tipo}
                                                                        </span>
                                                                        {item.canal && (
                                                                            <>
                                                                                <span>via</span>
                                                                                <span className="lowercase italic">{item.canal}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg mb-1">
                                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                                        {new Date(item.data_interacao).toLocaleDateString()}
                                                                        <span className="text-slate-300">|</span>
                                                                        <span className="text-slate-500 font-normal">
                                                                            {new Date(item.data_interacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <Badge className={cn("text-[10px] font-normal justify-end w-full", getResultColor(item.resultado))}>
                                                                        {item.resultado || 'Pendente'}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 leading-relaxed border border-slate-100 font-medium">
                                                                {item.descricao}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modals */}
            <NovaInteracaoModal
                open={novaInteracaoOpen}
                onClose={() => setNovaInteracaoOpen(false)}
                onSuccess={refreshData}
            />
            <NovaOportunidadeModal
                open={novaOportunidadeOpen}
                onClose={() => {
                    setNovaOportunidadeOpen(false);
                    setSelectedOpportunity(null); // Clear selection on close
                }}
                onSuccess={refreshData}
                opportunity={selectedOpportunity} // Pass selected opp for editing
            />
            <CRMHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />
        </div >
    );
}
