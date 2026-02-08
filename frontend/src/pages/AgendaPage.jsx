// =====================================================
// 📅 SALESMASTER AGENDA PRO - Estilo Clean / Minimalista
// Design Focado em Clareza e Usabilidade
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    isToday, isPast, parseISO, addMonths, subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar, Clock, Plus, ChevronLeft, ChevronRight,
    CheckCircle2, AlertTriangle, Phone, MapPin, Users,
    FileText, RefreshCw, Cake, Bell, X, Trash2,
    List, Grid3X3, CalendarDays,
    Target, Zap, Search, CheckCheck, Filter
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

// Configurações de tipos e cores (Adaptado para Clean)
const TIPOS = {
    tarefa: { label: 'Tarefa', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    lembrete: { label: 'Lembrete', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    visita: { label: 'Visita', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    ligacao: { label: 'Ligação', icon: Phone, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    reuniao: { label: 'Reunião', icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    cobranca: { label: 'Cobrança', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    followup: { label: 'Follow-up', icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    aniversario: { label: 'Aniversário', icon: Cake, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' }
};

const PRIORIDADES = {
    A: { label: 'Alta', color: 'bg-rose-500', text: 'text-rose-700', bg_soft: 'bg-rose-50' },
    M: { label: 'Média', color: 'bg-amber-500', text: 'text-amber-700', bg_soft: 'bg-amber-50' },
    B: { label: 'Baixa', color: 'bg-emerald-500', text: 'text-emerald-700', bg_soft: 'bg-emerald-50' }
};

// Componente Card de Tarefa Clean
const TarefaCard = ({ tarefa, onEdit, onComplete, onDelete }) => {
    const tipo = TIPOS[tarefa.tipo] || TIPOS.tarefa;
    const Icon = tipo.icon;
    const atrasada = isPast(parseISO(tarefa.data_inicio)) && tarefa.status === 'pendente' && !isToday(parseISO(tarefa.data_inicio));
    const concluida = tarefa.status === 'concluida';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
            className={`
                group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border
                ${concluida
                    ? 'bg-slate-50 border-slate-100 opacity-60'
                    : atrasada
                        ? 'bg-white border-rose-200 shadow-sm border-l-4 border-l-rose-500'
                        : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300 border-l-4 border-l-transparent hover:border-l-emerald-500'
                }
            `}
            onClick={() => onEdit(tarefa)}
        >
            <div className="flex items-start gap-4">
                {/* Ícone do tipo */}
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tipo.bg} ${tipo.color}`}
                >
                    <Icon size={20} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 ml-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tipo.bg} ${tipo.color} border ${tipo.border}`}>
                            {tipo.label}
                        </span>
                        {atrasada && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                                <AlertTriangle size={10} />
                                Atrasada
                            </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${PRIORIDADES[tarefa.prioridade]?.bg_soft} ${PRIORIDADES[tarefa.prioridade]?.text}`}>
                            {PRIORIDADES[tarefa.prioridade]?.label}
                        </span>
                    </div>

                    <h4 className={`text-base ml-2 font-bold mb-1 truncate ${concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {tarefa.titulo}
                    </h4>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 ml-2">
                        {tarefa.hora_inicio && (
                            <span className="flex items-center gap-1.5 ">
                                <Clock size={14} className="text-slate-400" />
                                {tarefa.hora_inicio.substring(0, 5)}
                            </span>
                        )}
                        {tarefa.descricao && (
                            <span className="truncate max-w-[300px] text-slate-400 font-normal">
                                {tarefa.descricao}
                            </span>
                        )}
                    </div>
                </div>

                {/* Ações Hover */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!concluida && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(tarefa); }}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all"
                            title="Concluir"
                        >
                            <CheckCircle2 size={18} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(tarefa); }}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-110 transition-all"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Modal Clean
const TarefaModal = ({ isOpen, onClose, tarefa, onSave }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        tipo: 'tarefa',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        hora_inicio: '',
        prioridade: 'M',
        lembrete_ativo: true,
        lembrete_antes: 15
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const formatDate = (dateInput) => {
            if (!dateInput) return format(new Date(), 'yyyy-MM-dd');
            try {
                const dateObj = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
                return format(dateObj, 'yyyy-MM-dd');
            } catch (e) {
                return format(new Date(), 'yyyy-MM-dd');
            }
        };

        if (tarefa) {
            setFormData({
                titulo: tarefa.titulo || '',
                descricao: tarefa.descricao || '',
                tipo: tarefa.tipo || 'tarefa',
                data_inicio: formatDate(tarefa.data_inicio),
                hora_inicio: tarefa.hora_inicio?.substring(0, 5) || '',
                prioridade: tarefa.prioridade || 'M',
                lembrete_ativo: tarefa.lembrete_ativo !== false,
                lembrete_antes: tarefa.lembrete_antes || 15
            });
        } else {
            setFormData({
                titulo: '',
                descricao: '',
                tipo: 'tarefa',
                data_inicio: format(new Date(), 'yyyy-MM-dd'),
                hora_inicio: '',
                prioridade: 'M',
                lembrete_ativo: true,
                lembrete_antes: 15
            });
        }
    }, [tarefa, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo.trim()) return;

        setSaving(true);
        await onSave(formData, tarefa?.id);
        setSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Clean */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Calendar size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Preencha os detalhes abaixo</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Título */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título</label>
                            <input
                                type="text"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                placeholder="O que precisa ser feito?"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-medium"
                                autoFocus
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Atividade</label>
                            <div className="grid grid-cols-4 gap-3">
                                {Object.entries(TIPOS).map(([key, { label, icon: Icon, color, bg, border }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: key })}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.tipo === key
                                            ? `bg-emerald-50 border-emerald-500 shadow-md`
                                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <Icon size={22} className={formData.tipo === key ? 'text-emerald-600' : 'text-slate-500'} />
                                        <span className={`text-xs font-semibold tracking-tight ${formData.tipo === key ? 'text-emerald-700' : 'text-slate-600'}`}>
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data</label>
                                <input
                                    type="date"
                                    value={formData.data_inicio}
                                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora</label>
                                <input
                                    type="time"
                                    value={formData.hora_inicio}
                                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                                />
                            </div>
                        </div>

                        {/* Prioridade */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prioridade</label>
                            <div className="flex gap-2">
                                {Object.entries(PRIORIDADES).map(([key, { label, color, text }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, prioridade: key })}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${formData.prioridade === key
                                            ? `${color} text-white border-transparent shadow-md`
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
                            <textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Adicione detalhes importantes..."
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-medium"
                            />
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors uppercase tracking-wide text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!formData.titulo.trim() || saving}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 transition-all uppercase tracking-wide text-xs"
                            >
                                {saving ? 'Salvando...' : tarefa ? 'Salvar Alterações' : 'Criar Tarefa'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Página Principal Clean
const AgendaPage = () => {
    const [tarefas, setTarefas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visualizacao, setVisualizacao] = useState('lista');
    const [dataAtual, setDataAtual] = useState(new Date());
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [tarefaEditando, setTarefaEditando] = useState(null);
    const [stats, setStats] = useState({ hoje: 0, atrasadas: 0, concluidas: 0 });

    // Pegar usuário da sessão de forma segura
    const sessionUser = useMemo(() => {
        try {
            return JSON.parse(sessionStorage.getItem('user'));
        } catch (e) { return null; }
    }, []);

    const userId = sessionUser?.id || '1';
    const empresaId = sessionUser?.empresa_id || '1';

    useEffect(() => {
        fetchTarefas();
    }, [dataAtual, visualizacao]);

    const fetchTarefas = async () => {
        try {
            setLoading(true);
            let dataInicio, dataFim;
            if (visualizacao === 'dia') {
                dataInicio = dataFim = format(dataAtual, 'yyyy-MM-dd');
            } else if (visualizacao === 'semana') {
                dataInicio = format(startOfWeek(dataAtual, { locale: ptBR }), 'yyyy-MM-dd');
                dataFim = format(endOfWeek(dataAtual, { locale: ptBR }), 'yyyy-MM-dd');
            } else if (visualizacao === 'mes') {
                dataInicio = format(startOfMonth(dataAtual), 'yyyy-MM-dd');
                dataFim = format(endOfMonth(dataAtual), 'yyyy-MM-dd');
            } else {
                // Lista: Últimos 7 dias + Próximos 30 dias (Para garantir que vemos tarefas recentes e futuras)
                dataInicio = format(addDays(new Date(), -7), 'yyyy-MM-dd');
                dataFim = format(addDays(new Date(), 30), 'yyyy-MM-dd');
            }

            console.log('🔍 [AGENDA FETCH] Params:', { dataInicio, dataFim, visualizacao, userId });

            const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/agenda?${params}`), {
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            const data = await response.json();

            if (data.success) {
                setTarefas(data.data);
                const hoje = data.data.filter(t => isToday(parseISO(t.data_inicio)) && t.status !== 'concluida').length;
                const atrasadas = data.data.filter(t => isPast(parseISO(t.data_inicio)) && !isToday(parseISO(t.data_inicio)) && t.status === 'pendente').length;
                const concluidas = data.data.filter(t => t.status === 'concluida').length;
                setStats({ hoje, atrasadas, concluidas });
            }
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    const tarefasFiltradas = useMemo(() => {
        if (!busca) return tarefas;
        const termo = busca.toLowerCase();
        return tarefas.filter(t =>
            t.titulo.toLowerCase().includes(termo) ||
            t.descricao?.toLowerCase().includes(termo)
        );
    }, [tarefas, busca]);

    const tarefasPorData = useMemo(() => {
        const agrupado = {};
        tarefasFiltradas.forEach(tarefa => {
            const data = tarefa.data_inicio;
            if (!agrupado[data]) agrupado[data] = [];
            agrupado[data].push(tarefa);
        });
        Object.keys(agrupado).forEach(data => {
            agrupado[data].sort((a, b) => {
                if (!a.hora_inicio) return 1;
                if (!b.hora_inicio) return -1;
                return a.hora_inicio.localeCompare(b.hora_inicio);
            });
        });
        return agrupado;
    }, [tarefasFiltradas]);

    const handleNovaTarefa = () => {
        setTarefaEditando(null);
        setModalAberto(true);
    };

    const handleEditarTarefa = (tarefa) => {
        setTarefaEditando(tarefa);
        setModalAberto(true);
    };

    const handleSalvarTarefa = async (formData, tarefaId) => {
        try {
            const url = tarefaId ? getApiUrl(NODE_API_URL, `/api/agenda/${tarefaId}`) : getApiUrl(NODE_API_URL, '/api/agenda');
            await fetch(url, {
                method: tarefaId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                },
                body: JSON.stringify(formData)
            });
            fetchTarefas();
        } catch (error) { console.error('Erro ao salvar:', error); }
    };

    const handleConcluirTarefa = async (tarefa) => {
        try {
            await fetch(getApiUrl(NODE_API_URL, `/api/agenda/${tarefa.id}/status`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                },
                body: JSON.stringify({ status: 'concluida' })
            });
            fetchTarefas();
        } catch (error) { console.error('Erro ao concluir:', error); }
    };

    const handleExcluirTarefa = async (tarefa) => {
        if (!confirm('Excluir esta tarefa?')) return;
        try {
            await fetch(getApiUrl(NODE_API_URL, `/api/agenda/${tarefa.id}`), {
                method: 'DELETE',
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            fetchTarefas();
        } catch (error) { console.error('Erro ao excluir:', error); }
    };

    const navegarData = (direcao) => {
        if (visualizacao === 'dia') setDataAtual(prev => addDays(prev, direcao));
        else if (visualizacao === 'semana') setDataAtual(prev => addDays(prev, direcao * 7));
        else setDataAtual(prev => direcao > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <div className="max-w-7xl mx-auto p-6 md:p-8">
                {/* Header Clean */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                                <Calendar size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Minha Agenda</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">Organize seus compromissos com clareza.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleNovaTarefa}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all shadow-sm active:scale-95"
                            title="Criar um novo compromisso, tarefa ou lembrete na sua agenda"
                        >
                            <Plus size={20} />
                            Nova Tarefa
                        </button>
                    </div>
                </div>

                {/* KPI Cards Clean */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hoje</p>
                            <p className="text-3xl font-black text-slate-800">{stats.hoje}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Target size={24} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Atrasadas</p>
                            <p className="text-3xl font-black text-slate-800">{stats.atrasadas}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Concluídas</p>
                            <p className="text-3xl font-black text-slate-800">{stats.concluidas}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCheck size={24} />
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navegarData(-1)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Voltar um período (dia, semana ou mês)"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setDataAtual(new Date())}
                            className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide hover:bg-emerald-100 transition-colors"
                            title="Ir para a data de hoje"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => navegarData(1)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Avançar um período (dia, semana ou mês)"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <span className="text-sm font-bold text-slate-700 ml-2 capitalize">
                            {visualizacao === 'dia' && format(dataAtual, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            {visualizacao === 'semana' && `Semana de ${format(startOfWeek(dataAtual, { locale: ptBR }), 'd MMM', { locale: ptBR })}`}
                            {visualizacao === 'mes' && format(dataAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                            {visualizacao === 'lista' && 'Próximas Tarefas'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {[
                            { k: 'lista', i: List, t: 'Visualização em Lista (Próximos compromissos)' },
                            { k: 'dia', i: CalendarDays, t: 'Visualização Diária' },
                            { k: 'semana', i: Grid3X3, t: 'Visualização Semanal' },
                            { k: 'mes', i: Calendar, t: 'Visualização Mensal' }
                        ].map(v => (
                            <button
                                key={v.k}
                                onClick={() => setVisualizacao(v.k)}
                                className={`p-2 rounded-lg transition-all ${visualizacao === v.k ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title={v.t}
                            >
                                <v.i size={18} />
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar tarefas..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">Carregando...</p>
                        </div>
                    ) : tarefasFiltradas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <Calendar size={48} className="text-slate-300" />
                            </div>
                            <p className="text-base font-medium text-slate-600">Nenhuma tarefa encontrada</p>
                            <p className="text-sm mt-1">Sua agenda está livre neste período.</p>
                            <button onClick={handleNovaTarefa} className="mt-6 text-emerald-600 font-bold text-sm hover:underline">
                                + Criar nova tarefa
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-20">
                            {Object.entries(tarefasPorData).sort().map(([data, tarefasDoDia]) => (
                                <div key={data}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isToday(parseISO(data)) ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {isToday(parseISO(data)) ? 'Hoje' : format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </h3>
                                        <div className="h-px bg-slate-200 flex-1" />
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tarefasDoDia.length}</span>
                                    </div>
                                    <div className="grid gap-3">
                                        <AnimatePresence>
                                            {tarefasDoDia.map(tarefa => (
                                                <TarefaCard
                                                    key={tarefa.id}
                                                    tarefa={tarefa}
                                                    onEdit={handleEditarTarefa}
                                                    onComplete={handleConcluirTarefa}
                                                    onDelete={handleExcluirTarefa}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <TarefaModal
                isOpen={modalAberto}
                onClose={() => { setModalAberto(false); setTarefaEditando(null); }}
                tarefa={tarefaEditando}
                onSave={handleSalvarTarefa}
            />
        </div>
    );
};

export default AgendaPage;
