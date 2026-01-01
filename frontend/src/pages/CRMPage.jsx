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
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NovaInteracaoModal from '@/components/crm/NovaInteracaoModal';
import NovaOportunidadeModal from '@/components/crm/NovaOportunidadeModal';
import CRMHelpModal from '@/components/crm/CRMHelpModal';
import KanbanBoard from '@/components/crm/KanbanBoard';

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

export default function CRMPage() {
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
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
    const [helpOpen, setHelpOpen] = useState(false);

    // Fetch All Data
    const refreshData = async () => {
        setLoading(true);
        try {
            const venCodigo = 1; // TODO: Auth

            // Parallel Fetch
            const [intRes, pipeRes] = await Promise.all([
                fetch(`http://localhost:3005/api/crm/interacoes?ven_codigo=${venCodigo}`),
                fetch(`http://localhost:3005/api/crm/pipeline?ven_codigo=${venCodigo}`)
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

        // Extract ID and Stage
        const oppId = activeId.replace('opp-', '');
        let newStageId = null;

        // Dropped on a Column (Stage)
        if (overId.startsWith('stage-')) {
            newStageId = overId.replace('stage-', '');
        }
        // Dropped on another Card (Find the stage of that card)
        else if (overId.startsWith('opp-')) {
            // Find which stage this other card belongs to
            for (const stage of pipeline) {
                if (stage.items.find(i => `opp-${i.oportunidade_id}` === overId)) {
                    newStageId = stage.etapa_id;
                    break;
                }
            }
        }

        if (newStageId) {
            // Optimistic UI Update
            const newPipeline = pipeline.map(stage => {
                // Remove from old stage
                const item = pipeline.flatMap(s => s.items).find(i => i.oportunidade_id == oppId);
                const isTargetStage = stage.etapa_id == newStageId;

                if (stage.items.some(i => i.oportunidade_id == oppId)) {
                    // It was here, remove it
                    return { ...stage, items: stage.items.filter(i => i.oportunidade_id != oppId) };
                }
                if (isTargetStage && item) {
                    // Add it here
                    return { ...stage, items: [...stage.items, { ...item, etapa_id: newStageId }] };
                }
                return stage;
            });

            setPipeline(newPipeline);

            // API Call
            try {
                await fetch(`http://localhost:3005/api/crm/oportunidades/${oppId}/move`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ etapa_id: newStageId })
                });
                toast.success('Movido com sucesso!');
            } catch (error) {
                toast.error('Erro ao salvar movimento');
                refreshData(); // Revert
            }
        }
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

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'kanban' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Columns className="w-4 h-4" />
                            Funil (Kanban)
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
                    ) : viewMode === 'kanban' ? (
                        <KanbanBoard
                            pipeline={pipeline}
                            onDragEnd={handleDragEnd}
                            onCardClick={(opp) => toast.info(`Detalhes do negócio: ${opp.titulo}`)}
                        />
                    ) : (
                        /* LIST VIEW (Legacy) */
                        <Card className="h-full bg-white/60 backdrop-blur-sm border-blue-100 flex flex-col">
                            <CardHeader className="border-b border-blue-100 shrink-0">
                                <CardTitle className="text-lg">Histórico de Interações</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 sticky top-0 z-10">
                                            <tr className="text-xs text-slate-500 uppercase">
                                                <th className="text-left p-4">Cliente</th>
                                                <th className="text-left p-4">Tipo</th>
                                                <th className="text-left p-4">Canal</th>
                                                <th className="text-left p-4">Resultado</th>
                                                <th className="text-left p-4">Data</th>
                                                <th className="text-left p-4">Descrição</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {interacoes.map((item) => {
                                                const Icon = getTypeIcon(item.tipo);
                                                return (
                                                    <tr key={item.interacao_id} className="border-b hover:bg-blue-50/50">
                                                        <td className="p-4 font-medium text-slate-700">{item.cli_nomred}</td>
                                                        <td className="p-4"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-slate-400" />{item.tipo}</div></td>
                                                        <td className="p-4 text-sm text-slate-500">{item.canal || '-'}</td>
                                                        <td className="p-4"><Badge className={cn("font-normal", getResultColor(item.resultado))}>{item.resultado || 'Pendente'}</Badge></td>
                                                        <td className="p-4 text-sm text-slate-500">{formatDateTime(item.data_interacao)}</td>
                                                        <td className="p-4 text-sm text-slate-500 truncate max-w-xs">{item.descricao}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
                onClose={() => setNovaOportunidadeOpen(false)}
                onSuccess={refreshData}
            />
            <CRMHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />
        </div >
    );
}
