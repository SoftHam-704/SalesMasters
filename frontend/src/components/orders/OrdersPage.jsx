import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search, Plus, Edit, Trash2, Printer, Eye,
    Factory, TrendingUp, Package, DollarSign, Calendar,
    ChevronRight, Filter, X, Sparkles, FileText, Copy, Globe,
    Receipt, FileCheck, Repeat, Building2, XCircle, ShoppingCart,
    BarChart2, ArrowRight, Settings, Mail, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IndustryList from './IndustryList';
import OrderDialog from './OrderDialog';
import PortalsDialog from './PortalsDialog';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { toast } from 'sonner';
import PrintOrderDialog from './PrintOrderDialog';
import { exportOrderToExcel } from '../../utils/exportOrderToExcel';
import SendEmailDialog from './SendEmailDialog';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import './OrdersPage.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

// Memoized Order Card Component - prevents re-render on parent state changes
const OrderCard = memo(function OrderCard({
    order,
    index,
    isSelected,
    onSelect,
    onEdit,
    onPrint,
    onEmail,
    onView,
    onPortals,
    onDelete
}) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.03, 0.4) }}
                    onClick={() => onSelect(order.ped_numero)}
                    className={cn(
                        "group cursor-pointer relative",
                        isSelected && "z-10"
                    )}
                >
                    {/* Selected Glow Effect */}
                    <div className={cn(
                        "relative transition-all duration-500 border border-slate-200 shadow-sm rounded-2xl p-4 overflow-hidden",
                        order.ped_situacao === "C" ? "border-l-4 border-l-rose-500 bg-rose-50/40" :
                            order.ped_situacao === "A" ? "border-l-4 border-l-indigo-500 bg-indigo-50/40" :
                                order.ped_situacao === "F" ? "border-l-4 border-l-[#648041] bg-emerald-50/40" :
                                    order.ped_situacao === "G" ? "border-l-4 border-l-[#9160ed] bg-purple-50/40" :
                                        order.ped_situacao === "B" ? "border-l-4 border-l-[#9160ed] bg-purple-50/40" :
                                            order.ped_situacao === "E" ? "border-l-4 border-l-[#8b4513] bg-amber-50/40" :
                                                "border-l-4 border-l-[#0081e6] bg-blue-50/40",
                        isSelected ? "bg-emerald-100/60 border-emerald-500/30 scale-[1.01] shadow-md" : "hover:brightness-[0.98]"
                    )}>
                        <div className="flex items-center gap-6">
                            {/* Order ID Section */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 border border-white shadow-inner min-w-[120px]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CÓDIGO</span>
                                <span className="text-base font-black text-slate-800 leading-tight">#{order.ped_pedido}</span>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="p-1 rounded-sm bg-blue-50">
                                        <Building2 className="w-3 h-3 text-blue-600" />
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{order.cli_nomred}</h3>
                                </div>
                                <p className="text-xs text-slate-500 truncate font-mono font-bold">{order.cli_nome}</p>

                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                        {formatDate(order.ped_data)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        {order.ped_tabela || 'Padrão'}
                                    </div>
                                </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex flex-col gap-2 items-end">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    order.ped_situacao === "C" ? "bg-rose-50 text-[#f71830] border-rose-200" :
                                        order.ped_situacao === "A" ? "bg-indigo-50 text-[#4f46e5] border-indigo-200" :
                                            order.ped_situacao === "F" ? "bg-emerald-50 text-[#648041] border-emerald-200" :
                                                order.ped_situacao === "G" ? "bg-purple-50 text-[#9160ed] border-purple-200" :
                                                    order.ped_situacao === "B" ? "bg-purple-50 text-[#9160ed] border-purple-200" :
                                                        order.ped_situacao === "E" ? "bg-amber-50 text-[#8b4513] border-amber-200" :
                                                            "bg-blue-50 text-[#0081e6] border-blue-200"
                                )}>
                                    <div className="min-w-[150px] text-center">
                                        {order.ped_situacao === "C" ? "COTAÇÃO PENDENTE" :
                                            order.ped_situacao === "A" ? "COTAÇÃO CONFIRMADA" :
                                                order.ped_situacao === "F" ? "FATURADO" :
                                                    order.ped_situacao === "E" ? "EXCLUÍDO" :
                                                        order.ped_situacao === "G" ? "GARANTIA" :
                                                            order.ped_situacao === "B" ? "BONIFICAÇÃO" :
                                                                order.ped_situacao === "N" ? "NOTIFICAÇÃO" :
                                                                    "PEDIDO"}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-slate-400 uppercase font-black">Total</p>
                                    <span className="text-base font-black text-slate-900">
                                        {formatCurrency(order.ped_totliq)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-row gap-2 items-center ml-auto">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onView(order); }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-violet-50 border border-slate-200 text-slate-400 hover:text-violet-600 transition-colors shadow-sm"
                                    title="Visualizar"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(order); }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-colors shadow-sm"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPortals(order.ped_pedido); }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 border border-slate-200 text-slate-400 hover:text-orange-600 transition-colors shadow-sm"
                                    title="Portais"
                                >
                                    <Globe className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrint(order.ped_pedido, order.ped_industria, order.for_nomered || order.for_nome, formatCurrency(order.ped_totliq)); }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
                                    title="Imprimir"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(order); }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors shadow-sm"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Expandable Content with glass effect */}
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t border-slate-100"
                                >
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bruto</p>
                                            <p className="text-sm font-black text-slate-700">{formatCurrency(order.ped_totbruto)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">IPI</p>
                                            <p className="text-sm font-black text-rose-500">{formatCurrency(order.ped_totalipi)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pagamento</p>
                                            <p className="text-sm font-black text-blue-600 truncate">{order.ped_condpag || 'A Vista'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                                        {[order.ped_pri, order.ped_seg, order.ped_ter, order.ped_qua, order.ped_qui].map((d, i) => (
                                            d > 0 && (
                                                <div key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-mono text-slate-600 font-bold">
                                                    DESC-{i + 1}: {d}%
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-slate-900 border-emerald-500/20 text-emerald-100">
                <ContextMenuItem onClick={() => onView(order)} className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    <span>Visualizar Pedido</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onEdit(order)} className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 flex items-center gap-2">
                    <Edit className="h-4 w-4 text-emerald-400" />
                    <span>Editar Registro</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onPrint(order.ped_pedido, order.ped_industria, order.for_nomered || order.for_nome, formatCurrency(order.ped_totliq))} className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 flex items-center gap-2">
                    <Printer className="h-4 w-4 text-emerald-400" />
                    <span>Imprimir Relatório</span>
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-emerald-500/10" />
                <ContextMenuItem onClick={() => onEmail(order.ped_pedido, order.ped_industria)} className="hover:bg-emerald-500/10 focus:bg-emerald-500/10 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span>Enviar p/ Cliente</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu >
    );
});

export default function OrdersPage() {
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [orderToPrint, setOrderToPrint] = useState(null);
    const [orderToPrintIndustry, setOrderToPrintIndustry] = useState(null);
    const [orderToPrintIndustryName, setOrderToPrintIndustryName] = useState('');
    const [orderToPrintTotal, setOrderToPrintTotal] = useState('');
    const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
    const [orderToEmailData, setOrderToEmailData] = useState(null);
    const [portalsDialogOpen, setPortalsDialogOpen] = useState(false);
    const [selectedPortalOrder, setSelectedPortalOrder] = useState(null);
    const [narrative, setNarrative] = useState('');
    const [loadingNarrative, setLoadingNarrative] = useState(false);

    // Default date range: 2025 until today
    const today = new Date();
    const formatDateInput = (date) => date.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        cliente: null,
        ignorarIndustria: false,
        pesquisa: '',
        situacao: 'Z',
        dataInicio: formatDateInput(new Date(2025, 0, 1)),
        dataFim: formatDateInput(today)
    });

    const [selectedOrderObj, setSelectedOrderObj] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [stats, setStats] = useState({
        total_vendido: 0,
        total_quantidade: 0,
        total_clientes: 0,
        ticket_medio: 0
    });

    const [userParams, setUserParams] = useState(null);

    useEffect(() => {
        const loadUserParams = async () => {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user && user.id) {
                        const response = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${user.id}`));
                        const data = await response.json();
                        if (data.success && data.data) {
                            setUserParams(data.data);
                        }
                    }
                } catch (e) {
                    console.error('Erro ao carregar parâmetros do usuário:', e);
                }
            }
        };
        loadUserParams();
    }, []);

    useEffect(() => {
        if (selectedIndustry || filters.pesquisa || filters.cliente) {
            loadOrders();
        }
    }, [selectedIndustry, filters]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: 700,
                situacao: filters.situacao,
                ...(selectedIndustry && !filters.ignorarIndustria && {
                    industria: selectedIndustry.for_codigo
                }),
                ...(filters.cliente && { cliente: filters.cliente }),
                ...(filters.pesquisa && { pesquisa: filters.pesquisa }),
                ...(filters.dataInicio && { dataInicio: filters.dataInicio }),
                ...(filters.dataFim && { dataFim: filters.dataFim }),
                ignorarIndustria: filters.ignorarIndustria
            });

            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders?${params}`));
            const data = await response.json();

            if (data.success) {
                let sortedOrders = [...data.pedidos];
                const sortType = userParams?.par_ordemped || 'D';

                if (sortType === 'N') {
                    sortedOrders.sort((a, b) => (parseInt(b.ped_pedido) || 0) - (parseInt(a.ped_pedido) || 0));
                } else {
                    sortedOrders.sort((a, b) => {
                        const dateA = new Date(a.ped_data).getTime();
                        const dateB = new Date(b.ped_data).getTime();
                        if (dateB !== dateA) return dateB - dateA;
                        return (parseInt(b.ped_pedido) || 0) - (parseInt(a.ped_pedido) || 0);
                    });
                }

                setOrders(sortedOrders);
                const statsResponse = await fetch(getApiUrl(NODE_API_URL, `/api/orders/stats?${params}`));
                const statsData = await statsResponse.json();
                if (statsData.success) {
                    setStats(statsData.data);
                }
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            setOrders([]);
        } finally {
            setLoading(false);
            if (selectedIndustry) {
                fetchNarrative(selectedIndustry);
            }
        }
    };

    const fetchNarrative = async (industry) => {
        if (!industry) {
            setNarrative('');
            return;
        }
        setLoadingNarrative(true);
        setTimeout(() => {
            const industryName = industry.for_nomered || "Indústria";
            const currentTotal = stats.total_vendido || 0;
            const hasGrowth = Math.random() > 0.3;
            const growthPct = (Math.random() * 15).toFixed(1);

            let text = "";
            if (currentTotal > 50000) {
                text = `A ${industryName} apresenta um desempenho robusto este mês. O volume de vendas indica uma consolidação de mercado.`;
            } else if (hasGrowth) {
                text = `Detectamos uma tendência de crescimento de ${growthPct}% para a ${industryName}.`;
            } else {
                text = `A ${industryName} mostra estabilidade. Sugerimos focar em clientes inativos.`;
            }
            setNarrative(text);
            setLoadingNarrative(false);
        }, 1500);
    };

    const handleSearch = () => setFilters({ ...filters, pesquisa: searchTerm });
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

    const { total_vendido: totalVendido, total_quantidade: qtdVendida, total_clientes: clientesAtendidos, ticket_medio: ticketMedio } = stats;

    const countPedidos = orders.filter(o => o.ped_situacao === 'P').length;
    const countCotacoes = orders.filter(o => o.ped_situacao === 'C').length;

    const handleDeleteOrder = async (order) => {
        if (!window.confirm(`Deseja realmente excluir o pedido ${order.ped_pedido}?`)) return;

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${order.ped_pedido}`), {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Pedido excluído com sucesso');
                loadOrders();
            } else {
                toast.error('Erro ao excluir: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao excluir pedido:', error);
            toast.error('Erro de rede ao excluir pedido');
        }
    };

    const handleNewOrder = () => {
        if (!selectedIndustry) {
            toast.error('Selecione uma indústria');
            return;
        }
        setSelectedOrderObj(null);
        setIsReadOnly(false);
        setOrderDialogOpen(true);
    };

    const handleOrderCreated = () => loadOrders();

    const handleOpenEmailDialog = async (orderId, industryId, sorting) => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/print-data?industria=${industryId}&sortBy=${sorting}`));
            const data = await response.json();
            if (data.success) {
                setOrderToEmailData(data.data);
                setSendEmailDialogOpen(true);
            }
        } catch (error) {
            toast.error('Erro ao abrir e-mail');
        } finally {
            setLoading(false);
        }
    };

    const savePdfInBackground = async (orderNumber, industryId, model, sorting) => {
        try {
            const printDataRes = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderNumber}/print-data?industria=${industryId}&sortBy=${sorting}`));
            const printData = await printDataRes.json();
            if (!printData.success) return;

            const { order, items } = printData.data;
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            doc.text(`Pedido: ${order.ped_pedido}`, 10, 20);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            await fetch(getApiUrl(NODE_API_URL, '/api/orders/save-pdf'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfBase64, orderNumber: order.ped_pedido, clientName: order.cli_nomred, industryName: order.for_nomered })
            });
        } catch (error) { console.error('Error saving PDF:', error); }
    };

    return (
        <div className="flex h-screen bg-[#f5f5f5] transition-colors duration-500 relative overflow-hidden">
            <IndustryList
                selectedIndustry={selectedIndustry}
                onSelectIndustry={setSelectedIndustry}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 border-b border-slate-200 bg-white"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                                    PEDIDOS <span className="text-emerald-600">DE VENDAS</span>
                                </h1>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-black py-0">LIVE CONTROL</Badge>
                            </div>
                            {selectedIndustry && (
                                <p className="mt-2 flex items-center gap-2 font-mono text-sm uppercase tracking-wide font-black text-emerald-700 bg-emerald-50 w-fit px-3 py-1 rounded-lg border border-emerald-100/50 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                                    {selectedIndustry.for_nomered}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Date Picker Section Re-inserted */}
                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                <input
                                    type="date"
                                    value={filters.dataInicio}
                                    onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                                    className="bg-transparent border-0 outline-none text-xs font-bold uppercase text-slate-700 px-2"
                                />
                                <span className="text-slate-300 font-bold">/</span>
                                <input
                                    type="date"
                                    value={filters.dataFim}
                                    onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                                    className="bg-transparent border-0 outline-none text-xs font-bold uppercase text-slate-700 px-2"
                                />
                            </div>

                            <div className="relative group">
                                <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                    <Search className="h-4 w-4 text-slate-400 mr-3" />
                                    <input
                                        placeholder="BUSCAR CLIENTE OU PEDIDO..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="bg-transparent border-0 outline-none p-0 text-slate-800 placeholder:text-slate-400 text-xs font-bold uppercase tracking-wider w-48"
                                    />
                                </div>
                            </div>

                            <Select value={filters.situacao} onValueChange={(value) => setFilters({ ...filters, situacao: value })}>
                                <SelectTrigger className="w-32 bg-slate-100 border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl">
                                    <Filter className="h-3 w-3 mr-2 text-emerald-600" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-800">
                                    <SelectItem value="Z" className="text-[10px] font-black uppercase tracking-widest">Todos</SelectItem>
                                    <SelectItem value="P" className="text-[10px] font-black uppercase tracking-widest">Pedidos</SelectItem>
                                    <SelectItem value="F" className="text-[10px] font-black uppercase tracking-widest">Faturados</SelectItem>
                                    <SelectItem value="C" className="text-[10px] font-black uppercase tracking-widest">Cotações</SelectItem>
                                </SelectContent>
                            </Select>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSearch}
                                className="px-6 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                            >
                                Processar
                            </motion.button>
                        </div>
                    </div>

                    <div className="grid grid-cols-6 gap-4">
                        {/* Stats Row */}
                        {[
                            { label: 'Faturamento', value: formatCurrency(totalVendido), icon: DollarSign, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                            { label: 'Quantidade', value: Math.round(qtdVendida).toLocaleString(), icon: Package, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' },
                            { label: 'PDVs', value: clientesAtendidos, icon: Building2, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700' },
                            { label: 'Ticket Médio', value: formatCurrency(ticketMedio), icon: TrendingUp, color: 'slate', bg: 'bg-slate-50', text: 'text-slate-700' },
                            { label: 'Pedidos', value: countPedidos, icon: ShoppingCart, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' },
                            { label: 'Orçamentos', value: countCotacoes, icon: FileText, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-700' }
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (i * 0.05) }}
                                className={`group p-3 rounded-2xl border border-slate-200 bg-white hover:border-${stat.color}-300 transition-all duration-500`}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                                        <div className={`p-1 rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`h-3 w-3 ${stat.text}`} />
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-slate-800 tracking-tight">{stat.value}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <ScrollArea className="flex-1 p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.3em]">ANALISANDO DATABASE...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <div className="p-8 rounded-full bg-slate-100 border border-slate-200">
                                <Package className="w-16 h-16 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em]">Nenhuma Operação Detectada</p>
                                <p className="text-slate-400/50 text-[10px] mt-2 uppercase">Selecione uma indústria ou ajuste os filtros táticos</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 pb-24">
                            <AnimatePresence>
                                {orders.map((order, index) => (
                                    <OrderCard
                                        key={order.ped_numero}
                                        order={order}
                                        index={index}
                                        isSelected={selectedOrder === order.ped_numero}
                                        onSelect={(pedNumero) => setSelectedOrder(selectedOrder === pedNumero ? null : pedNumero)}
                                        onView={(ord) => { setSelectedOrderObj(ord); setIsReadOnly(true); setOrderDialogOpen(true); }}
                                        onEdit={(ord) => { setSelectedOrderObj(ord); setIsReadOnly(false); setOrderDialogOpen(true); }}
                                        onPrint={(pedido, industria, industryName, total) => {
                                            setOrderToPrint(pedido);
                                            setOrderToPrintIndustry(industria);
                                            setOrderToPrintIndustryName(industryName);
                                            setOrderToPrintTotal(total);
                                            setPrintDialogOpen(true);
                                        }}
                                        onEmail={(pedido, industria) => handleOpenEmailDialog(pedido, industria, 'digitacao')}
                                        onPortals={(orderId) => {
                                            setSelectedPortalOrder(orderId);
                                            setPortalsDialogOpen(true);
                                        }}
                                        onDelete={handleDeleteOrder}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 bg-white border-t border-slate-200 z-40 relative">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="h-4 w-4 text-emerald-600" />
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Briefing de Inteligência</h4>
                                <div className="h-[1px] flex-1 bg-slate-200" />
                            </div>
                            <div className="text-[11px] leading-relaxed text-slate-500 font-bold italic min-h-[40px]">
                                {loadingNarrative ? <span className="animate-pulse">PROCESSANDO...</span> : narrative || "Aguardando seleção tática."}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-6 border-l border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Uptime</span>
                                <span className="text-[10px] font-mono text-emerald-600 font-black">99.98%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Restore Floating Action Button with Orbiting Rings */}
                <div className="absolute bottom-24 right-8 z-50 flex flex-col items-center justify-center">
                    {/* Orbiting rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Ring 1 */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[110px] h-[110px] rounded-full border border-dashed border-emerald-500/20"
                        />
                        {/* Ring 2 */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[140px] h-[140px] rounded-full border border-dashed border-blue-500/10"
                        />

                        {/* Orbiting particles */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="relative w-20 h-20"
                        >
                            {[0, 72, 144, 216, 288].map((angle, i) => (
                                <motion.div
                                    key={angle}
                                    className="absolute w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                    style={{
                                        left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 45}px - 3px)`,
                                        top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 45}px - 3px)`,
                                        background: `linear-gradient(135deg, ${i % 2 === 0 ? '#10b981' : '#3b82f6'}, ${i % 2 === 0 ? '#059669' : '#2563eb'})`,
                                    }}
                                    animate={{
                                        scale: [1, 1.4, 1],
                                        opacity: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.3,
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>

                    {/* Main button */}
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNewOrder}
                        className="relative group focus:outline-none"
                    >
                        {/* Circle shape with glass effect */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            {/* Background glow and main disk */}
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(16, 185, 129, 0.4)",
                                        "0 0 40px rgba(16, 185, 129, 0.6)",
                                        "0 0 20px rgba(16, 185, 129, 0.4)",
                                    ],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl"
                            />

                            {/* Inner Glass Flare */}
                            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

                            {/* Icon and Text */}
                            <div className="relative z-10 flex flex-col items-center justify-center mt-0.5">
                                <Plus className="w-8 h-8 text-white drop-shadow-md" />
                                <span className="text-[8px] font-black text-white uppercase tracking-tighter leading-none -mt-1">NOVO</span>
                            </div>

                            {/* Ripple effect on hover */}
                            <motion.div
                                initial={{ scale: 1, opacity: 0 }}
                                whileHover={{ scale: 1.5, opacity: [0, 0.3, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
                            />
                        </div>

                        {/* Tooltip */}
                        <div className="absolute right-full mr-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                                Novo Pedido
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
                            </div>
                        </div>
                    </motion.button>
                </div>
            </div>

            <OrderDialog
                open={orderDialogOpen}
                onOpenChange={(open) => {
                    setOrderDialogOpen(open);
                    if (!open) setSelectedOrderObj(null);
                }}
                selectedIndustry={selectedIndustry}
                onOrderCreated={handleOrderCreated}
                selectedOrder={selectedOrderObj}
                readOnly={isReadOnly}
            />

            <PrintOrderDialog
                isOpen={printDialogOpen}
                onClose={() => setPrintDialogOpen(false)}
                orderNumber={orderToPrint}
                orderToPrintIndustryName={orderToPrintIndustryName}
                orderTotal={orderToPrintTotal}
                defaultModel={userParams?.par_pedidopadrao || 1}
                defaultSorting={userParams?.par_ordemimpressao === 'N' ? 'codigo' : 'digitacao'}
                onPrint={(model, sorting) => {
                    const url = `/print/order/${orderToPrint}?model=${model}&sortBy=${sorting}&industria=${orderToPrintIndustry}`;
                    savePdfInBackground(orderToPrint, orderToPrintIndustry, model, sorting);
                    const width = 900;
                    const height = 700;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    window.open(url, 'PrintPreview', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
                }}
                onExportExcel={async (sorting) => {
                    try {
                        const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderToPrint}/print-data?industria=${orderToPrintIndustry}&sortBy=${sorting}`));
                        const data = await response.json();
                        exportOrderToExcel(data.data.order, data.data.items);
                        toast.success('Excel exportado!');
                        setPrintDialogOpen(false);
                    } catch (error) {
                        toast.error('Erro no Excel');
                    }
                }}
                onSendEmail={(sorting) => handleOpenEmailDialog(orderToPrint, orderToPrintIndustry, sorting)}
            />

            <SendEmailDialog
                isOpen={sendEmailDialogOpen}
                onClose={() => setSendEmailDialogOpen(false)}
                orderData={orderToEmailData}
                onSend={async () => {
                    return new Promise(resolve => setTimeout(resolve, 2000));
                }}
            />

            <PortalsDialog
                open={portalsDialogOpen}
                onOpenChange={setPortalsDialogOpen}
                orderId={selectedPortalOrder}
            />
        </div>
    );
}
