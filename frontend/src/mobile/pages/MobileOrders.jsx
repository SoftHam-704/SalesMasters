import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Building2, Package,
    ChevronRight, ArrowLeft, Clock, DollarSign,
    CheckCircle2, XCircle, FileText, LayoutDashboard, ShieldCheck, Sparkles
} from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate, useLocation } from 'react-router-dom';

const MobileOrders = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Default filters: Last 3 months (as requested)
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const formatDateInput = (date) => date.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        dataInicio: formatDateInput(threeMonthsAgo),
        dataFim: formatDateInput(today),
        industria: 'all',
        situacao: 'Z'
    });

    const [industries, setIndustries] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Check if we came from Industries page with a specific filter
            const industryId = location.state?.industryId;
            let currentIndustria = filters.industria;

            if (industryId) {
                currentIndustria = industryId;
                setFilters(prev => ({ ...prev, industria: industryId }));
            }

            // Load industries for filter
            const indRes = await axios.get(getApiUrl(NODE_API_URL, '/api/orders/industries'));
            if (indRes.data.success) {
                setIndustries(indRes.data.industries);
            }

            // Call loadOrders with the industry from state if it exists
            loadOrders(industryId || filters.industria);
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            loadOrders();
        }
    };

    const loadOrders = async (forcedIndustria) => {
        setLoading(true);
        try {
            const indToUse = forcedIndustria !== undefined ? forcedIndustria : filters.industria;
            const params = {
                dataInicio: filters.dataInicio,
                dataFim: filters.dataFim,
                situacao: filters.situacao,
                limit: 100
            };
            if (indToUse !== 'all') {
                params.industria = indToUse;
            }

            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/orders'), { params });
            if (response.data.success) {
                setOrders(response.data.pedidos || []);
            }
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setShowFilters(false);
        loadOrders();
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'P': return { label: 'PEDIDO', color: 'bg-blue-50 text-[#0081e6] border-[#0081e6]/10', icon: Clock };
            case 'C': return { label: 'COTAÇÃO PENDENTE', color: 'bg-rose-50 text-[#f71830] border-[#f71830]/10', icon: FileText };
            case 'A': return { label: 'COTAÇÃO CONFIRMADA', color: 'bg-indigo-50 text-[#4f46e5] border-[#4f46e5]/10', icon: CheckCircle2 };
            case 'F': return { label: 'FATURADO', color: 'bg-emerald-50 text-[#648041] border-[#648041]/10', icon: CheckCircle2 };
            case 'E': return { label: 'EXCLUÍDO', color: 'bg-amber-50 text-[#8b4513] border-[#8b4513]/10', icon: XCircle };
            case 'G': return { label: 'GARANTIA', color: 'bg-purple-50 text-[#9160ed] border-[#9160ed]/10', icon: ShieldCheck };
            case 'B': return { label: 'BONIFICAÇÃO', color: 'bg-purple-50 text-[#9160ed] border-[#9160ed]/10', icon: Sparkles };
            default: return { label: 'Pedido', color: 'bg-blue-50 text-[#0081e6] border-[#0081e6]/10', icon: Clock };
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const filteredOrders = orders.filter(o =>
        (o.cli_nomred || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.ped_pedido || '').toString().includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header Sticky */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 p-4 pt-2">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Histórico</h1>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Pesquisar pedido ou cliente..."
                        className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Base...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Stats Bar */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Total</p>
                                    <p className="text-sm font-black text-slate-800">{filteredOrders.length} Itens</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Volume</p>
                                    <p className="text-sm font-black text-slate-800 truncate">
                                        {formatCurrency(filteredOrders.reduce((acc, curr) => acc + (curr.ped_totliq || 0), 0))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="bg-white rounded-[2rem] p-12 text-center space-y-4 border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                    <Package size={40} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Nenhum registro</h3>
                                    <p className="text-xs text-slate-400">Tente ajustar o filtro de datas ou indústria.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map(order => {
                                    const status = getStatusInfo(order.ped_situacao);
                                    return (
                                        <motion.div
                                            key={order.ped_pedido}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-5 active:scale-[0.98] transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">#{String(order.ped_pedido).padStart(4, '0')}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(order.ped_data).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                                                    <status.icon size={10} />
                                                    {status.label}
                                                </div>
                                            </div>

                                            <h3 className="font-black text-slate-800 text-sm uppercase leading-tight mb-4">{order.cli_nomred || order.cli_nome}</h3>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Building2 size={14} />
                                                    <span className="text-[9px] font-black uppercase truncate max-w-[120px]">{order.for_nomered}</span>
                                                </div>
                                                <p className="text-lg font-black italic text-slate-900">{formatCurrency(order.ped_totliq)}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Filter Drawer / Modal */}
            <AnimatePresence>
                {showFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50]"
                            onClick={() => setShowFilters(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[51] p-8 space-y-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Refinar Busca</h2>
                                <button onClick={() => setShowFilters(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                    <ChevronRight className="rotate-90" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Date Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Inicial</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4" />
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 rounded-2xl outline-none text-xs font-bold"
                                                value={filters.dataInicio}
                                                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Final</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4" />
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 rounded-2xl outline-none text-xs font-bold"
                                                value={filters.dataFim}
                                                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Industry Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Filtrar por Indústria</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4" />
                                        <select
                                            className="w-full bg-slate-50 border-none pl-12 pr-4 py-4 rounded-2xl outline-none text-xs font-bold appearance-none"
                                            value={filters.industria}
                                            onChange={(e) => setFilters({ ...filters, industria: e.target.value })}
                                        >
                                            <option value="all">TODAS AS INDÚSTRIAS</option>
                                            {industries.map(ind => (
                                                <option key={ind.for_codigo} value={ind.for_codigo}>
                                                    {ind.for_nomered || ind.for_razao}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Situação</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'Z', label: 'TODOS' },
                                            { id: 'P', label: 'PEDIDO' },
                                            { id: 'F', label: 'FATURADO' },
                                            { id: 'C', label: 'COTAÇÃO' }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setFilters({ ...filters, situacao: s.id })}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${filters.situacao === s.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleApplyFilters}
                                    className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black rounded-3xl shadow-xl shadow-blue-200 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] mt-4"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileOrders;
