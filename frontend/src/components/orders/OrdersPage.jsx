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
    Receipt, FileCheck, Repeat, Building2, XCircle, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IndustryList from './IndustryList';
import OrderDialog from './OrderDialog';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { toast } from 'sonner';

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

    // Calcular data padrão: 1º dia do mês anterior até hoje
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const formatDateInput = (date) => date.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        cliente: null,
        ignorarIndustria: false,
        pesquisa: '',
        situacao: 'Z',
        dataInicio: formatDateInput(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())),
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

            const response = await fetch(`http://localhost:3005/api/orders?${params}`);
            const data = await response.json();

            if (data.success) {
                setOrders(data.pedidos);

                // Buscar estatísticas separadamente
                const statsResponse = await fetch(`http://localhost:3005/api/orders/stats?${params}`);
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

                            {/* Processar Button */}
                            <Button
                                onClick={loadOrders}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                                            <p className="text-2xl font-bold text-blue-700 dark:text-white mt-1">{qtdVendida}</p>
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
                                                                            <Button size="sm" variant="outline" className="bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600 border-emerald-200 dark:border-slate-600 shadow-sm">
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
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
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
                                            <ContextMenuItem className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Receipt className="h-4 w-4" />
                                                <span>Faturamentos</span>
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

                {/* Premium Floating Action Button - Crystal Orb */}
                <div className="absolute bottom-8 right-8">
                    {/* Orbital particles */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ width: 72, height: 72, margin: -12 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="relative w-full h-full"
                        >
                            {[0, 72, 144, 216, 288].map((angle, i) => (
                                <motion.div
                                    key={angle}
                                    className="absolute w-1.5 h-1.5 rounded-full"
                                    style={{
                                        left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 32}px - 3px)`,
                                        top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 32}px - 3px)`,
                                        background: `linear-gradient(135deg, hsl(${160 + i * 8} 80% 55%), hsl(${170 + i * 8} 70% 45%))`,
                                        boxShadow: `0 0 6px hsl(${160 + i * 8} 80% 55% / 0.6)`,
                                    }}
                                    animate={{
                                        scale: [1, 1.6, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 1.8,
                                        repeat: Infinity,
                                        delay: i * 0.25,
                                    }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Main button */}
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOrderFormOpen(true)}
                        className="relative group"
                    >
                        {/* Circle shape with glass effect */}
                        <div className="relative w-12 h-12">
                            {/* Background glow */}
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        "0 0 15px hsl(160 84% 39% / 0.4), 0 0 30px hsl(160 84% 39% / 0.2)",
                                        "0 0 25px hsl(160 84% 39% / 0.6), 0 0 50px hsl(160 84% 39% / 0.3)",
                                        "0 0 15px hsl(160 84% 39% / 0.4), 0 0 30px hsl(160 84% 39% / 0.2)",
                                    ],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: "linear-gradient(135deg, hsl(160 84% 35%) 0%, hsl(180 70% 28%) 50%, hsl(160 84% 35%) 100%)",
                                }}
                            />

                            {/* Crystal overlay */}
                            <div
                                className="absolute inset-0 rounded-full overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, hsl(160 84% 35%) 0%, hsl(180 70% 28%) 50%, hsl(160 84% 35%) 100%)",
                                }}
                            >
                                {/* Light refraction */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
                            </div>

                            {/* Inner border */}
                            <div
                                className="absolute inset-[1.5px] rounded-full border border-white/25"
                                style={{
                                    background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
                                }}
                            />

                            {/* Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="relative"
                                >
                                    <FileText className="h-5 w-5 text-white drop-shadow-lg" strokeWidth={2} />
                                </motion.div>
                            </div>

                            {/* Hover ring */}
                            <motion.div
                                initial={{ scale: 1, opacity: 0 }}
                                whileHover={{ scale: 1.4, opacity: [0, 0.4, 0] }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                            />
                        </div>

                        {/* Tooltip */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-medium rounded-md whitespace-nowrap backdrop-blur-sm pointer-events-none"
                        >
                            Novo Pedido
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/90 dark:border-l-white/90" />
                        </motion.div>
                    </motion.button>
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
        </div >
    );
}
