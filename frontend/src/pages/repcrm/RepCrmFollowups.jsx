import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ListChecks, Plus, Check, X, Clock, AlertTriangle, Calendar,
    Phone, MapPin, Mail, MessageSquare, FileText, Users,
    ChevronDown, Filter, Loader2, Trash2, Edit3, Building2
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TABS = [
    { key: 'atrasados', label: 'Atrasados', icon: AlertTriangle, color: 'text-red-500' },
    { key: 'hoje', label: 'Hoje', icon: Clock, color: 'text-amber-500' },
    { key: 'semana', label: 'Semana', icon: Calendar, color: 'text-blue-500' },
    { key: 'todos', label: 'Todos', icon: ListChecks, color: 'text-slate-500' },
];

const TIPOS = [
    { value: 'ligacao', label: 'Ligação', icon: Phone },
    { value: 'visita', label: 'Visita', icon: MapPin },
    { value: 'email', label: 'E-mail', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'proposta', label: 'Proposta', icon: FileText },
    { value: 'reuniao', label: 'Reunião', icon: Users },
    { value: 'outro', label: 'Outro', icon: ListChecks },
];

const PRIORIDADES = [
    { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'media', label: 'Média', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'baixa', label: 'Baixa', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const getTipoIcon = (tipo) => {
    const found = TIPOS.find(t => t.value === tipo);
    return found ? found.icon : ListChecks;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff === -1) return 'Ontem';
    if (diff < -1) return `${Math.abs(diff)} dias atrás`;
    if (diff <= 7) return `Em ${diff} dias`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getStatusColor = (status, dataPrevista) => {
    if (status === 'concluido') return 'border-l-emerald-500 bg-emerald-50/30';
    if (status === 'cancelado') return 'border-l-slate-300 bg-slate-50/50 opacity-60';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dataPrevista + 'T00:00:00');
    if (d < today) return 'border-l-red-500 bg-red-50/30';
    if (d.getTime() === today.getTime()) return 'border-l-amber-500 bg-amber-50/30';
    return 'border-l-blue-500 bg-white';
};

const RepCrmFollowups = () => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const ven_codigo = user.ven_codigo;

    const [followups, setFollowups] = useState([]);
    const [counts, setCounts] = useState({ atrasados: 0, hoje: 0, semana: 0, total_pendentes: 0, concluidos_mes: 0 });
    const [activeTab, setActiveTab] = useState('todos');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        titulo: '', descricao: '', data_prevista: '', prioridade: 'media', tipo: 'outro', cli_codigo: null
    });

    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');

    const fetchFollowups = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ven_codigo };
            if (activeTab !== 'todos') params.periodo = activeTab;

            const [listRes, countRes] = await Promise.all([
                axios.get('/crm/followups', { params }),
                axios.get('/crm/followups/count', { params: { ven_codigo } })
            ]);

            if (listRes.data.success) setFollowups(listRes.data.data);
            if (countRes.data.success) setCounts(countRes.data.data);
        } catch (error) {
            console.error('Erro ao buscar follow-ups:', error);
        } finally {
            setLoading(false);
        }
    }, [ven_codigo, activeTab]);

    useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

    const fetchClients = async (search) => {
        if (!search || search.length < 2) return;
        try {
            const res = await axios.get('/clients', { params: { search, limit: 10 } });
            if (res.data.success) setClients(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleToggleComplete = async (item) => {
        const newStatus = item.status === 'concluido' ? 'pendente' : 'concluido';
        try {
            await axios.patch(`/crm/followups/${item.id}`, { status: newStatus });
            toast.success(newStatus === 'concluido' ? '✅ Follow-up concluído!' : 'Follow-up reaberto');
            fetchFollowups();
        } catch (err) {
            toast.error('Erro ao atualizar follow-up');
        }
    };

    const handleSave = async () => {
        if (!form.titulo || !form.data_prevista) {
            toast.error('Título e data são obrigatórios');
            return;
        }
        try {
            if (editingId) {
                await axios.patch(`/crm/followups/${editingId}`, form);
                toast.success('Follow-up atualizado!');
            } else {
                await axios.post('/crm/followups', { ...form, ven_codigo: ven_codigo || null });
                toast.success('Follow-up criado!');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ titulo: '', descricao: '', data_prevista: '', prioridade: 'media', tipo: 'outro', cli_codigo: null });
            setClientSearch('');
            fetchFollowups();
        } catch (err) {
            toast.error('Erro ao salvar follow-up');
        }
    };

    const handleEdit = (item) => {
        setForm({
            titulo: item.titulo,
            descricao: item.descricao || '',
            data_prevista: item.data_prevista?.substring(0, 10) || '',
            prioridade: item.prioridade,
            tipo: item.tipo || 'outro',
            cli_codigo: item.cli_codigo
        });
        setClientSearch(item.cli_nomred || '');
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/crm/followups/${id}`);
            toast.success('Follow-up removido');
            fetchFollowups();
        } catch (err) {
            toast.error('Erro ao remover follow-up');
        }
    };

    const openNewForm = () => {
        setForm({ titulo: '', descricao: '', data_prevista: '', prioridade: 'media', tipo: 'outro', cli_codigo: null });
        setClientSearch('');
        setEditingId(null);
        setShowForm(true);
    };

    return (
        <div className="p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <ListChecks className="text-emerald-600" size={24} />
                            </div>
                            Follow-ups
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Gerencie suas tarefas e pendências comerciais
                        </p>
                    </div>
                    <Button
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold h-11 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                        onClick={openNewForm}
                    >
                        <Plus size={18} className="mr-2" /> Novo Follow-up
                    </Button>
                </header>

                {/* Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TABS.map(tab => {
                        const count = tab.key === 'todos' ? counts.total_pendentes : counts[tab.key];
                        const isActive = activeTab === tab.key;
                        return (
                            <motion.button
                                key={tab.key}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveTab(tab.key)}
                                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                    isActive
                                        ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <tab.icon size={16} className={tab.color} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{tab.label}</span>
                                </div>
                                <span className={`text-2xl font-black ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                                    {parseInt(count) || 0}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Completed this month */}
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <Check size={14} className="text-emerald-500" />
                    <span>{parseInt(counts.concluidos_mes) || 0} concluídos nos últimos 30 dias</span>
                </div>

                {/* Quick Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        {editingId ? 'Editar Follow-up' : 'Novo Follow-up'}
                                    </h3>
                                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Título *</label>
                                        <input
                                            value={form.titulo}
                                            onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                                            placeholder="Ex: Ligar para confirmar pedido"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Data Prevista *</label>
                                        <input
                                            type="date"
                                            value={form.data_prevista}
                                            onChange={e => setForm(p => ({ ...p, data_prevista: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Cliente (opcional)</label>
                                        <input
                                            value={clientSearch}
                                            onChange={e => {
                                                setClientSearch(e.target.value);
                                                fetchClients(e.target.value);
                                            }}
                                            placeholder="Buscar cliente..."
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                                        />
                                        {clients.length > 0 && clientSearch.length >= 2 && (
                                            <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto w-80">
                                                {clients.map(c => (
                                                    <button
                                                        key={c.cli_codigo}
                                                        onClick={() => {
                                                            setForm(p => ({ ...p, cli_codigo: c.cli_codigo }));
                                                            setClientSearch(c.cli_nomred || c.cli_nome);
                                                            setClients([]);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 transition-colors"
                                                    >
                                                        <span className="font-bold text-slate-800">{c.cli_nomred || c.cli_nome}</span>
                                                        <span className="text-slate-400 ml-2 text-xs">{c.cli_cidade}/{c.cli_uf}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Tipo</label>
                                        <select
                                            value={form.tipo}
                                            onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 outline-none bg-white"
                                        >
                                            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Prioridade</label>
                                        <div className="flex gap-2">
                                            {PRIORIDADES.map(p => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setForm(prev => ({ ...prev, prioridade: p.value }))}
                                                    className={`flex-1 h-10 rounded-xl border text-xs font-bold transition-all ${
                                                        form.prioridade === p.value
                                                            ? p.color + ' ring-2 ring-offset-1 ring-emerald-200'
                                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Observação</label>
                                        <textarea
                                            value={form.descricao}
                                            onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                                            placeholder="Detalhes adicionais..."
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl">Cancelar</Button>
                                    <Button onClick={handleSave} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold shadow-md">
                                        <Check size={16} className="mr-1" /> {editingId ? 'Atualizar' : 'Criar'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : followups.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ListChecks size={28} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">
                                {activeTab === 'atrasados' ? 'Nenhum follow-up atrasado!' : 'Nenhum follow-up encontrado'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                                {activeTab === 'atrasados'
                                    ? 'Parabéns! Você está em dia com seus compromissos.'
                                    : 'Crie seu primeiro follow-up para organizar suas pendências.'}
                            </p>
                            {activeTab !== 'atrasados' && (
                                <Button onClick={openNewForm} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold">
                                    <Plus size={16} className="mr-2" /> Criar Follow-up
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {followups.map((item, index) => {
                                const TipoIcon = getTipoIcon(item.tipo);
                                const prioInfo = PRIORIDADES.find(p => p.value === item.prioridade) || PRIORIDADES[1];
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`group flex items-start gap-3 p-4 rounded-2xl border border-slate-200 border-l-4 transition-all hover:shadow-md ${getStatusColor(item.status, item.data_prevista?.substring(0, 10))}`}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => handleToggleComplete(item)}
                                            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                item.status === 'concluido'
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                                            }`}
                                        >
                                            {item.status === 'concluido' && <Check size={14} />}
                                        </button>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`text-sm font-bold ${item.status === 'concluido' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                    {item.titulo}
                                                </h4>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Badge variant="outline" className={`text-[9px] ${prioInfo.color} px-1.5 h-5 rounded-lg`}>
                                                        {prioInfo.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-1">
                                                {item.cli_nomred && (
                                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        <Building2 size={11} /> {item.cli_nomred}
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <TipoIcon size={11} /> {TIPOS.find(t => t.value === item.tipo)?.label || item.tipo}
                                                </span>
                                                <span className={`text-xs font-bold flex items-center gap-1 ${
                                                    item.status === 'concluido' ? 'text-emerald-500' :
                                                    getStatusColor(item.status, item.data_prevista?.substring(0, 10)).includes('red') ? 'text-red-500' :
                                                    getStatusColor(item.status, item.data_prevista?.substring(0, 10)).includes('amber') ? 'text-amber-600' :
                                                    'text-blue-500'
                                                }`}>
                                                    <Calendar size={11} /> {formatDate(item.data_prevista?.substring(0, 10))}
                                                </span>
                                            </div>

                                            {item.descricao && (
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.descricao}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepCrmFollowups;
