import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import DbComboBox from '@/components/DbComboBox';
import {
    Plus, Phone, Mail, MessageSquare, Users, Calendar,
    TrendingUp, AlertTriangle, Clock, Search, Filter,
    ChevronRight, Building2, User, Activity, Columns, List,
    Briefcase, LayoutDashboard, ArrowUpRight, Loader2,
    CheckCircle2, X, HelpCircle, Sparkles,
    Pencil, Trash2, FilterX, Scissors, Shield, Zap, Target, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NovaInteracaoModal from '@/components/crm/NovaInteracaoModal';
import NovaOportunidadeModal from '@/components/crm/NovaOportunidadeModal';
import CRMHelpModal from '@/components/crm/CRMHelpModal';
import KanbanBoard from '@/components/crm/KanbanBoard';
import { NODE_API_URL } from '../utils/apiConfig';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import '@/theme/stealth-web.css';

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeg = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSeg / 60);
    const diffHor = Math.floor(diffMin / 60);
    const diffDia = Math.floor(diffHor / 24);

    if (diffMin < 1) {
        if (diffMin < -10) return 'Agendado'; // Future dates
        return 'Agora';
    }
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHor < 24) return `há ${diffHor} h`;
    if (diffDia === 1) return 'Ontem';
    if (diffDia < 30) return `há ${diffDia} dias`;
    return date.toLocaleDateString('pt-BR');
};

// Tactical Icon mapping
const getTypeIcon = (tipo) => {
    const lower = (tipo || '').toLowerCase();
    if (lower.includes('telefon') || lower.includes('ligação')) return Phone;
    if (lower.includes('email')) return Mail;
    if (lower.includes('whatsapp') || lower.includes('mensagem')) return MessageSquare;
    if (lower.includes('visita') || lower.includes('reunião')) return Users;
    return Activity;
};

const CRMDashboard = ({
    stats,
    team,
    industrias,
    filterCli,
    setFilterCli,
    filterInd,
    setFilterInd,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    filterVen,
    setFilterVen,
    teamStats,
    industryStats,
    fetchClients,
    lastPurchases,
    loading
}) => {
    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto overflow-y-auto h-full custom-scrollbar">
            {/* Embedded Operational Filters */}
            <div className="stealth-card p-6 border-slate-200 bg-white shadow-sm flex flex-wrap gap-4 items-end relative z-50">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <span className="tactical-label">Período (Mensal)</span>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg h-12 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg h-12 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
                <div className="flex-1 min-w-[300px] space-y-2">
                    <span className="tactical-label">Alvo / Cliente</span>
                    <DbComboBox
                        placeholder="Filtrar cliente..."
                        value={filterCli}
                        onChange={(val) => setFilterCli(val)}
                        fetchData={fetchClients}
                        labelKey="cli_nomred"
                        valueKey="cli_codigo"
                    />
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                    <span className="tactical-label">Operador (Vendedor)</span>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={filterVen}
                        onChange={(e) => setFilterVen(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg h-12 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="w-[200px] space-y-2">
                    <span className="tactical-label">Setor / Indústria</span>
                    <Select value={filterInd} onValueChange={setFilterInd}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-lg h-12 text-sm">
                            <SelectValue placeholder="Indústria" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all">Todas</SelectItem>
                            {industrias.map(ind => (
                                <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                    {ind.for_nomered || ind.for_nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {(filterCli || filterInd || dataInicio || dataFim || filterVen) && (
                    <Button variant="ghost" onClick={() => { setFilterCli(null); setFilterInd('all'); setDataInicio(''); setDataFim(''); setFilterVen(''); }} className="h-11 px-4 text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest">
                        <FilterX size={14} className="mr-2" /> Limpar
                    </Button>
                )}
            </div>

            {/* Últimas Compras (Dashboard View) */}
            {filterCli && lastPurchases && lastPurchases.length > 0 && (
                <div className="bg-white/50 p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Histórico Recente de Compras</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Últimos 10 Pedidos / Faturados</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        {lastPurchases.map((purchase) => (
                            <motion.div
                                key={purchase.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 p-3 rounded-xl hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-1 h-full ${purchase.status === 'F' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-slate-500 font-mono">#{purchase.id}</span>
                                    <Badge className={`${purchase.status === 'F' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'} border text-[8px] font-black px-1.5 h-4 uppercase`}>
                                        {purchase.status === 'F' ? 'Faturado' : 'Pedido'}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black text-slate-800 uppercase line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {purchase.industry}
                                    </h4>
                                    <div className="text-sm font-black text-slate-900">
                                        {formatCurrency(purchase.value)}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400">{formatDate(purchase.date)}</span>
                                    <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{purchase.quantity} ITENS</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Direct Intelligence Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Hoje', value: stats.totalHoje, icon: Zap, color: 'text-blue-600', trend: 'Live', trendColor: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Mês Corrente', value: stats.totalMes || stats.totalSemana, icon: Target, color: 'text-emerald-600', trend: 'Alvo', trendColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Acompanhamentos', value: stats.pendentes, icon: AlertTriangle, color: 'text-amber-600', trend: 'Atenção', trendColor: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Histórico 30d', value: stats.total30d || stats.totalSemana, icon: Activity, color: 'text-slate-600', trend: 'Sincro', trendColor: 'text-slate-600 bg-slate-50 border-slate-100' }
                ].map((m, i) => (
                    <div key={i} className="stealth-card relative overflow-hidden group border-slate-200 bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 bg-slate-50 border border-slate-100 rounded-xl ${m.color} shadow-sm group-hover:shadow-md transition-all`}>
                                <m.icon size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${m.trendColor}`}>
                                {m.trend}
                            </span>
                        </div>
                        <span className="tactical-label mb-1 text-slate-400">{m.label}</span>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? <Loader2 size={20} className="animate-spin text-slate-200" /> : m.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Status Log */}
                <div className="lg:col-span-2 stealth-card min-h-[400px] border-slate-200 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Log de Interações // Período</h3>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                        <table className="tactical-table">
                            <thead>
                                <tr>
                                    <th>Vendedor</th>
                                    <th>Último Cliente</th>
                                    <th>Horário</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-slate-300 italic text-xs">Sem atividade recente registrada</td>
                                    </tr>
                                ) : team.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="font-bold text-slate-900 text-sm whitespace-nowrap">{row.name}</td>
                                        <td className="text-slate-500 text-sm font-medium max-w-[200px] truncate">{row.task}</td>
                                        <td className="flex flex-col py-4">
                                            <span className="text-blue-700 font-mono text-sm font-black">{formatRelativeTime(row.last_sync)}</span>
                                            <span className="text-slate-500 font-mono text-xs font-bold mt-1 uppercase bg-slate-100 px-2 py-0.5 rounded w-fit">{formatDateTime(row.last_sync)}</span>
                                        </td>
                                        <td>
                                            <Badge variant="outline" className={cn(
                                                "rounded-full text-xs font-bold uppercase",
                                                row.status === 'Ativo' ? "text-emerald-600 border-emerald-100 bg-emerald-50" : "text-slate-400 bg-slate-50"
                                            )}>
                                                {row.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Alerts */}
                <div className="space-y-6">
                    <div className="stealth-card p-6 border-l-4 border-l-amber-500 bg-amber-50/30 border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white border border-amber-100 text-amber-500 rounded-xl shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <span className="tactical-label text-amber-600 font-black tracking-widest block mb-1">Inatividade</span>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                    Há {stats.insights?.inatividade || 0} clientes sem novas interações no mês atual.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="stealth-card p-6 border-l-4 border-l-blue-500 bg-blue-50/30 border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white border border-blue-100 text-blue-600 rounded-xl shadow-sm">
                                <Zap size={24} />
                            </div>
                            <div>
                                <span className="tactical-label text-blue-600 font-black tracking-widest block mb-1">Gap Analysis</span>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                    {stats.insights?.gap || "Filtre por Indústria para ver oportunidades."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Operator Performance Chart */}
                <div className="stealth-card p-6 border-slate-200 bg-white shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Performance por Operador</h3>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={teamStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="operador"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="no_mes" name="No Mês" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="no_dia" name="Hoje" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Industry Distribution Chart (Horizontal) */}
                <div className="stealth-card p-6 border-slate-200 bg-white shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Activity size={18} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Interações por Indústria</h3>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={industryStats}
                                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} minPointSize={5}>
                                    {industryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CRMPage() {
    const [viewMode, setViewMode] = useState('dashboard');
    const [interacoes, setInteracoes] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHoje: 0,
        totalMes: 0,
        total30d: 0,
        totalSemana: 0,
        pendentes: 0,
        insights: { inatividade: 0, gap: "" }
    });
    const [team, setTeam] = useState([]);
    const [teamStats, setTeamStats] = useState([]);
    const [industryStats, setIndustryStats] = useState([]);
    const [lastPurchases, setLastPurchases] = useState([]);

    const [novaInteracaoOpen, setNovaInteracaoOpen] = useState(false);
    const [novaOportunidadeOpen, setNovaOportunidadeOpen] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [selectedInteraction, setSelectedInteraction] = useState(null);
    const [helpOpen, setHelpOpen] = useState(false);

    const [filterCli, setFilterCli] = useState(null);
    const [filterVen, setFilterVen] = useState('');
    const [filterInd, setFilterInd] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [industrias, setIndustrias] = useState([]);

    // Initialize dates with current month range
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        setDataInicio(firstDay);
        setDataFim(lastDay);
    }, []);

    useEffect(() => {
        if (filterCli) {
            fetch(`${NODE_API_URL}/api/crm/client/${filterCli}/last-purchases`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setLastPurchases(data.data);
                })
                .catch(err => console.error("Error fetching purchases:", err));
        } else {
            setLastPurchases([]);
        }
    }, [filterCli]);

    const refreshData = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            const venCodigo = user.id;

            let statsUrl = `${NODE_API_URL}/api/crm/stats/summary`;
            let intUrl = `${NODE_API_URL}/api/crm/interacoes`;
            let queryParams = [];

            if (venCodigo) {
                queryParams.push(`ven_codigo=${venCodigo}`);
            } else if (filterVen) {
                queryParams.push(`ven_nome=${encodeURIComponent(filterVen)}`);
            }

            if (filterCli) queryParams.push(`cli_codigo=${filterCli}`);
            if (filterInd && filterInd !== 'all') queryParams.push(`for_codigo=${filterInd}`);
            if (dataInicio) queryParams.push(`data_inicio=${dataInicio}`);
            if (dataFim) queryParams.push(`data_fim=${dataFim}`);

            const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

            const [intRes, pipeRes, indRes, statsRes, teamLiveRes, teamStatsRes, indStatsRes] = await Promise.all([
                fetch(`${intUrl}${queryStr}`),
                fetch(`${NODE_API_URL}/api/crm/pipeline${queryStr}`),
                fetch(`${NODE_API_URL}/api/suppliers`),
                fetch(`${statsUrl}${queryStr}`),
                fetch(`${NODE_API_URL}/api/crm/stats/live-feed${queryStr}`),
                fetch(`${NODE_API_URL}/api/crm/stats/team${queryStr}`),
                fetch(`${NODE_API_URL}/api/crm/stats/industries${queryStr}`)
            ]);

            const intData = await intRes.json();
            const pipeData = await pipeRes.json();
            const indData = await indRes.json();
            const statsData = await statsRes.json();
            const teamLiveData = await teamLiveRes.json();
            const teamStatsData = await teamStatsRes.json();
            const indStatsData = await indStatsRes.json();

            if (intData.success) {
                setInteracoes(intData.data);
            }
            if (statsData.success) {
                setStats(statsData.data);
            }
            if (teamLiveData.success) {
                setTeam(teamLiveData.data);
            }
            if (teamStatsData.success) {
                setTeamStats(teamStatsData.data);
            }
            if (indStatsData.success) {
                setIndustryStats(indStatsData.data);
            }
            if (pipeData.success) setPipeline(pipeData.data);
            if (indData.success || Array.isArray(indData)) setIndustrias(indData.success ? indData.data : indData);

        } catch (error) {
            console.error(error);
            toast.error('Erro de conexão ao Datastream');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [filterCli, filterInd, dataInicio, dataFim, filterVen]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        const oppId = activeId.replace('opp-', '');
        const targetStageId = overId.startsWith('stage-') ? overId.replace('stage-', '') : null;

        if (!targetStageId) return;

        try {
            await fetch(`${NODE_API_URL}/api/crm/oportunidades/${oppId}/move`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ etapa_id: parseInt(targetStageId) })
            });
            toast.success('Realocação Concluída');
            refreshData();
        } catch (error) {
            toast.error('Erro na persistência do movimento');
        }
    };

    const handleQuickAction = async (action, data) => {
        if (action === 'whatsapp') {
            const phone = (data.telefone_contato || data.cli_fone1)?.replace(/\D/g, '');
            if (!phone) { toast.error('Falha de sinal: telefone ausente'); return; }
            window.open(`https://wa.me/55${phone}`, '_blank');
        }
    };

    const fetchClients = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/clients?search=${encodeURIComponent(search || '')}&limit=10`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) { return []; }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-500/30 overflow-hidden">
            {/* Command Sidebar */}
            <aside className="w-16 border-slate-200 flex flex-col items-center py-6 gap-6 bg-white shadow-sm z-20">
                <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-xl mb-4 shadow-lg shadow-blue-500/20">
                    <Shield size={24} className="text-white" />
                </div>
                {[
                    { mode: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                    { mode: 'kanban', icon: Columns, label: 'Strategic Pipeline' },
                    { mode: 'list', icon: List, label: 'Data Logs' }
                ].map(item => (
                    <button
                        key={item.mode}
                        onClick={() => setViewMode(item.mode)}
                        title={item.label}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                            viewMode === item.mode ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <item.icon size={20} />
                    </button>
                ))}
                <div className="mt-auto flex flex-col gap-4">
                    <button
                        onClick={() => setHelpOpen(true)}
                        title="Manual de Operações"
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                        <HelpCircle size={20} />
                    </button>
                </div>
            </aside>

            {/* Operational Surface */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shadow-sm z-10">
                    <div>
                        <span className="tactical-label block !mb-0 text-blue-600">Terminal de Inteligência</span>
                        <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                            {viewMode === 'dashboard' ? 'Overview' : viewMode === 'kanban' ? 'Strategic Pipeline' : 'Data Logs'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        <Button
                            onClick={() => viewMode === 'kanban' ? setNovaOportunidadeOpen(true) : setNovaInteracaoOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={14} className="mr-2 stroke-[3]" />
                            Nova Entrada
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {viewMode === 'dashboard' ? (
                                <CRMDashboard
                                    stats={stats}
                                    team={team}
                                    teamStats={teamStats}
                                    industryStats={industryStats}
                                    industrias={industrias}
                                    filterCli={filterCli}
                                    setFilterCli={setFilterCli}
                                    filterInd={filterInd}
                                    setFilterInd={setFilterInd}
                                    dataInicio={dataInicio}
                                    setDataInicio={setDataInicio}
                                    dataFim={dataFim}
                                    setDataFim={setDataFim}
                                    fetchClients={fetchClients}
                                    filterVen={filterVen}
                                    setFilterVen={setFilterVen}
                                    lastPurchases={lastPurchases}
                                    loading={loading}
                                />
                            ) : viewMode === 'kanban' ? (
                                <div className="h-full p-6 pt-2 overflow-x-auto custom-scrollbar">
                                    <KanbanBoard
                                        pipeline={pipeline}
                                        onDragEnd={handleDragEnd}
                                        onCardClick={(opp) => { setSelectedOpportunity(opp); setNovaOportunidadeOpen(true); }}
                                        onQuickAction={handleQuickAction}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col bg-[#f8fafc]">
                                    <div className="p-6 border-b border-slate-200 bg-white flex flex-wrap gap-4 items-end shadow-sm relative z-50">
                                        <div className="flex-1 min-w-[200px] space-y-2">
                                            <span className="tactical-label">Período (Início - Fim)</span>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={dataInicio}
                                                    onChange={(e) => setDataInicio(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-lg h-12 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <input
                                                    type="date"
                                                    value={dataFim}
                                                    onChange={(e) => setDataFim(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-lg h-12 px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-[300px] space-y-2">
                                            <span className="tactical-label">Alvo / Cliente</span>
                                            <DbComboBox
                                                placeholder="Sincronizar cliente..."
                                                value={filterCli}
                                                onChange={(val) => setFilterCli(val)}
                                                fetchData={fetchClients}
                                                labelKey="cli_nomred"
                                                valueKey="cli_codigo"
                                            />
                                        </div>
                                        <div className="w-[200px] space-y-2">
                                            <span className="tactical-label">Setor / Indústria</span>
                                            <Select value={filterInd} onValueChange={setFilterInd}>
                                                <SelectTrigger className="bg-white border-slate-200 rounded-lg h-12 text-sm">
                                                    <SelectValue placeholder="Indústria" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200 text-slate-700">
                                                    <SelectItem value="all">Todas as Indústrias</SelectItem>
                                                    {industrias.map(ind => (
                                                        <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                                            {ind.nomeReduzido || ind.razaoSocial}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(filterCli || filterInd || dataInicio || dataFim) && (
                                            <Button variant="ghost" onClick={() => { setFilterCli(null); setFilterInd(''); setDataInicio(''); setDataFim(''); }} className="h-11 px-4 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">
                                                <FilterX size={14} className="mr-2" /> Reset
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                        <div className="max-w-6xl mx-auto space-y-4 pb-12">
                                            {/* Últimas Compras (Visível apenas quando um cliente é selecionado) */}
                                            {filterCli && lastPurchases.length > 0 && (
                                                <div className="mb-10 bg-white/50 p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                        <div className="flex flex-col">
                                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Histórico Recente de Compras</h3>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Últimos 10 Pedidos / Faturados</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                                        {lastPurchases.map((purchase) => (
                                                            <motion.div
                                                                key={purchase.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="bg-white border border-slate-200 p-3 rounded-xl hover:shadow-md transition-all group relative overflow-hidden"
                                                            >
                                                                <div className={`absolute top-0 right-0 w-1 h-full ${purchase.status === 'F' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[9px] font-black text-slate-400 font-mono">#{purchase.id}</span>
                                                                    <Badge className={`${purchase.status === 'F' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'} border text-[8px] font-black px-1.5 h-4 uppercase`}>
                                                                        {purchase.status === 'F' ? 'Faturado' : 'Pedido'}
                                                                    </Badge>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <h4 className="text-[10px] font-black text-slate-800 uppercase line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                                        {purchase.industry}
                                                                    </h4>
                                                                    <div className="text-sm font-black text-slate-900">
                                                                        {formatCurrency(purchase.value)}
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                                                                    <span className="text-[10px] font-bold text-slate-400">{formatDate(purchase.date)}</span>
                                                                    <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{purchase.quantity} ITENS</span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {interacoes.length === 0 ? (
                                                <div className="h-40 flex items-center justify-center opacity-20">
                                                    <span className="tactical-label text-zinc-600">Nenhum registro encontrado</span>
                                                </div>
                                            ) : (
                                                interacoes.map((item, idx) => {
                                                    const Icon = getTypeIcon(item.tipo);
                                                    return (
                                                        <motion.div
                                                            key={item.interacao_id}
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            className="stealth-card p-4 flex gap-6 group hover:translate-x-1 transition-all"
                                                        >
                                                            <div className="w-10 h-10 shrink-0 bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                                <Icon className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="text-sm font-black uppercase tracking-tight text-white">{item.cli_nomred}</h4>
                                                                        <div className="flex items-center gap-3 mt-1.5">
                                                                            <span className="text-xs font-mono text-emerald-500 font-bold">{item.tipo}</span>
                                                                            <span className="text-xs text-zinc-800">/</span>
                                                                            <span className="text-xs text-zinc-500 font-mono italic">{formatDateTime(item.data_interacao)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-600 uppercase rounded-none px-2 h-6 font-bold">
                                                                        {item.resultado || 'REGISTERED'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-zinc-600 text-sm leading-relaxed font-medium bg-slate-50 p-3 border-l-2 border-slate-200 italic">
                                                                    "{item.descricao || "Relatório sem observações."}"
                                                                </p>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                                                                <button onClick={() => { setSelectedInteraction(item); setNovaInteracaoOpen(true); }} className="p-2 text-zinc-700 hover:text-white">
                                                                    <Pencil size={14} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Command Modals */}
            <NovaInteracaoModal
                open={novaInteracaoOpen}
                onClose={() => { setNovaInteracaoOpen(false); setSelectedInteraction(null); }}
                onSuccess={refreshData}
                editData={selectedInteraction}
            />
            <NovaOportunidadeModal
                open={novaOportunidadeOpen}
                onClose={() => { setNovaOportunidadeOpen(false); setSelectedOpportunity(null); }}
                onSuccess={refreshData}
                opportunity={selectedOpportunity}
            />
            <CRMHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
    );
}
