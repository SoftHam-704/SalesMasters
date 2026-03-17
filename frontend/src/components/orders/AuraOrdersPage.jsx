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
    BarChart2, ArrowRight, Settings, Mail, RefreshCw, ArrowUpDown,
    LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IndustrySidebar from './IndustrySidebar';
import OrderList from './OrderList';
import StatCards from './StatCards';
import OrderDetail from './OrderDetail';
import OrderFormModal from '../order-form/OrderFormModal';
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
                                    {order.ped_cliind && (
                                        <div className="flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            {order.ped_cliind}
                                        </div>
                                    )}
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
                                                <div key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 font-bold">
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

export default function OrdersPage({ forceProjetos }) {
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
        dataInicio: formatDateInput(new Date(today.getFullYear(), 0, 1)),
        dataFim: formatDateInput(today)
    });
    const [sortBy, setSortBy] = useState('date-desc');

    const [selectedOrderObj, setSelectedOrderObj] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [stats, setStats] = useState({
        revenue: 0,
        quantity: 0,
        pdvs: 0,
        averageTicket: 0,
        orders: 0,
        quotes: 0
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [industries, setIndustries] = useState([]);

    useEffect(() => {
        const handlePortalImport = (e) => {
            const { portal, cliente, clienteNome, items, industriaId, tabela } = e.detail;
            console.log(`Recebido importação do ${portal} com ${items.length} itens para o cliente ${cliente} (${clienteNome})`);
            
            // Salvar no storage para o OrderForm ler ao abrir (Incluindo novos campos)
            sessionStorage.setItem('PORTAL_IMPORT_DATA', JSON.stringify({ 
                portal, 
                cliente, 
                clienteNome, 
                items, 
                industriaId, 
                tabela 
            }));
            
            // Força a criação de um pedido novo (existingOrder = null) para que o form leia o sessionStorage
            setSelectedOrderObj(null);
            setIsReadOnly(false);
            setOrderDialogOpen(true);
        };
        window.addEventListener('portalImportCompleted', handlePortalImport);
        return () => window.removeEventListener('portalImportCompleted', handlePortalImport);
    }, []);

    const [userParams, setUserParams] = useState(null);

    useEffect(() => {
        const loadIndustries = async () => {
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/orders/industries'));
                const data = await response.json();
                if (data.success) {
                    const mapped = data.data.map(i => ({
                        code: String(i.for_codigo),
                        name: i.for_nomered,
                        count: i.total_pedidos || 0,
                        icon: "building" // Default icon
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setIndustries(mapped);
                }
            } catch (error) {
                console.error('Error loading industries:', error);
            }
        };
        loadIndustries();
    }, []);

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
    }, [selectedIndustry, filters, sortBy]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: 700,
                situacao: filters.situacao,
                ...(selectedIndustry && selectedIndustry !== 'all' && {
                    industria: selectedIndustry
                }),
                ...(filters.cliente && { cliente: filters.cliente }),
                ...(filters.pesquisa && { pesquisa: filters.pesquisa }),
                ...(filters.dataInicio && { dataInicio: filters.dataInicio }),
                ...(filters.dataFim && { dataFim: filters.dataFim }),
                ignorarIndustria: filters.ignorarIndustria || selectedIndustry === 'all'
            });

            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders?${params}`));
            const data = await response.json();

            if (data.success) {
                let sortedOrders = [...data.pedidos];

                sortedOrders.sort((a, b) => {
                    switch (sortBy) {
                        case 'date-desc':
                            return new Date(b.ped_data) - new Date(a.ped_data) || (parseInt(b.ped_pedido) - parseInt(a.ped_pedido));
                        case 'date-asc':
                            return new Date(a.ped_data) - new Date(b.ped_data) || (parseInt(a.ped_pedido) - parseInt(b.ped_pedido));
                        case 'val-desc':
                            return (b.ped_totliq || 0) - (a.ped_totliq || 0);
                        case 'val-asc':
                            return (a.ped_totliq || 0) - (b.ped_totliq || 0);
                        case 'num-desc':
                            return (parseInt(b.ped_pedido) || 0) - (parseInt(a.ped_pedido) || 0);
                        case 'num-asc':
                            return (parseInt(a.ped_pedido) || 0) - (parseInt(b.ped_pedido) || 0);
                        case 'ref-asc':
                            return (a.ped_cliind || "").localeCompare(b.ped_cliind || "");
                        case 'ref-desc':
                            return (b.ped_cliind || "").localeCompare(a.ped_cliind || "");
                        case 'client-asc':
                            return (a.cli_nomred || "").localeCompare(b.cli_nomred || "");
                        default:
                            return new Date(b.ped_data) - new Date(a.ped_data);
                    }
                });

                setOrders(sortedOrders);
                console.log(`📊 [OrdersPage] Fetching stats with params: ${params.toString()}`);
                const statsResponse = await fetch(getApiUrl(NODE_API_URL, `/api/orders/stats?${params}&t=${Date.now()}`));
                const statsData = await statsResponse.json();
                if (statsData.success) {
                    console.log('📊 [OrdersPage] Stats received:', statsData.data);
                    const s = statsData.data;
                    setStats({
                        revenue: s.total_vendido || 0,
                        quantity: s.total_quantidade || 0,
                        pdvs: s.total_clientes || 0,
                        averageTicket: s.ticket_medio || 0,
                        orders: sortedOrders.filter(o => o.ped_situacao === 'P').length,
                        quotes: sortedOrders.filter(o => o.ped_situacao === 'C').length
                    });
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
            
            // Multi-tenant headers
            const tenantConfigRaw = sessionStorage.getItem('tenantConfig');
            const headers = {};
            if (tenantConfigRaw) {
                try {
                    const tenantConfig = JSON.parse(tenantConfigRaw);
                    if (tenantConfig.cnpj) headers['x-tenant-cnpj'] = tenantConfig.cnpj;
                    if (tenantConfig.dbConfig) headers['x-tenant-db-config'] = JSON.stringify(tenantConfig.dbConfig);
                } catch (e) { console.error('Error parsing tenantConfig', e); }
            }

            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/print-data?industria=${industryId}&sortBy=${sorting}`), {
                headers
            });
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

    // Convert backend orders to the format expected by OrderList and OrderDetail
    const mappedOrders = orders.map(o => ({
        id: o.ped_numero,
        orderNumber: o.ped_pedido,
        customer: o.cli_nomred,
        customerFull: o.cli_nome,
        date: formatDate(o.ped_data),
        total: o.ped_totliq,
        totalBruto: o.ped_totbruto,
        totalIpi: o.ped_totalipi,
        status: o.ped_situacao === "C" ? "COTAÇÃO PENDENTE" : 
                o.ped_situacao === "A" ? "COTAÇÃO CONFIRMADA" : 
                o.ped_situacao === "F" ? "FATURADO" : 
                o.ped_situacao === "E" ? "EXCLUÍDO" : "PEDIDO",
        statusType: o.ped_situacao === "C" ? "quote" : "order",
        payment: o.ped_condpag || "A Vista",
        industry: o.for_nomered || o.for_nome,
        industryId: o.ped_industria,
        reference: o.ped_cliind,
        details: o // Raw data for actions
    }));

    const currentOrder = mappedOrders.find(o => o.id === selectedOrder);

    return (
        <div className="flex h-screen bg-[#f5f5f5] relative overflow-hidden font-body">
            <IndustrySidebar
                industries={industries}
                selected={selectedIndustry}
                onSelect={setSelectedIndustry}
            />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}>
                <header className="px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-heading font-black text-foreground tracking-tight uppercase">
                                Painel de <span className="text-primary text-glow">Vendas</span>
                            </h1>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold py-0 ml-2 animate-pulse">AURA EVOLUTION</Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border shadow-sm">
                                <input
                                    type="date"
                                    value={filters.dataInicio}
                                    onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                                    className="bg-transparent border-0 outline-none text-[10px] font-bold uppercase text-foreground px-2"
                                />
                                <span className="text-muted-foreground/30 font-bold">-</span>
                                <input
                                    type="date"
                                    value={filters.dataFim}
                                    onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                                    className="bg-transparent border-0 outline-none text-[10px] font-bold uppercase text-foreground px-2"
                                />
                            </div>

                            <div className="relative group">
                                <div className="relative flex items-center bg-surface border border-border rounded-xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 shadow-sm">
                                    <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                                    <input
                                        placeholder="BUSCAR..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="bg-transparent border-0 outline-none p-0 text-foreground placeholder:text-muted-foreground/50 text-[10px] font-bold uppercase tracking-wider w-40"
                                    />
                                </div>
                            </div>

                            <Select value={filters.situacao} onValueChange={(value) => setFilters({ ...filters, situacao: value })}>
                                <SelectTrigger className="w-28 h-9 bg-surface border-border text-foreground text-[9px] font-bold uppercase tracking-widest rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Z" className="text-[9px] font-bold uppercase">Todos</SelectItem>
                                    <SelectItem value="P" className="text-[9px] font-bold uppercase">Pedido</SelectItem>
                                    <SelectItem value="F" className="text-[9px] font-bold uppercase">Faturado</SelectItem>
                                    <SelectItem value="C" className="text-[9px] font-bold uppercase">Cotação</SelectItem>
                                </SelectContent>
                            </Select>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSearch}
                                className="px-5 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 shadow-lg shadow-primary/20"
                            >
                                Filtrar
                            </motion.button>
                        </div>
                    </div>

                    <StatCards stats={stats} />
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* List Section */}
                    <div className="w-[420px] border-r border-border bg-background/50 flex flex-col flex-shrink-0">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
                             <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Listagem Geral</span>
                             </div>
                             <button 
                                onClick={handleNewOrder}
                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                             >
                                <Plus className="w-3.5 h-3.5" />
                             </button>
                        </div>
                        <ScrollArea className="flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-muted-foreground">CARREGANDO...</p>
                                </div>
                            ) : (
                                <OrderList
                                    orders={mappedOrders}
                                    filter="all"
                                    selectedId={selectedOrder}
                                    onSelect={(id) => setSelectedOrder(selectedOrder === id ? null : id)}
                                />
                            )}
                        </ScrollArea>
                    </div>

                    {/* Detail Section */}
                    <div className="flex-1 bg-surface/30">
                        {currentOrder ? (
                            <OrderDetail 
                                order={currentOrder}
                                onAction={(mode) => {
                                    if (mode === 'edit') {
                                        setSelectedOrderObj(currentOrder.details);
                                        setIsReadOnly(false);
                                        setOrderDialogOpen(true);
                                    } else if (mode === 'view') {
                                        setSelectedOrderObj(currentOrder.details);
                                        setIsReadOnly(true);
                                        setOrderDialogOpen(true);
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-30">
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                                    <LayoutGrid className="w-10 h-10" />
                                </div>
                                <p className="text-sm font-medium">Selecione um pedido para visualizar detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <OrderFormModal
                isOpen={orderDialogOpen}
                mode={isReadOnly ? "view" : selectedOrderObj ? "edit" : "new"}
                order={selectedOrderObj}
                selectedIndustry={industries.find(i => i.code === selectedIndustry)}
                onClose={() => {
                    setOrderDialogOpen(false);
                    setSelectedOrderObj(null);
                    loadOrders();
                }}
                onPortals={(orderId) => {
                    setSelectedPortalOrder(orderId);
                    setPortalsDialogOpen(true);
                }}
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
                        await exportOrderToExcel(data.data.order, data.data.items);
                        toast.success('Excel exportado!');
                        setPrintDialogOpen(false);
                    } catch (error) {
                        toast.error('Erro no Excel');
                    }
                }}
                onSendEmail={(sorting) => handleOpenEmailDialog(orderToPrint, orderToPrintIndustry, sorting)}
                onWhatsApp={async (model, sorting, encodedMessage) => {
                    const toastId = toast.loading('Gerando PDF para o WhatsApp...');
                    try {
                        const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderToPrint}/print-data?industria=${orderToPrintIndustry}&sortBy=${sorting}`));
                        const data = await response.json();
                        
                        if (data.success && data.data) {
                            const companyRes = await fetch(getApiUrl(NODE_API_URL, '/api/config/company'));
                            const companyResult = await companyRes.json();
                            
                            const { order, items } = data.data;
                            
                            // Sanitizer logic directly (similar to OrderReportEngine)
                            const cleanOrder = { ...order, industry_logotipo: null, for_logotipo: null, for_locimagem: null };
                            const cleanCompany = companyResult?.config ? { ...companyResult.config } : {};
                            if (cleanCompany.logotipo && cleanCompany.logotipo.length > 1000000) {
                                cleanCompany.logotipo = null; // limite de segurança para imagem base64
                            }
                            
                            const { pdf } = await import('@react-pdf/renderer');
                            const OrderPdfReport = (await import('./OrderPdfReport')).default;
                            
                            const blob = await pdf(<OrderPdfReport model={model} order={cleanOrder} items={items} companyData={cleanCompany} />).toBlob();
                            
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Pedido-${orderToPrint}.pdf`;
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                            
                            toast.success('PDF baixado! Arraste-o para a conversa no WhatsApp.', { id: toastId, duration: 5000 });
                            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                            setPrintDialogOpen(false);
                        } else {
                            throw new Error('Erro ao buscar dados do pedido');
                        }
                    } catch (error) {
                        toast.error('Erro ao gerar PDF: ' + error.message, { id: toastId });
                    }
                }}
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
