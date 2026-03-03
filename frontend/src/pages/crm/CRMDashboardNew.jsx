import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp, Wallet, Target, Trophy, Sparkles,
    Calendar, ArrowUpRight, Lightbulb, AlertTriangle,
    PhoneCall, Building2, ShoppingCart, Wheat,
    Clock, MapPin, ChevronRight, Search, Filter,
    Eye, Flame, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AiInsightBox, KpiCard, Sparkline, CircleProgress, WhatsAppWidget } from "@/components/crm/dashboard/DashboardComponents";

// Formata Moeda
const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Componente Principal
const CRMDashboardNew = ({
    stats,
    pipeline,
    team,
    onAddInteraction,
    onAddOpportunity,
    loading
}) => {
    const [aiTyping, setAiTyping] = useState(true);

    // Efeito de digitação da IA
    useEffect(() => {
        const t = setTimeout(() => setAiTyping(false), 2800);
        return () => clearTimeout(t);
    }, []);

    // Dados transformados
    const fat = stats.totalMes || 0;
    const com = fat * 0.05; // 5% estimado
    const meta = 80000; // Meta fixa exemplo (ou vir do backend)
    const metaPct = Math.min(((fat / meta) * 100), 100).toFixed(1);

    // Transformar Pipeline em Funil
    const phases = [
        { id: 1, label: "Prospecção", color: "#3B82F6", icon: Search },
        { id: 2, label: "Qualificação", color: "#8B5CF6", icon: Filter },
        { id: 3, label: "Proposta", color: "#F59E0B", icon: Eye },
        { id: 4, label: "Negociação", color: "#F97316", icon: ArrowUpRight },
        { id: 5, label: "Fechamento", color: "#10B981", icon: Target }
    ];

    const funnelData = phases.map(p => {
        const items = pipeline.filter(i => i.etapa_id === p.id);
        const total = items.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
        return { ...p, value: total, count: items.length };
    });

    const funnelMax = Math.max(...funnelData.map(f => f.value), 1);

    // Mock de Oportunidades "Top" (Poderia vir de uma prop 'topOpportunities')
    const opportunities = [
        { name: "Logística XP S.A.", desc: "Forte em Bertolini, mas nunca comprou Empilhadeiras.", icon: Building2, score: 92, tag: "HOT" },
        { name: "Supermercado Real", desc: "Clientes Curva A sem pedido há 45 dias.", icon: ShoppingCart, score: 78, tag: "WARM" },
    ];

    // Mock de Agenda
    const agenda = [
        { time: "09:00", client: "Distribuidora Norte", addr: "Rua das Indústrias, 450", status: "A CAMINHO", statusColor: "text-blue-600 bg-blue-50 border-blue-100" },
        { time: "14:30", client: "Marmoraria Granito", addr: "Av. Principal, 102", status: "AGENDADO", statusColor: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    ];

    const whatsappActive = 0; // Exemplo de contagem

    return (
        <div className="space-y-6">

            {/* AI Insight */}
            <AiInsightBox
                typing={aiTyping}
                insight={stats.insights?.gap ? `Análise: ${stats.insights.gap}` : "Analisando sua carteira para identificar oportunidades... Clique no botão para gerar um insight."}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Faturamento */}
                <KpiCard delay={0.1} glowColor="rgba(59, 130, 246, 0.15)">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <TrendingUp size={18} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Faturamento Total</span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{formatBRL(fat)}</span>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100 px-1.5 h-5 rounded-md">
                                    ↘ -100.0%
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-medium">vs. mês anterior</span>
                            </div>
                        </div>
                    </div>
                    {/* Sparkline Decorativa */}
                    <div className="absolute right-0 bottom-4 opacity-50">
                        <Sparkline data={[10, 25, 15, 30, 45, 20, 60, 40]} color="#3B82F6" />
                    </div>
                </KpiCard>

                {/* Comissões */}
                <KpiCard delay={0.2} glowColor="rgba(16, 185, 129, 0.15)">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Wallet size={18} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Comissões Previstas</span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{formatBRL(com)}</span>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 px-1.5 h-5 rounded-md">
                                    ↗ --
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-medium">Estimado (5%)</span>
                            </div>
                        </div>
                    </div>
                </KpiCard>

                {/* Positivação */}
                <KpiCard delay={0.3} glowColor="rgba(245, 158, 11, 0.15)">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <Target size={18} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Positivação</span>
                            </div>
                            <div>
                                <span className="text-2xl font-black text-slate-900 tracking-tight">0</span>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100 px-1.5 h-5 rounded-md">
                                        ↘ -100.0%
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-medium">Clientes com pedido</span>
                                </div>
                            </div>
                        </div>
                        {/* Circle Chart */}
                        <div className="relative">
                            <CircleProgress value={0} color="#F59E0B" size={48} />
                        </div>
                    </div>
                </KpiCard>

                {/* Meta */}
                <KpiCard delay={0.4} glowColor="rgba(139, 92, 246, 0.15)">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                                <Trophy size={18} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Meta do Mês</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{formatBRL(meta)}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metaPct}%` }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                />
                            </div>

                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">↗ Progresso: {metaPct}%</span>
                                <span className="text-slate-400">Falta {formatBRL(meta - fat)}</span>
                            </div>
                        </div>
                    </div>
                </KpiCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda: WhatsApp + Top Oportunidades */}
                <div className="space-y-6">
                    {/* WhatsApp Widget (INTEGRADO!) */}
                    <div className="h-[200px]">
                        <WhatsAppWidget
                            activeCount={whatsappActive}
                            lastMessage=""
                            onClick={() => { }}
                        />
                    </div>

                    {/* Top Oportunidades */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[200px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-800">Oportunidades de Ouro</h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={10} /> Dica do Assistente
                            </span>
                        </div>
                        <div className="space-y-3">
                            {opportunities.map((opp, i) => (
                                <div key={i} className="group flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${opp.tag === 'HOT' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <opp.icon size={14} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-800">{opp.name}</h3>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[180px]">{opp.desc}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-500" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Coluna Central: Funil (Maior) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Funil de Vendas (Oportunidades)</h2>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            Ver Detalhes <ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="space-y-6 px-2">
                        {funnelData.map((f, index) => (
                            <div key={f.id} className="relative">
                                <div className="flex items-center justify-between mb-2 z-10 relative">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 w-24">{f.label}</span>
                                    <div className="flex-1 px-4">
                                        <div className="h-10 bg-slate-50 rounded-lg overflow-hidden relative flex items-center px-4">
                                            {/* Barra de Progresso */}
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(f.value / funnelMax) * 100}%` }}
                                                transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                                                className="absolute left-0 top-0 h-full opacity-90"
                                                style={{ backgroundColor: f.color }}
                                            />
                                            {/* Valor Texto (Sobre a barra) */}
                                            <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">
                                                {f.value > 0 ? formatBRL(f.value) : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pipeline.length === 0 && (
                            <div className="text-center py-10 opacity-50 text-sm">Nenhuma oportunidade ativa no funil.</div>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agenda Mock */}
                <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold text-slate-800">Agenda Comercial</h2>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100">3 Visitas</Badge>
                    </div>
                    <div className="space-y-4">
                        {agenda.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                <div className="flex flex-col items-center min-w-[50px]">
                                    <span className="text-xs font-bold text-blue-600">{item.time}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-100" />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">{item.client}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                                        <MapPin size={10} /> {item.addr}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Badge className={`text-[9px] font-bold border ${item.statusColor}`}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recuperação */}
                <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold text-slate-800">Recuperação de Carteira</h2>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Inatividades</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: "Fábrica de Gelo Sul", days: 62, val: 12400 },
                            { name: "TransLog S.A.", days: 35, val: 5900 }
                        ].map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-2 hover:bg-red-50/30 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs ring-1 ring-red-100">
                                        {c.days}d
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                                        <span className="text-[10px] text-slate-500">Último pedido: {formatBRL(c.val)}</span>
                                    </div>
                                </div>
                                <button className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-black transition-colors">
                                    Ligar
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

        </div>
    );
};

export default CRMDashboardNew;
