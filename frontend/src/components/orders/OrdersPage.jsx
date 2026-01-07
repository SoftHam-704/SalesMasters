import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search, Plus, Edit, Trash2, Printer,
    Factory, TrendingUp, Package, DollarSign, Calendar,
    ChevronRight, Filter, X, Sparkles, FileText, Copy, Globe,
    Receipt, FileCheck, Repeat, Building2, XCircle, ShoppingCart,
    BarChart2, ArrowRight, Settings, Mail, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IndustryList from './IndustryList';
import OrderDialog from './OrderDialog';
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

export default function OrdersPage() {
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [orderToPrint, setOrderToPrint] = useState(null);
    const [orderToPrintIndustry, setOrderToPrintIndustry] = useState(null);
    const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
    const [orderToEmailData, setOrderToEmailData] = useState(null);
    const [showNarrative, setShowNarrative] = useState(false);
    const [narrative, setNarrative] = useState('');
    const [loadingNarrative, setLoadingNarrative] = useState(false);
    const [activeNarrativeTab, setActiveNarrativeTab] = useState('Performance');



    // Calcular data padrão: 1º dia do mês anterior até hoje
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const formatDateInput = (date) => date.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        cliente: null,
        ignorarIndustria: false,
        pesquisa: '',
        situacao: 'Z',
        dataInicio: formatDateInput(new Date(2025, 0, 1)), // 01/01/2025
        dataFim: formatDateInput(today)
    });
    const [selectedOrderObj, setSelectedOrderObj] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [stats, setStats] = useState({
        total_vendido: 0,
        total_quantidade: 0,
        total_clientes: 0,
        ticket_medio: 0
    });

    const [userParams, setUserParams] = useState(null);

    // Carregar parâmetros do usuário ao montar
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

    // Carregar pedidos quando indústria ou filtros mudarem
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
            console.log('📦 [OrdersPage] Fetching orders...', params.toString());
            const data = await response.json();
            console.log('📦 [OrdersPage] Response:', data);

            if (data.success) {
                let sortedOrders = [...data.pedidos];
                const sortType = userParams?.par_ordemped || 'D';

                if (sortType === 'N') {
                    // Ordenação Numérica Descrescente
                    sortedOrders.sort((a, b) => {
                        const valA = parseInt(a.ped_pedido) || 0;
                        const valB = parseInt(b.ped_pedido) || 0;
                        return valB - valA;
                    });
                } else {
                    // Ordenação por Data Descrescente (Padrão)
                    sortedOrders.sort((a, b) => {
                        const dateA = new Date(a.ped_data).getTime();
                        const dateB = new Date(b.ped_data).getTime();
                        if (dateB !== dateA) return dateB - dateA;
                        // Se data igual, desempata pelo número
                        return (parseInt(b.ped_pedido) || 0) - (parseInt(a.ped_pedido) || 0);
                    });
                }

                setOrders(sortedOrders);
                console.log('📦 [OrdersPage] Orders loaded and sorted:', sortedOrders.length);

                // Buscar estatísticas separadamente
                const statsResponse = await fetch(getApiUrl(NODE_API_URL, `/api/orders/stats?${params}`));
                const statsData = await statsResponse.json();
                if (statsData.success) {
                    setStats(statsData.data);
                }
            } else {
                console.error('Erro ao carregar pedidos:', data.message);
                setOrders([]);
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setFilters({ ...filters, pesquisa: searchTerm });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Pegar estatísticas do estado (calculadas no servidor)
    const {
        total_vendido: totalVendido,
        total_quantidade: qtdVendida,
        total_clientes: clientesAtendidos,
        ticket_medio: ticketMedio
    } = stats;

    const countPedidos = orders.filter(o => o.ped_situacao === 'P').length;
    const countCotacoes = orders.filter(o => o.ped_situacao === 'C').length;

    const handleNewOrder = () => {
        if (!selectedIndustry) {
            toast.error('Selecione uma indústria antes de criar um pedido');
            return;
        }
        setSelectedOrderObj(null); // Clear previous selection for new order
        setOrderDialogOpen(true);
    };

    const handleOrderCreated = (orderData) => {
        console.log('Pedido criado:', orderData);
        loadOrders(); // Recarregar lista de pedidos
    };

    const handleOpenEmailDialog = async (orderId, industryId, sorting) => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/print-data?industria=${industryId}&sortBy=${sorting}`));
            const data = await response.json();

            if (data.success) {
                setOrderToEmailData(data.data);
                setSendEmailDialogOpen(true);
                setPrintDialogOpen(false); // Close print dialog if it was open
            } else {
                toast.error('Erro ao carregar dados do pedido para e-mail');
            }
        } catch (error) {
            console.error('Erro ao abrir diálogo de e-mail:', error);
            toast.error('Erro ao carregar dados do pedido');
        } finally {
            setLoading(false);
        }
    };

    // Save PDF to industry folder in the background (async, non-blocking)
    const savePdfInBackground = async (orderNumber, industryId, model, sorting) => {
        try {
            // Fetch order print data
            const printDataRes = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderNumber}/print-data?industria=${industryId}&sortBy=${sorting}`));
            const printData = await printDataRes.json();

            if (!printData.success || !printData.data) {
                console.warn('[PDF-SAVE] Failed to fetch order data');
                return;
            }

            const { order, items } = printData.data;

            // Generate simple PDF using jsPDF (same as email fallback)
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(`Pedido: ${order.ped_pedido}`, 10, 20);
            doc.setFontSize(10);
            doc.text(`Data: ${new Date(order.ped_data).toLocaleDateString('pt-BR')}`, 10, 30);
            doc.text(`Cliente: ${order.cli_nome}`, 10, 40);
            doc.text(`Indústria: ${order.for_nomered}`, 10, 50);

            let y = 70;
            doc.setFont("helvetica", "bold");
            doc.text("Qtd", 10, y);
            doc.text("Produto", 30, y);
            doc.text("V. Unit", 130, y);
            doc.text("Total", 170, y);
            doc.line(10, y + 2, 200, y + 2);

            doc.setFont("helvetica", "normal");
            items.forEach((item) => {
                y += 10;
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(String(item.ite_quant || 0), 10, y);
                doc.text(item.ite_nomeprod || 'Produto', 30, y, { maxWidth: 90 });
                doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ite_puniliq || 0), 130, y);
                doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ite_totliquido || 0), 170, y);
            });

            y += 15;
            doc.line(10, y - 5, 200, y - 5);
            doc.setFont("helvetica", "bold");
            doc.text(`TOTAL LÍQUIDO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.ped_totliq || 0)}`, 140, y);

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            // Send to backend to save
            const saveRes = await fetch(getApiUrl(NODE_API_URL, '/api/orders/save-pdf'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64,
                    orderNumber: order.ped_pedido,
                    clientName: order.cli_nomred || order.cli_nome,
                    industryName: order.for_nomered
                })
            });

            const saveResult = await saveRes.json();
            if (saveResult.success) {
                console.log('✅ [PDF-SAVE] PDF saved to:', saveResult.filePath);
            } else {
                console.warn('[PDF-SAVE] Failed:', saveResult.message);
            }
        } catch (error) {
            console.error('[PDF-SAVE] Error saving PDF:', error);
        }
    };


    return (
        <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Sidebar - Indústrias */}
            <IndustryList
                selectedIndustry={selectedIndustry}
                onSelectIndustry={setSelectedIndustry}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-b border-emerald-200/50 dark:border-white/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                                Pedidos
                            </h1>
                            {selectedIndustry && (
                                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {selectedIndustry.for_nomered}
                                </p>
                            )}
                        </div>

                        {/* Search & Filters */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar pedido ou cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-80 pl-10 bg-white dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Date Range Filter */}
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={filters.dataInicio || ''}
                                    onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                                    className="w-40 bg-white dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700"
                                    placeholder="Data Início"
                                />
                                <span className="text-muted-foreground">até</span>
                                <Input
                                    type="date"
                                    value={filters.dataFim || ''}
                                    onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                                    className="w-40 bg-white dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700"
                                    placeholder="Data Fim"
                                />
                            </div>

                            <Select value={filters.situacao} onValueChange={(value) => setFilters({ ...filters, situacao: value })}>
                                <SelectTrigger className="w-40 bg-white dark:bg-slate-800/50 border-emerald-200 dark:border-slate-700">
                                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Z">Todos</SelectItem>
                                    <SelectItem value="P">Pedidos</SelectItem>
                                    <SelectItem value="F">Faturados</SelectItem>
                                    <SelectItem value="C">Cotações</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Processar Button - Modern */}
                            <Button
                                onClick={loadOrders}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 whitespace-nowrap px-6 rounded-lg border-0"
                                disabled={loading}
                            >
                                {loading ? 'Processando...' : 'Processar'}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-6 gap-4">
                        <motion.div whileHover={{ scale: 1.02 }} className="relative overflow-hidden">
                            <Card className="bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">Total Vendido</p>
                                            <p className="text-2xl font-bold text-emerald-700 dark:text-white mt-1">{formatCurrency(totalVendido)}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                                            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Card className="bg-blue-500/10 dark:bg-blue-500/10 border-blue-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">Quantidade Vendida</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-white mt-1">{Math.round(qtdVendida).toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/20 rounded-xl">
                                            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Card className="bg-purple-500/10 dark:bg-purple-500/10 border-purple-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">Clientes Atendidos</p>
                                            <p className="text-2xl font-bold text-purple-700 dark:text-white mt-1">{clientesAtendidos}</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/20 rounded-xl">
                                            <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Card className="bg-slate-500/10 dark:bg-slate-500/10 border-slate-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Ticket Médio (Cli)</p>
                                            <p className="text-2xl font-bold text-slate-700 dark:text-white mt-1">
                                                {formatCurrency(ticketMedio)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-500/20 rounded-xl">
                                            <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Card className="bg-indigo-500/10 dark:bg-indigo-500/10 border-indigo-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">Qtd. Pedidos</p>
                                            <p className="text-2xl font-bold text-indigo-700 dark:text-white mt-1">{countPedidos}</p>
                                        </div>
                                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                                            <ShoppingCart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }}>
                            <Card className="bg-rose-500/10 dark:bg-rose-500/10 border-rose-500/30 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">Qtd. Cotações</p>
                                            <p className="text-2xl font-bold text-rose-700 dark:text-white mt-1">{countCotacoes}</p>
                                        </div>
                                        <div className="p-3 bg-rose-500/20 rounded-xl">
                                            <FileText className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Orders List */}
                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Carregando pedidos...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">Nenhum pedido encontrado. Selecione uma indústria ou use os filtros.</div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {orders.map((order, index) => (
                                    <ContextMenu key={order.ped_numero}>
                                        <ContextMenuTrigger>
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: index * 0.03 }}
                                                onClick={() => setSelectedOrder(selectedOrder === order.ped_numero ? null : order.ped_numero)}
                                                className={cn(
                                                    "group cursor-pointer",
                                                    selectedOrder === order.ped_numero && "z-10"
                                                )}
                                            >
                                                <Card className={cn(
                                                    "transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl",
                                                    order.ped_situacao === "C"
                                                        ? "bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40"
                                                        : order.ped_situacao === "F"
                                                            ? "bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-200/60 dark:border-teal-500/20 hover:border-teal-300 dark:hover:border-teal-500/40"
                                                            : "bg-white/80 dark:bg-slate-800/30 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-500/30",
                                                    selectedOrder === order.ped_numero && "ring-2 ring-teal-400 shadow-teal-500/20"
                                                )}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center gap-6">
                                                            {/* Order Number & Date */}
                                                            <div className="w-32">
                                                                <p className={cn(
                                                                    "font-mono font-bold text-base",
                                                                    order.ped_situacao === "C"
                                                                        ? "text-rose-600 dark:text-rose-400"
                                                                        : order.ped_situacao === "F"
                                                                            ? "text-teal-600 dark:text-teal-400"
                                                                            : "text-blue-600 dark:text-blue-400"
                                                                )}>
                                                                    {String(order.ped_pedido).padStart(4, '0')}
                                                                </p>
                                                                <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(order.ped_data)}
                                                                </div>
                                                            </div>

                                                            {/* Client Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-foreground truncate">{order.cli_nomred}</p>
                                                                <p className="text-sm text-muted-foreground truncate">{order.cli_nome}</p>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <Badge className={cn(
                                                                "px-3 py-1 font-semibold shadow-sm w-24 justify-center",
                                                                order.ped_situacao === "C"
                                                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0"
                                                                    : order.ped_situacao === "F"
                                                                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0"
                                                                        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                                                            )}>
                                                                {order.ped_situacao === "C" ? "Cotação" : order.ped_situacao === "F" ? "Faturado" : "Pedido"}
                                                            </Badge>

                                                            {/* Values */}
                                                            <div className="text-right w-36">
                                                                <p className="text-xs text-muted-foreground">Total Líquido</p>
                                                                <p className={cn(
                                                                    "font-bold",
                                                                    order.ped_situacao === "C"
                                                                        ? "text-rose-600 dark:text-rose-400"
                                                                        : "text-foreground"
                                                                )}>
                                                                    {formatCurrency(order.ped_totliq)}
                                                                </p>
                                                            </div>

                                                            <div className="text-right w-36">
                                                                <p className="text-xs text-muted-foreground">Faturado</p>
                                                                <p className={cn(
                                                                    "font-bold",
                                                                    order.ped_nffat ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"
                                                                )}>
                                                                    {order.ped_nffat ? formatCurrency(order.ped_totliq) : "—"}
                                                                </p>
                                                            </div>

                                                            {/* Payment & Table */}
                                                            <div className="w-52">
                                                                <Badge variant="outline" className="text-xs bg-white dark:bg-slate-700/50 border-emerald-200 dark:border-slate-600 text-foreground shadow-sm w-full justify-center">
                                                                    {order.ped_condpag || '—'}
                                                                </Badge>
                                                            </div>

                                                            <div className="w-32">
                                                                <Badge className="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-sm w-full justify-center">
                                                                    {order.ped_tabela || '—'}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Details */}
                                                        <AnimatePresence>
                                                            {selectedOrder === order.ped_numero && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-white/10 grid grid-cols-5 gap-4">
                                                                        <div className="bg-emerald-50 dark:bg-slate-800/50 rounded-lg p-3">
                                                                            <p className="text-xs text-muted-foreground mb-1">Total Bruto</p>
                                                                            <p className="font-semibold text-foreground">{formatCurrency(order.ped_totbruto)}</p>
                                                                        </div>
                                                                        <div className="bg-amber-50 dark:bg-slate-800/50 rounded-lg p-3">
                                                                            <p className="text-xs text-muted-foreground mb-1">Impostos</p>
                                                                            <p className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(order.ped_totalipi)}</p>
                                                                        </div>
                                                                        <div className="bg-blue-50 dark:bg-slate-800/50 rounded-lg p-3">
                                                                            <p className="text-xs text-muted-foreground mb-1">Indústria</p>
                                                                            <p className="font-semibold text-foreground">{order.for_nomered}</p>
                                                                        </div>
                                                                        <div className="bg-purple-50 dark:bg-slate-800/50 rounded-lg p-3">
                                                                            <p className="text-xs text-muted-foreground mb-1">Envio</p>
                                                                            <p className="font-semibold text-foreground">{formatDate(order.ped_dataenvio)}</p>
                                                                        </div>
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <Button size="sm" variant="outline" className="bg-white dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-50 border-emerald-200 dark:border-slate-600 shadow-sm" onClick={() => { setSelectedOrderObj(order); setOrderDialogOpen(true); }}>
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" className="bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600 border-emerald-200 dark:border-slate-600 shadow-sm" onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOrderToPrint(order.ped_pedido);
                                                                                setOrderToPrintIndustry(order.ped_industria);
                                                                                setPrintDialogOpen(true);
                                                                            }}>
                                                                                <Printer className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" className="bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/30 shadow-sm">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Discounts Row */}
                                                                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                                                                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Descontos:</span>
                                                                        {[
                                                                            order.ped_pri, order.ped_seg, order.ped_ter,
                                                                            order.ped_qua, order.ped_qui, order.ped_sex,
                                                                            order.ped_set, order.ped_oit, order.ped_nov
                                                                        ].map((desc, i) => (
                                                                            <Badge key={i} variant="secondary" className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                                                                {Number(desc || 0).toFixed(2)}%
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-64">
                                            <ContextMenuItem className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                                <Plus className="h-4 w-4" />
                                                <span>Novo</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Edit className="h-4 w-4" />
                                                <span>Modificar</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => {
                                                setOrderToPrint(order.ped_pedido);
                                                setOrderToPrintIndustry(order.ped_industria);
                                                setPrintDialogOpen(true);
                                            }} className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Printer className="h-4 w-4" />
                                                <span>Imprimir</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Globe className="h-4 w-4" />
                                                <span>Portais</span>
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="h-4 w-4" />
                                                <span>Deletar definitivamente</span>
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Copy className="h-4 w-4" />
                                                <span>Espelhar pedidos (clonar)</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => handleOpenEmailDialog(order.ped_pedido, order.ped_industria, 'digitacao')} className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <Mail className="h-4 w-4" />
                                                <span>Enviar por E-mail</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <FileCheck className="h-4 w-4" />
                                                <span>Cotação pendente p/ finalizada</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Repeat className="h-4 w-4" />
                                                <span>Gerar registro sincronização</span>
                                            </ContextMenuItem>
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Building2 className="h-4 w-4" />
                                                <span>Mudar de indústria</span>
                                            </ContextMenuItem>

                                            <ContextMenuSeparator />
                                            <ContextMenuItem className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                                                <XCircle className="h-4 w-4" />
                                                <span>Fechar</span>
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                {/* Bottom Premium Dashboard Area */}
                <div className="p-6 grid grid-cols-12 gap-4 bg-slate-100/30 backdrop-blur-md border-t border-slate-200 shrink-0 z-40">

                    {/* Left Panel: Insights Masters Card - EXPANDED */}
                    <div className="col-span-12 lg:col-span-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-200/50 dark:border-white/10 rounded-2xl shadow-xl shadow-emerald-500/10 overflow-hidden flex flex-col h-[220px]"
                        >
                            <div className="px-5 py-3 border-b border-emerald-100 dark:border-white/5 bg-emerald-500/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Inteligência Estratégica</span>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Insights Masters</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest">Live Analysis</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchNarrative(selectedIndustry)}
                                        className="h-7 w-7 p-0 rounded-full hover:bg-emerald-100 dark:hover:bg-white/5"
                                    >
                                        <RefreshCw className={cn("h-3.5 w-3.5 text-emerald-600", loadingNarrative && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-100/50">
                                {loadingNarrative ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-3 border-emerald-600/10 border-t-emerald-600 rounded-full animate-spin" />
                                            <Sparkles className="absolute inset-0 m-auto h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 animate-pulse">PROCESSANDO DADOS ANALÍTICOS</p>
                                            <p className="text-[9px] text-muted-foreground mt-1">Sincronizando com o cérebro digital Masters...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium italic">
                                            "{narrative || 'Selecione uma indústria para gerar insights estratégicos baseados no comportamento de pedidos.'}"
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Badge className="bg-slate-100 text-slate-600 border-0 hover:bg-slate-200 text-[10px]">#Faturamento-Positivo</Badge>
                                            <Badge className="bg-slate-100 text-slate-600 border-0 hover:bg-slate-200 text-[10px]">#Crescimento-Mensal</Badge>
                                            <Badge className="bg-slate-100 text-slate-600 border-0 hover:bg-slate-200 text-[10px]">#Sugestao-Mix</Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel: Compact FAB Button - REDUCED */}
                    <div className="col-span-12 lg:col-span-2 flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center cursor-pointer" onClick={handleNewOrder}>
                            {/* Button with orbitals wrapper */}
                            <div className="relative">
                                {/* Orbital particles - centered around button */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-24px] pointer-events-none"
                                >
                                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                        <div
                                            key={angle}
                                            className="absolute w-2 h-2 rounded-full bg-emerald-400"
                                            style={{
                                                left: '50%',
                                                top: '50%',
                                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(44px)`,
                                                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                                            }}
                                        />
                                    ))}
                                </motion.div>

                                {/* Main button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-white bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden z-10"
                                >
                                    <Plus className="h-6 w-6 text-white" />
                                    <span className="text-[6px] font-bold text-white/90 tracking-wide mt-0.5 uppercase">NOVO PEDIDO</span>
                                </motion.button>
                            </div>

                            {/* Label below */}
                            <div className="mt-3 text-center">
                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block">MASTERS</span>
                                <span className="text-[7px] text-slate-400 uppercase tracking-wide">Engine</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Dialog */}
                <OrderDialog
                    open={orderDialogOpen}
                    onOpenChange={(open) => {
                        setOrderDialogOpen(open);
                        if (!open) setSelectedOrderObj(null); // Clear on close
                    }}
                    selectedIndustry={selectedIndustry}
                    onOrderCreated={handleOrderCreated}
                    selectedOrder={selectedOrderObj}
                />

                <PrintOrderDialog
                    isOpen={printDialogOpen}
                    onClose={() => setPrintDialogOpen(false)}
                    orderNumber={orderToPrint}
                    defaultModel={userParams?.par_pedidopadrao || 1}
                    defaultSorting={userParams?.par_ordemimpressao === 'N' ? 'codigo' : 'digitacao'}
                    onPrint={(model, sorting) => {
                        console.log(`Printing order ${orderToPrint} with model ${model} and sorting ${sorting}`);
                        const url = `/print/order/${orderToPrint}?model=${model}&sortBy=${sorting}&industria=${orderToPrintIndustry}`;
                        // Store model and sort for email PDF generation
                        localStorage.setItem('printModel', String(model));
                        localStorage.setItem('printSortBy', sorting);

                        // Save PDF to industry folder in the background (non-blocking)
                        savePdfInBackground(orderToPrint, orderToPrintIndustry, model, sorting);

                        // Center window on screen (like poDesktopCenter in Delphi)
                        const width = 900;
                        const height = 700;
                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;
                        window.open(url, 'PrintPreview', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no`);
                        // Dialog stays open - user can try other formats or send email
                    }}
                    onExportExcel={async (sorting) => {
                        try {
                            // Fetch order data for Excel export
                            const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderToPrint}/print-data?industria=${orderToPrintIndustry}&sortBy=${sorting}`));
                            if (!response.ok) throw new Error('Failed to fetch order data');
                            const data = await response.json();

                            exportOrderToExcel(data.data.order, data.data.items);
                            toast.success('Excel exportado com sucesso!');
                            setPrintDialogOpen(false);
                        } catch (error) {
                            console.error('Error exporting to Excel:', error);
                            toast.error('Erro ao exportar para Excel');
                        }
                    }}
                    onSendEmail={(sorting) => handleOpenEmailDialog(orderToPrint, orderToPrintIndustry, sorting)}
                />

                <SendEmailDialog
                    isOpen={sendEmailDialogOpen}
                    onClose={() => setSendEmailDialogOpen(false)}
                    orderData={orderToEmailData}
                    onSend={async (data) => {
                        console.log('Sending email with data:', data);
                        // This will be connected to the real backend later
                        return new Promise(resolve => setTimeout(resolve, 2000));
                    }}
                />
            </div>
        </div>
    );
}
