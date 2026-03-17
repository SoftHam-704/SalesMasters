import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, Plus, Search, Filter, Phone, MapPin, Mail,
    MessageSquare, FileText, Users, Calendar, Clock, ChevronDown,
    Loader2, Building2, ArrowRight, TrendingUp, X, Eye
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

const CANAIS_ICONS = {
    'Ligação telefônica': Phone,
    'Visita': MapPin,
    'E-mail': Mail,
    'Whatsapp/Skype': MessageSquare,
    'Reunião': Users,
    'Outros': FileText,
};

const RESULTADO_COLORS = {
    'Em aberto': 'bg-blue-100 text-blue-700 border-blue-200',
    'Agendado': 'bg-amber-100 text-amber-700 border-amber-200',
    'Realizado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Cancelado': 'bg-red-100 text-red-700 border-red-200',
    'Positivo': 'bg-green-100 text-green-700 border-green-200',
    'Negativo': 'bg-red-100 text-red-700 border-red-200',
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(d);
    itemDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

    if (diff === 0) return `Hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff === 1) return 'Ontem';
    if (diff <= 7) return `${diff} dias atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
};

import NovaInteracaoModal from '@/components/crm/NovaInteracaoModal';
import CrmHelpModal from '@/components/crm/CrmHelpModal';
import { HelpCircle } from 'lucide-react';

const RepCrmAtendimentos = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const ven_codigo = user.ven_codigo;

    const [interacoes, setInteracoes] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [canais, setCanais] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterCanal, setFilterCanal] = useState('');
    const [filterSeller, setFilterSeller] = useState(ven_codigo || '');
    const [filterPeriodo, setFilterPeriodo] = useState('30');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [isInteracaoOpen, setIsInteracaoOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [sellers, setSellers] = useState([]);

    const fetchLookups = useCallback(async () => {
        try {
            const [tiposRes, canaisRes, resultadosRes, sellersRes] = await Promise.all([
                axios.get('/crm/tipos'),
                axios.get('/crm/canais'),
                axios.get('/crm/resultados'),
                axios.get('/crm/vendedores')
            ]);
            if (tiposRes.data.success) setTipos(tiposRes.data.data);
            if (canaisRes.data.success) setCanais(canaisRes.data.data);
            if (resultadosRes.data.success) setResultados(resultadosRes.data.data);
            if (sellersRes.data.success) setSellers(sellersRes.data.data);
        } catch (err) {
            console.error('Erro ao carregar lookups CRM:', err);
        }
    }, []);

    const fetchInteracoes = useCallback(async () => {
        const vCode = filterSeller || ven_codigo;
        if (!vCode) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = { ven_codigo: vCode };

            if (filterPeriodo) {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(filterPeriodo));
                params.data_inicio = startDate.toISOString().substring(0, 10);
                params.data_fim = endDate.toISOString().substring(0, 10);
            }

            const res = await axios.get('/crm/interacoes', { params });
            if (res.data.success) {
                let data = res.data.data;

                if (filterTipo) data = data.filter(i => String(i.tipo_interacao_id) === filterTipo);
                if (filterCanal) data = data.filter(i => String(i.canal_id) === filterCanal);
                if (search) {
                    const s = search.toLowerCase();
                    data = data.filter(i =>
                        i.cli_nomred?.toLowerCase().includes(s) ||
                        i.descricao?.toLowerCase().includes(s) ||
                        i.tipo?.toLowerCase().includes(s)
                    );
                }

                setInteracoes(data);
            }
        } catch (err) {
            console.error('Erro ao buscar interações:', err);
        } finally {
            setLoading(false);
        }
    }, [ven_codigo, filterPeriodo, filterTipo, filterCanal, search]);

    useEffect(() => { fetchLookups(); }, [fetchLookups]);
    useEffect(() => { fetchInteracoes(); }, [fetchInteracoes]);

    const stats = {
        total: interacoes.length,
        positivos: interacoes.filter(i => i.resultado === 'Positivo' || i.resultado === 'Realizado').length,
        emAberto: interacoes.filter(i => i.resultado === 'Em aberto' || i.resultado === 'Agendado').length,
    };

    return (
        <div className="p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <ClipboardCheck className="text-blue-600" size={24} />
                            </div>
                            Meus Atendimentos
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Histórico completo de interações comerciais
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm group"
                        >
                            <HelpCircle size={22} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <Button
                            className="rounded-xl bg-blue-500 hover:bg-blue-600 font-bold h-11 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                            onClick={() => setIsInteracaoOpen(true)}
                        >
                            <Plus size={18} className="mr-2" /> Nova Interação
                        </Button>
                    </div>
                </header>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Total período</div>
                        <div className="text-2xl font-black text-slate-800 mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">Positivos</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{stats.positivos}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">Em aberto</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">{stats.emAberto}</div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por cliente, tipo ou descrição..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                        />
                    </div>

                    <select
                        value={filterPeriodo}
                        onChange={e => setFilterPeriodo(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:border-blue-400 outline-none cursor-pointer"
                    >
                        <option value="7">7 dias</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                        <option value="60">60 dias</option>
                        <option value="90">90 dias</option>
                        <option value="">Todos</option>
                    </select>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-10 px-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors ${
                            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                    >
                        <Filter size={14} /> Filtros
                    </button>
                </div>

                {/* Extra Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex gap-3 bg-white rounded-2xl border border-slate-200 p-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Tipo</label>
                                    <select
                                        value={filterTipo}
                                        onChange={e => setFilterTipo(e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-400 outline-none"
                                    >
                                        <option value="">Todos</option>
                                        {tipos.map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Canal</label>
                                    <select
                                        value={filterCanal}
                                        onChange={e => setFilterCanal(e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-400 outline-none"
                                    >
                                        <option value="">Todos</option>
                                        {canais.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Vendedor</label>
                                    <select
                                        value={filterSeller}
                                        onChange={e => setFilterSeller(e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-400 outline-none"
                                    >
                                        <option value="">Todos</option>
                                        {sellers.map(s => <option key={s.ven_codigo} value={s.ven_codigo}>{s.ven_nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isInteracaoOpen && (
                        <NovaInteracaoModal
                            open={isInteracaoOpen}
                            onClose={() => setIsInteracaoOpen(false)}
                            onSuccess={() => {
                                fetchInteracoes();
                                setIsInteracaoOpen(false);
                            }}
                        />
                    )}
                </AnimatePresence>
                <CrmHelpModal open={showHelp} onOpenChange={setShowHelp} />

                {/* Interaction List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : interacoes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ClipboardCheck size={28} className="text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma interação encontrada</h3>
                            <p className="text-sm text-slate-500 mb-6">Ajuste os filtros ou registre uma nova interação</p>
                            <Button onClick={() => setShowNewForm(true)} className="rounded-xl bg-blue-500 hover:bg-blue-600 font-bold">
                                <Plus size={16} className="mr-2" /> Registrar Interação
                            </Button>
                        </motion.div>
                    ) : (
                        interacoes.map((item, index) => {
                            const CanalIcon = CANAIS_ICONS[item.canal] || FileText;
                            const resultadoColor = RESULTADO_COLORS[item.resultado] || 'bg-slate-100 text-slate-600';
                            return (
                                <motion.div
                                    key={item.interacao_id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => item.cli_codigo && navigate(`/repcrm/cliente/${item.cli_codigo}`)}
                                >
                                    {/* Channel Icon */}
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <CanalIcon size={18} className="text-blue-500" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">
                                                    {item.cli_nomred || 'Cliente'}
                                                </h4>
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {item.tipo}
                                                    {item.canal && <span> · {item.canal}</span>}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {item.resultado && (
                                                    <Badge variant="outline" className={`text-[9px] px-1.5 h-5 rounded-lg ${resultadoColor}`}>
                                                        {item.resultado}
                                                    </Badge>
                                                )}
                                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock size={11} /> {formatDateTime(item.data_interacao)}
                                                </span>
                                            </div>
                                        </div>

                                        {item.descricao && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>
                                        )}

                                        {item.industrias && item.industrias.length > 0 && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Building2 size={11} className="text-slate-400" />
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {item.industrias.length} indústria{item.industrias.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-3" />
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepCrmAtendimentos;
