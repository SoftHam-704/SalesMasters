
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Phone,
    Mail,
    TrendingUp,
    Calendar,
    ShoppingBag,
    MessageSquare,
    AlertCircle,
    ChevronRight,
    ArrowLeft,
    Plus,
    CheckCircle2,
    DollarSign,
    Target,
    Zap,
    ExternalLink,
    X,
    Send
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import './RepCrmClient360.css';

const StatMiniCard = ({ label, value, color }) => (
    <div className="client360-mini-stat">
        <span className="mini-stat-label">{label}</span>
        <span className={`mini-stat-value ${color}`}>{value}</span>
    </div>
);

const IndustryBadge = ({ name, status, value }) => (
    <div className={`industry-matrix-item ${status}`}>
        <div className="industry-status-dot" />
        <div className="industry-info">
            <span className="industry-name">{name}</span>
            <span className="industry-status-label">
                {status === 'active' ? `Ativo (${value})` : 'Sem Vendas (GAP)'}
            </span>
        </div>
        {status === 'gap' && <Zap size={14} className="text-amber-500 ml-auto" />}
    </div>
);

const RepCrmClient360 = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('timeline');
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [interactions, setInteractions] = useState([]);

    // Interaction Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        tipo_interacao_id: '',
        canal_id: '',
        resultado_id: '',
        descricao: '',
        industrias: [] // Selected industry IDs
    });

    const [lookups, setLookups] = useState({
        tipos: [],
        canais: [],
        resultados: []
    });

    useEffect(() => {
        fetchData();
        fetchLookups();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Client Profile
            const cliRes = await axios.get(`/clients/${id}`);
            if (cliRes.data) setClient(cliRes.data);

            // 2. Interactions (Timeline)
            const intRes = await axios.get('/crm/interacoes', { params: { cli_codigo: id } });
            if (intRes.data.success) setInteractions(intRes.data.data);

            // 3. Matrix (Penetration GAPs)
            const matRes = await axios.get(`/crm/client-matrix/${id}`);
            if (matRes.data.success) setIndustries(matRes.data.data);

        } catch (error) {
            console.error('Erro ao buscar dados 360:', error);
            toast.error("Erro ao carregar ficha do cliente");
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [t, c, r] = await Promise.all([
                axios.get('/crm/tipos'),
                axios.get('/crm/canais'),
                axios.get('/crm/resultados')
            ]);
            setLookups({
                tipos: t.data.data || [],
                canais: c.data.data || [],
                resultados: r.data.data || []
            });
        } catch (err) {
            console.error('Erro lookups CRM:', err);
        }
    };

    const handleSaveInteraction = async () => {
        if (!form.tipo_interacao_id || !form.canal_id || !form.descricao) {
            toast.warning("Preencha os campos obrigatórios");
            return;
        }

        setSaving(true);
        try {
            // Get ven_codigo from session (default to 1 for now)
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            const ven_codigo = userData.ven_codigo || 1;

            const res = await axios.post('/crm/interacoes', {
                ...form,
                cli_codigo: id,
                ven_codigo: ven_codigo
            });

            if (res.data.success) {
                toast.success("Interação registrada com sucesso!");
                setIsDrawerOpen(false);
                setForm({ tipo_interacao_id: '', canal_id: '', resultado_id: '', descricao: '', industrias: [] });
                fetchData(); // Refresh timeline
            }
        } catch (error) {
            toast.error("Erro ao salvar interação");
        } finally {
            setSaving(false);
        }
    };

    const handleCheckin = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocalização não suportada");
            return;
        }

        const toastId = toast.loading("Capturando localização...");

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
                const { latitude, longitude, accuracy } = position.coords;

                const res = await axios.post('/crm/checkin', {
                    ven_codigo: userData.ven_codigo || 1,
                    cli_codigo: id,
                    latitude,
                    longitude,
                    precisao: accuracy,
                    tipo: 'VISITA'
                });

                if (res.data.success) {
                    toast.success("Check-in realizado!", { id: toastId });
                } else {
                    toast.error(res.data.message || "Erro no check-in", { id: toastId });
                }
            } catch (error) {
                console.error('Erro no checkin:', error);
                toast.error("Falha ao registrar check-in", { id: toastId });
            }
        }, (error) => {
            toast.error(`Localização negada: ${error.message}`, { id: toastId });
        }, { enableHighAccuracy: true });
    };

    if (loading && !client) return <div className="client360-loading">Carregando Ficha 360...</div>;

    return (
        <div className="client360-container custom-scrollbar">
            {/* Top Navigation */}
            <nav className="client360-nav">
                <button onClick={() => navigate('/repcrm/dashboard')} className="back-btn">
                    <ArrowLeft size={18} /> Dashboard
                </button>
                <div className="nav-actions">
                    <button
                        className="action-btn secondary"
                        onClick={handleCheckin}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                    >
                        <MapPin size={16} /> Check-in
                    </button>
                    <button
                        className="action-btn secondary"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        <Plus size={16} /> Nova Interação
                    </button>
                    <button
                        className="action-btn primary"
                        onClick={() => navigate('/pedidos', { state: { client: client } })}
                    >
                        <ShoppingBag size={16} /> Gerar Pedido
                    </button>
                </div>
            </nav>

            <div className="client360-layout">
                {/* Left Profile Card */}
                <aside className="client360-profile">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {client?.cli_ranking || 'B'}
                        </div>
                        <div className="profile-titles">
                            <h1 className="client-name">{client?.cli_nomred || client?.cli_nome}</h1>
                            <span className="client-cnpj">{client?.cli_cgccpf}</span>
                        </div>
                    </div>

                    <div className="profile-badges">
                        <span className="badge-ranking">Curva {client?.cli_ranking}</span>
                        <span className="badge-status">Status: {client?.cli_tipopes === 'A' ? 'Ativo' : 'Inativo'}</span>
                    </div>

                    <div className="profile-info-list">
                        <div className="info-item">
                            <MapPin size={16} />
                            <span>{client?.cli_endereco}, {client?.cli_bairro} - {client?.cli_cidade}/{client?.cli_uf}</span>
                        </div>
                        <div className="info-item">
                            <Phone size={16} />
                            <span>{client?.cli_fone1}</span>
                        </div>
                        <div className="info-item">
                            <Mail size={16} />
                            <span>{client?.cli_email}</span>
                        </div>
                    </div>

                    <div className="profile-stats-grid">
                        <StatMiniCard label="Venda Média" value={formatCurrency(18500)} color="text-blue-600" />
                        <StatMiniCard label="Inadimplência" value={formatCurrency(0)} color="text-emerald-600" />
                        <StatMiniCard label="Último Pedido" value="12 dias" color="text-slate-600" />
                        <StatMiniCard label="Positivação" value="84%" color="text-purple-600" />
                    </div>

                    <button
                        className="whatsapp-direct-btn"
                        onClick={() => window.open(`https://wa.me/55${client?.cli_fone1?.replace(/\D/g, '')}`, '_blank')}
                    >
                        <MessageSquare size={18} /> Chamar no WhatsApp
                    </button>
                </aside>

                {/* Center Content: Timeline & Matrix */}
                <main className="client360-main">

                    {/* Industry Matrix Header */}
                    <section className="client360-section matrix-section">
                        <div className="section-header">
                            <h3 className="section-title">Matriz de Penetração (Representadas)</h3>
                            <div className="ai-insight-tag">IA INSIGHT: GAP DETECTADO</div>
                        </div>
                        <div className="industry-matrix-grid">
                            {industries.map((ind, idx) => (
                                <IndustryBadge key={idx} {...ind} />
                            ))}
                        </div>
                    </section>

                    {/* Tabs Navigation */}
                    <div className="client360-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                            onClick={() => setActiveTab('timeline')}
                        >
                            Histórico 360º
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pedidos')}
                        >
                            Pedidos Faturados
                        </button>
                    </div>

                    {/* Timeline Content */}
                    <div className="tab-content">
                        {activeTab === 'timeline' && (
                            <div className="timeline-container">
                                {interactions.length === 0 ? (
                                    <div className="empty-state">
                                        <MessageSquare size={40} />
                                        <p>Nenhuma interação registrada recentemente.</p>
                                    </div>
                                ) : (
                                    interactions.map((event) => (
                                        <div key={event.interacao_id} className="timeline-item">
                                            <div className="timeline-date">
                                                <span className="day">{new Date(event.data_interacao).getDate()}</span>
                                                <span className="month">
                                                    {new Date(event.data_interacao).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="timeline-content-card">
                                                <div className="card-header">
                                                    <div className="type-icon-wrapper">
                                                        {event.tipo?.toLowerCase().includes('visita') ? <User size={16} /> :
                                                            event.tipo?.toLowerCase().includes('whatsapp') ? <MessageSquare size={16} /> :
                                                                <Calendar size={16} />}
                                                    </div>
                                                    <div className="event-info">
                                                        <h4>{event.tipo} via {event.canal}</h4>
                                                        {event.industrias && (
                                                            <div className="event-industries">
                                                                {event.industrias.map(indId => (
                                                                    <span key={indId} className="mini-ind-tag">Ind #{indId}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`event-status ${event.resultado?.toLowerCase()}`}>
                                                        {event.resultado || 'Registrado'}
                                                    </span>
                                                </div>
                                                <p className="card-desc">{event.descricao}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {activeTab === 'pedidos' && (
                            <div className="empty-state">
                                <ShoppingBag size={48} className="text-slate-200" />
                                <p>Exibindo últimos 12 meses de faturamento integrado.</p>
                                <button className="secondary-btn">Explorar BI do Cliente</button>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Column: Key Contacts & Location */}
                <aside className="client360-side">
                    <div className="side-card">
                        <h4 className="side-card-title">Contatos Chave</h4>
                        <div className="contact-list">
                            <div className="contact-item">
                                <div className="contact-avatar">RC</div>
                                <div className="contact-info">
                                    <strong>Ricardo Costa</strong>
                                    <span>Comprador Bertolini</span>
                                </div>
                            </div>
                            <div className="contact-item">
                                <div className="contact-avatar">AM</div>
                                <div className="contact-info">
                                    <strong>Ana Maria</strong>
                                    <span>Financeiro</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="side-card alerts-card">
                        <h4 className="side-card-title text-rose-600">Pontos de Atenção</h4>
                        <div className="alert-item">
                            <AlertCircle size={14} />
                            <span>Contrato de manutenção Bertolini vence em 30 dias.</span>
                        </div>
                        <div className="alert-item">
                            <TrendingUp size={14} className="text-emerald-500" />
                            <span>Aumento de 20% nas compras de Móveis Office.</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* INTERACTION DRAWER (SIDE MODAL) */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div
                            className="drawer-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                        />
                        <motion.div
                            className="interaction-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="drawer-header">
                                <h3>Registrar Interação</h3>
                                <button onClick={() => setIsDrawerOpen(false)}><X size={20} /></button>
                            </div>

                            <div className="drawer-body custom-scrollbar">
                                <div className="form-group">
                                    <label>Tipo de Interação *</label>
                                    <select
                                        value={form.tipo_interacao_id}
                                        onChange={e => setForm({ ...form, tipo_interacao_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {lookups.tipos.map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label>Canal *</label>
                                        <select
                                            value={form.canal_id}
                                            onChange={e => setForm({ ...form, canal_id: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {lookups.canais.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Resultado</label>
                                        <select
                                            value={form.resultado_id}
                                            onChange={e => setForm({ ...form, resultado_id: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {lookups.resultados.map(r => <option key={r.id} value={r.id}>{r.descricao}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Indústrias Trabalhadas</label>
                                    <div className="industry-selection-grid">
                                        {industries.map(ind => (
                                            <label key={ind.id} className={`ind-check-label ${form.industrias.includes(ind.id) ? 'selected' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.industrias.includes(ind.id)}
                                                    onChange={e => {
                                                        const newInds = e.target.checked
                                                            ? [...form.industrias, ind.id]
                                                            : form.industrias.filter(i => i !== ind.id);
                                                        setForm({ ...form, industrias: newInds });
                                                    }}
                                                />
                                                {ind.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>O que aconteceu? (Notas) *</label>
                                    <textarea
                                        placeholder="Descreva detalhes da conversa, propostas feitas, etc..."
                                        rows={6}
                                        value={form.descricao}
                                        onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="drawer-footer">
                                <button className="cancel-btn" onClick={() => setIsDrawerOpen(false)}>Cancelar</button>
                                <button
                                    className="save-btn"
                                    onClick={handleSaveInteraction}
                                    disabled={saving}
                                >
                                    {saving ? 'Salvando...' : 'Gravar Interação'}
                                    {!saving && <Send size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RepCrmClient360;
