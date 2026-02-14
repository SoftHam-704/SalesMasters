
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
    HardHat
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import RepCrmHelpAssistant from '../../components/repcrm/RepCrmHelpAssistant';
import NovaInteracaoModal from '../../components/crm/NovaInteracaoModal';
import NovaOportunidadeModal from '../../components/crm/NovaOportunidadeModal';
import OrderFormProjetos from '../../components/orders/OrderFormProjetos';
import './RepCrmDashboard.css';

const KpiCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="repcrm-kpi-card"
    >
        <div className="repcrm-kpi-content">
            <div className={`repcrm-kpi-icon-wrapper ${color}`}>
                <Icon size={24} />
            </div>
            <div className="repcrm-kpi-info">
                <span className="repcrm-kpi-title">{title}</span>
                <h3 className="repcrm-kpi-value">{value}</h3>
                <div className="repcrm-kpi-footer">
                    <span className={`repcrm-kpi-trend ${trend === 'up' ? 'positive' : 'negative'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trendValue}
                    </span>
                    <span className="repcrm-kpi-subvalue">{subValue}</span>
                </div>
            </div>
        </div>
        <div className="repcrm-kpi-bg-accent" />
    </motion.div>
);

const RepCrmDashboard = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [pipeline, setPipeline] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // AI Suggestions State
    const [aiInsight, setAiInsight] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Modals state
    const [isInteracaoOpen, setIsInteracaoOpen] = useState(false);
    const [isOportunidadeOpen, setIsOportunidadeOpen] = useState(false);
    const [isProjetoOpen, setIsProjetoOpen] = useState(false);
    const [interacaoPreData, setInteracaoPreData] = useState(null);

    // Contexto de Ramo de Atividade (Projetos vs Produtos)
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tenantConfig = JSON.parse(sessionStorage.getItem('tenantConfig') || '{}');
    const isProjetos = user.ramoatv === 'Projetos' || tenantConfig.ramoatv === 'Projetos';

    const handleGetAiInsight = async () => {
        setIsAiLoading(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            const projectInsights = [
                "IA STRATEGIC: Identificamos 5 projetos em fase de 'Orçamento' com mais de 15 dias sem interação técnica. Sugiro envio de portfólio de cases similares.",
                "IA STRATEGIC: A região Sul apresenta demanda crescente por Mezaninos. Otimize a rota para visitar grandes CDs de logística.",
                "IA STRATEGIC: O cliente 'Logística XP' aprovou o Anteprojeto. Momento ideal para agendar a medição técnica em campo.",
                "IA STRATEGIC: Notamos que 30% das perdas de projetos Bertolini ocorrem na transição para o 'Executivo'. Revisar fluxo de aprovação."
            ];
            const productInsights = [
                "IA INSIGHT: Percebi que os clientes da Indústria Bertolini estão com atraso médio de 12 dias nos pedidos este mês.",
                "IA INSIGHT: 15 clientes Curva B não recebem visita há mais de 60 dias. Potencial de R$ 85k em recuperação.",
                "IA INSIGHT: A categoria 'Estantes e Racks' teve um pico de procura na região Norte. Ótimo momento para campanha!",
                "IA INSIGHT: Notamos que o Supermercado Real está aumentando as compras na concorrência. Sugiro uma visita de cortesia."
            ];
            const relevantInsights = isProjetos ? projectInsights : productInsights;
            setAiInsight(relevantInsights[Math.floor(Math.random() * relevantInsights.length)]);
            toast.info("A Inteligência CRM-Rep mapeou novas oportunidades de engenharia!");
        } catch (e) {
            toast.error("Erro ao consultar inteligência.");
        } finally {
            setIsAiLoading(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        fetchStats();
        fetchPipeline();
        return () => clearInterval(timer);
    }, []);

    const fetchPipeline = async () => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const ven_codigo = userData.ven_codigo;

            const res = await axios.get('/crm/pipeline', {
                params: { ven_codigo: ven_codigo }
            });
            if (res.data.success) {
                setPipeline(res.data.data);
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
            toast.error("Erro ao carregar estatísticas do dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickInteraction = (canalId = null, tipoId = null) => {
        setInteracaoPreData({
            canal_id: canalId,
            tipo_interacao_id: tipoId
        });
        setIsInteracaoOpen(true);
        setIsMenuOpen(false);
    };

    const handleQuickOpportunity = () => {
        if (isProjetos) {
            setIsProjetoOpen(true);
        } else {
            setIsOportunidadeOpen(true);
        }
        setIsMenuOpen(false);
    };

    const handleQuickVisit = () => {
        // Para "Lançar Visita", abrimos o modal de interação com tipo Visita selecionado
        // O ideal é que o vendedor selecione o cliente no modal
        handleQuickInteraction(1, 1); // Ex: Canal Presencial, Tipo Visita
    };

    const formattedDate = currentTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="repcrm-dashboard-container custom-scrollbar">
            {/* Header Section */}
            <header className="repcrm-dashboard-header">
                <div className="repcrm-welcome">
                    <h1 className="repcrm-title">Dashboard <span className="text-blue-600">CRM-Rep</span></h1>
                    <p className="repcrm-subtitle">
                        <Calendar size={16} className="inline mr-2 text-slate-400" />
                        {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                    </p>
                </div>
                <div className="repcrm-header-actions">
                    {isProjetos && (
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 shadow-lg shadow-indigo-600/20 mr-4">
                            <HardHat size={14} className="animate-bounce" />
                            ENGINEERING SPECIALIST MODE
                        </div>
                    )}
                    <div className="repcrm-status-badge">
                        <span className="status-dot animate-pulse" />
                        Live Intelligence
                    </div>
                </div>
            </header>

            {/* Fernanda Strategic Insights (Plan B) */}
            <div className="fernanda-insight-wrapper">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fernanda-card"
                >
                    <div className="fernanda-avatar-wrapper">
                        <div className="fernanda-avatar">
                            <Sparkles size={16} className="text-white animate-pulse" />
                        </div>
                        <div className="fernanda-status-ring" />
                    </div>

                    <div className="fernanda-content">
                        <div className="fernanda-header">
                            <span className="fernanda-name">CRM-Rep AI</span>
                            <span className="fernanda-label">Inteligência Estratégica</span>
                        </div>
                        <div className="fernanda-message">
                            {isAiLoading ? (
                                <div className="fernanda-typing">
                                    <span></span><span></span><span></span>
                                </div>
                            ) : (
                                <p>{aiInsight || "Analisando sua carteira para identificar oportunidades... Clique no botão para gerar um insight."}</p>
                            )}
                        </div>
                    </div>

                    <div className="fernanda-actions">
                        <button
                            onClick={handleGetAiInsight}
                            disabled={isAiLoading}
                            className="fernanda-refresh-btn"
                        >
                            {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                            <span>Gerar Novo Insight</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Top KPIs Grid */}
            <div className="repcrm-kpi-grid">
                <KpiCard
                    title="Faturamento Total"
                    value={formatCurrency(stats?.total_vendido_current || 0)}
                    subValue="vs. mês anterior"
                    icon={TrendingUp}
                    trend={stats?.vendas_percent_change >= 0 ? 'up' : 'down'}
                    trendValue={`${Number(stats?.vendas_percent_change || 0).toFixed(1)}%`}
                    color="blue"
                />
                <KpiCard
                    title="Comissões Previstas"
                    value={formatCurrency((stats?.total_vendido_current || 0) * 0.05)} // Mock 5% por enquanto
                    subValue="Estimado (5%)"
                    icon={DollarSign}
                    trend="up"
                    trendValue="--"
                    color="emerald"
                />
                <KpiCard
                    title="Positivação"
                    value={stats?.clientes_atendidos_current || 0}
                    subValue="Clientes com pedido"
                    icon={Users}
                    trend={stats?.clientes_percent_change >= 0 ? 'up' : 'down'}
                    trendValue={`${Number(stats?.clientes_percent_change || 0).toFixed(1)}%`}
                    color="amber"
                />
                <KpiCard
                    title="Meta do Mês"
                    value={formatCurrency(stats?.meta_total || 0)}
                    subValue={stats?.meta_total > 0
                        ? `Falta ${formatCurrency(Math.max(0, stats.meta_total - stats.total_vendido_current))}`
                        : "Meta não definida"}
                    icon={Target}
                    trend="up"
                    trendValue={stats?.meta_total > 0
                        ? `Progresso: ${((stats.total_vendido_current / stats.meta_total) * 100).toFixed(0)}%`
                        : "0%"}
                    color="purple"
                />
            </div>

            {/* Main Content Grid */}
            <div className="repcrm-main-grid">

                {/* Visual Pipeline / Funnel */}
                <div className="repcrm-card repcrm-funnel-card">
                    <div className="repcrm-card-header">
                        <h3 className="repcrm-card-title">Funil de Vendas (Oportunidades)</h3>
                        <button className="repcrm-card-action" onClick={() => navigate('/repcrm/pipeline')}>Ver Detalhes <ChevronRight size={16} /></button>
                    </div>
                    <div className="repcrm-funnel-container">
                        {pipeline.map((stage, idx) => {
                            const stageTotal = stage.items.reduce((sum, item) => sum + parseFloat(item.valor_estimado || 0), 0);
                            const maxTotal = Math.max(...pipeline.map(s => s.items.reduce((sum, item) => sum + parseFloat(item.valor_estimado || 0), 0)), 1);
                            const widthPerc = Math.max(15, (stageTotal / maxTotal) * 100);

                            return (
                                <div key={stage.etapa_id} className={`repcrm-funnel-step step-${stage.titulo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                                    <div className="step-label">{stage.titulo}</div>
                                    <div className="step-bar" style={{ width: `${widthPerc}%` }}>
                                        <span className="step-value">{formatCurrency(stageTotal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {pipeline.length === 0 && <div className="text-center p-4 text-slate-400">Nenhuma oportunidade no funil</div>}
                    </div>
                </div>

                {/* Golden Opportunities / Intelligence */}
                <div className="repcrm-card repcrm-opportunities-card">
                    <div className="repcrm-card-header">
                        <h3 className="repcrm-card-title">Oportunidades de Ouro</h3>
                        <button
                            onClick={handleGetAiInsight}
                            disabled={isAiLoading}
                            className={`repcrm-ai-badge-btn ${isAiLoading ? 'loading' : ''}`}
                        >
                            {isAiLoading ? <Target size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                            DICA DO ASSISTENTE
                        </button>
                    </div>
                    <div className="repcrm-opportunities-list">
                        <div className="repcrm-opp-item cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate('/repcrm/cliente/123')}>
                            <div className="opp-icon"><Building2 size={18} className="text-indigo-600" /></div>
                            <div className="opp-info">
                                <strong>Logística XP S.A.</strong>
                                <p>{isProjetos ? 'Projeto Galpão 3: Aguardando Medição' : 'Forte em Bertolini, mas nunca comprou Empilhadeiras.'}</p>
                            </div>
                            <button className="opp-action"><ArrowUpRight size={18} /></button>
                        </div>
                        <div className="repcrm-opp-item cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate('/repcrm/cliente/456')}>
                            <div className="opp-icon"><AlertCircle size={18} className="text-amber-500" /></div>
                            <div className="opp-info">
                                <strong>Supermercado Real</strong>
                                <p>Clientes Curva A sem pedido há 45 dias.</p>
                            </div>
                            <button className="opp-action"><ArrowUpRight size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Today's Agenda / Visits */}
                <div className="repcrm-card repcrm-agenda-card">
                    <div className="repcrm-card-header">
                        <h3 className="repcrm-card-title">Agenda Comercial</h3>
                        <span className="repcrm-count-badge">3 Visitas</span>
                    </div>
                    <div className="repcrm-agenda-list">
                        <div className="repcrm-visit-item active">
                            <div className="visit-time">09:00</div>
                            <div className="visit-info">
                                <strong>Distribuidora Norte</strong>
                                <p><MapPin size={12} className="inline" /> Rua das Indústrias, 450</p>
                            </div>
                            <div className="visit-status">A caminho</div>
                        </div>
                        <div className="repcrm-visit-item">
                            <div className="visit-time">14:30</div>
                            <div className="visit-info">
                                <strong>Marmoraria Granito</strong>
                                <p><MapPin size={12} className="inline" /> Av. Principal, 102</p>
                            </div>
                            <div className="visit-status">Agendado</div>
                        </div>
                    </div>
                </div>

                {/* Cooling Down Clients */}
                <div className="repcrm-card repcrm-cooling-card">
                    <div className="repcrm-card-header">
                        <h3 className="repcrm-card-title">Recuperação de Carteira</h3>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Inatividades</span>
                    </div>
                    <div className="repcrm-cooling-list">
                        <div className="repcrm-cool-item cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all" onClick={() => navigate('/repcrm/cliente/789')}>
                            <div className="cool-days text-rose-500">62d</div>
                            <div className="cool-info">
                                <strong>Fábrica de Gelo Sul</strong>
                                <p>Último pedido: R$ 12.400</p>
                            </div>
                            <button className="cool-btn">Ligar</button>
                        </div>
                        <div className="repcrm-cool-item cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all" onClick={() => navigate('/repcrm/cliente/321')}>
                            <div className="cool-days text-amber-500">35d</div>
                            <div className="cool-info">
                                <strong>TransLog S.A.</strong>
                                <p>Último pedido: R$ 5.900</p>
                            </div>
                            <button className="cool-btn">Ligar</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* QUICK ACTION FAB */}
            <div className={`repcrm-fab-container ${isMenuOpen ? 'active' : ''}`}>
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="repcrm-fab-menu"
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        >
                            <button className="fab-menu-item" onClick={handleQuickVisit}>
                                <div className="fab-icon bg-emerald-100 text-emerald-600"><MapPin size={20} /></div>
                                <span>{isProjetos ? 'Visita Técnica' : 'Lançar Visita'}</span>
                            </button>
                            <button className="fab-menu-item" onClick={() => handleQuickInteraction(3, null)}>
                                <div className="fab-icon bg-blue-100 text-blue-600"><Phone size={20} /></div>
                                <span>Registrar Ligação</span>
                            </button>
                            <button className="fab-menu-item" onClick={handleQuickOpportunity}>
                                <div className="fab-icon bg-purple-100 text-purple-600"><Target size={20} /></div>
                                <span>Nova Oportunidade</span>
                            </button>
                            <button className="fab-menu-item" onClick={() => { setIsMenuOpen(false); navigate(isProjetos ? '/pedidos' : '/pedidos/novo'); }}>
                                <div className="fab-icon bg-blue-600 text-white"><Plus size={20} /></div>
                                <span>{isProjetos ? 'Gerenciar Projetos' : 'Gerar Pedido'}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    className={`repcrm-fab-main ${isMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            <RepCrmHelpAssistant />

            {/* Modals for FAB actions */}
            <NovaInteracaoModal
                open={isInteracaoOpen}
                onClose={() => { setIsInteracaoOpen(false); setInteracaoPreData(null); }}
                onSuccess={() => { fetchStats(); fetchPipeline(); }}
                editData={interacaoPreData}
            />

            <NovaOportunidadeModal
                open={isOportunidadeOpen}
                onClose={() => setIsOportunidadeOpen(false)}
                onSuccess={() => { fetchStats(); fetchPipeline(); }}
            />

            {isProjetoOpen && (
                <OrderFormProjetos
                    onClose={() => setIsProjetoOpen(false)}
                    onSave={(prj) => {
                        setIsProjetoOpen(false);
                        fetchStats();
                        fetchPipeline();
                        toast.success("Oportunidade de Projeto registrada com sucesso!");
                    }}
                />
            )}
        </div>
    );
};

export default RepCrmDashboard;
