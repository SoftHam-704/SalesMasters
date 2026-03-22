import React, { useState, useCallback, useEffect, useRef } from "react";
import { Search, Calendar, SlidersHorizontal, Plus, Filter, Play, ArrowUpDown, ChevronDown, RefreshCw } from "lucide-react";
import IndustrySidebar from "./components/IndustrySidebar";
import StatCards from "./components/StatCards";
import OrderList from "./components/OrderList";
import OrderDetail from "./components/OrderDetail";
import OrderFormModal from "@/components/order-form/OrderFormModal";
import { NODE_API_URL, getApiUrl } from "../../utils/apiConfig";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const getIndustryVisuals = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("alimento") || n.includes("supermercado") || n.includes("mercado"))
    return { icon: "store", color: "#10b981" };
  if (n.includes("tecnologia") || n.includes("info") || n.includes("soft"))
    return { icon: "cpu", color: "#3b82f6" };
  if (n.includes("logistica") || n.includes("transp") || n.includes("rodov"))
    return { icon: "plane", color: "#6366f1" };
  if (n.includes("seguranca") || n.includes("monit"))
    return { icon: "shield", color: "#ef4444" };
  return { icon: "building", color: "#f59e0b" };
};

const FrmGridPedidos = () => {
  const [industriesList, setIndustriesList] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("new");

  // Filters state (matching production logic)
  const [filters, setFilters] = useState({
    situacao: "Z", // Z = Todos
    dataInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    ordenacao: "data_desc" // Padrão: Mais recentes primeiro
  });

  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statsData, setStatsData] = useState({
    total_vendido: 0,
    total_quantidade: 0,
    total_clientes: 0,
    ticket_medio: 0,
    count_pedidos: 0,
    count_cotacoes: 0
  });

  const loadIndustries = useCallback(async () => {
    try {
      setLoadingIndustries(true);
      const response = await fetch(getApiUrl(NODE_API_URL, "/api/orders/industries"));
      const data = await response.json();
      if (data.success && data.data) {
        const mapped = data.data.map((i) => ({
          code: i.for_codigo,
          name: i.for_nomered || i.for_nome,
          count: parseInt(i.total_pedidos) || 0,
          ...getIndustryVisuals(i.for_nomered || i.for_nome),
        })).sort((a, b) => a.name.localeCompare(b.name));
        setIndustriesList(mapped);
      }
    } catch (error) {
      console.error("Erro ao carregar indústrias:", error);
    } finally {
      setLoadingIndustries(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    // Standard: Don't auto-load "All" if no industry is selected
    if (selectedIndustry === null) {
      setOrdersList([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        limit: 700,
        situacao: filters.situacao,
        industria: selectedIndustry,
        ...(searchQuery && { pesquisa: searchQuery }),
        ...(filters.dataInicio && { dataInicio: filters.dataInicio }),
        ...(filters.dataFim && { dataFim: filters.dataFim }),
        ...(filters.ordenacao && { ordenacao: filters.ordenacao }),
      });

      const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders?${params}`));
      const data = await response.json();

      if (data.success && data.pedidos) {
        setOrdersList(data.pedidos);
        // Automatically select first order if none selected
        if (data.pedidos.length > 0 && !selectedOrderId) {
          setSelectedOrderId(data.pedidos[0].ped_numero);
        }
      } else {
        setOrdersList([]);
      }

      // Load Stats
      const statsResponse = await fetch(getApiUrl(NODE_API_URL, `/api/orders/stats?${params}`));
      const statsJson = await statsResponse.json();
      if (statsJson.success) {
        setStatsData({
          ...statsJson.data,
          count_pedidos: data.pedidos?.filter(o => o.ped_situacao === 'P').length || 0,
          count_cotacoes: data.pedidos?.filter(o => o.ped_situacao === 'C').length || 0
        });
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedIndustry, searchQuery, filters, selectedOrderId]);

  useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openForm = (mode) => {
    setFormMode(mode);
    setFormOpen(true);
  };

  const industryName =
    selectedIndustry === null
      ? "TODAS AS INDÚSTRIAS"
      : industriesList.find((i) => i.code === selectedIndustry)?.name ?? "";

  const filteredOrders = ordersList.filter((o) => {
    if (activeTab === "orders") return o.ped_situacao === "P";
    if (activeTab === "quotes") return o.ped_situacao === "C";
    return true;
  });

  const selectedOrder = ordersList.find((o) => o.ped_numero === selectedOrderId) ?? null;

  const tabs = [
    { key: "all", label: "Todos", count: ordersList.length },
    { key: "orders", label: "Pedidos", count: statsData.count_pedidos || 0 },
    { key: "quotes", label: "Cotações", count: statsData.count_cotacoes || 0 },
  ];

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = filteredOrders.findIndex((o) => o.ped_numero === selectedOrderId);
        const nextIndex =
          e.key === "ArrowDown"
            ? Math.min(currentIndex + 1, filteredOrders.length - 1)
            : Math.max(currentIndex - 1, 0);
        setSelectedOrderId(filteredOrders[nextIndex]?.ped_numero ?? null);
      }
    },
    [filteredOrders, selectedOrderId]
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans" onKeyDown={handleKeyDown} tabIndex={0}>
      <IndustrySidebar
        industries={industriesList}
        selected={selectedIndustry}
        onSelect={setSelectedIndustry}
        isLoading={loadingIndustries}
      />

      {/* Main content: list + detail split */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ROW 1: Title + Filter Bar (ABOVE) */}
        <header className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              <h1 className="font-heading font-semibold text-base text-foreground tracking-tight flex items-center gap-2 uppercase leading-none">
                Pedidos <span className="text-primary">de Vendas</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </h1>
              <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5 block leading-none">
                {industryName || "TODAS AS INDÚSTRIAS"}
              </span>
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Período — Date Inputs */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Período</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 px-3 bg-secondary/50 border-transparent hover:bg-secondary text-[11px] font-bold rounded-xl transition-all shadow-none flex items-center gap-2 min-w-[200px] justify-start",
                      !filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate font-mono">
                      {filters.dataInicio ? (
                        <>
                          {format(new Date(filters.dataInicio + "T00:00:00"), "dd/MM/yyyy")} — {format(new Date(filters.dataFim + "T00:00:00"), "dd/MM/yyyy")}
                        </>
                      ) : (
                        "Selecione o período"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    {/* Atalhos */}
                    <div className="flex flex-col border-r border-border bg-secondary/20 p-2 gap-1 w-36">
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest px-2 mb-1">Atalhos</span>
                      {[
                        { label: "Hoje", getValue: () => ({ from: new Date(), to: new Date() }) },
                        { label: "Ontem", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
                        { label: "Últimos 7 d", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
                        { label: "Últimos 30 d", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
                        { label: "Este Mês", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
                        { label: "Mês Passado", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
                        { label: "Este Ano", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
                      ].map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          className="justify-start text-[10px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            const range = preset.getValue();
                            setFilters(f => ({
                              ...f,
                              dataInicio: format(range.from, "yyyy-MM-dd"),
                              dataFim: format(range.to, "yyyy-MM-dd")
                            }));
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Manual date inputs + Calendar */}
                    <div className="p-3 space-y-3">
                      {/* Direct date input fields */}
                      <div className="flex items-center gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">De</span>
                          <input
                            type="date"
                            value={filters.dataInicio}
                            onChange={(e) => setFilters(f => ({ ...f, dataInicio: e.target.value }))}
                            className="h-8 px-2 text-[11px] font-mono font-bold bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                        </div>
                        <span className="text-muted-foreground mt-4">→</span>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Até</span>
                          <input
                            type="date"
                            value={filters.dataFim}
                            onChange={(e) => setFilters(f => ({ ...f, dataFim: e.target.value }))}
                            className="h-8 px-2 text-[11px] font-mono font-bold bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                        </div>
                      </div>

                      {/* Single-month Calendar for visual picking */}
                      <CalendarUI
                        mode="range"
                        defaultMonth={new Date(filters.dataInicio + "T00:00:00")}
                        selected={{
                          from: new Date(filters.dataInicio + "T00:00:00"),
                          to: new Date(filters.dataFim + "T00:00:00"),
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            setFilters(f => ({ 
                              ...f, 
                              dataInicio: format(range.from, "yyyy-MM-dd"),
                              dataFim: range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd")
                            }));
                          }
                        }}
                        numberOfMonths={1}
                        locale={ptBR}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="h-4 w-px bg-border/60" />

            {/* Situação */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Situação</span>
              <Select
                value={filters.situacao}
                onValueChange={(v) => setFilters(f => ({ ...f, situacao: v }))}
              >
                <SelectTrigger className="h-8 w-[150px] bg-secondary/50 border-transparent hover:bg-secondary text-[11px] font-bold rounded-xl transition-all shadow-none focus:ring-0">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Z" className="text-[11px]">Todos</SelectItem>
                  <SelectItem value="P" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0081e6]" />
                      Pedido
                    </div>
                  </SelectItem>
                  <SelectItem value="C" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#f71830]" />
                      Cotação pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="A" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1188c3]" />
                      Cotação confirmada
                    </div>
                  </SelectItem>
                  <SelectItem value="F" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#648041]" />
                      Faturado
                    </div>
                  </SelectItem>
                  <SelectItem value="G" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9160ed]" />
                      Garantia
                    </div>
                  </SelectItem>
                  <SelectItem value="B" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e7661d]" />
                      Bonificação
                    </div>
                  </SelectItem>
                  <SelectItem value="N" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ffc107]" />
                      Notificação
                    </div>
                  </SelectItem>
                  <SelectItem value="E" className="text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8b4513]" />
                      Excluído
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-px bg-border/60" />

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Ordenação</span>
              <Select
                value={filters.ordenacao}
                onValueChange={(v) => setFilters(f => ({ ...f, ordenacao: v }))}
              >
                <SelectTrigger className="h-8 w-[170px] bg-secondary/50 border-transparent hover:bg-secondary text-[11px] font-bold rounded-xl transition-all shadow-none focus:ring-0">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_desc" className="text-[11px]">Data (Mais novos)</SelectItem>
                  <SelectItem value="data_asc" className="text-[11px]">Data (Mais antigos)</SelectItem>
                  <SelectItem value="valor_desc" className="text-[11px]">Valor (Maior)</SelectItem>
                  <SelectItem value="valor_asc" className="text-[11px]">Valor (Menor)</SelectItem>
                  <SelectItem value="cliente_asc" className="text-[11px]">Cliente (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={loadOrders}
              variant="outline"
              className="h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${loadingOrders ? 'animate-spin' : ''}`} />
              Processar
            </Button>
            <button
              onClick={() => openForm("new")}
              className="h-8 px-4 bg-primary text-primary-foreground rounded-xl text-[11px] font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 shadow-sm shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              NOVO PEDIDO
            </button>
          </div>
        </header>

        {/* ROW 2: Inline Stats (BELOW) */}
        <div className="px-6 py-2 bg-surface border-b border-border flex items-center gap-2 flex-shrink-0">
          <StatCards stats={{
            revenue: statsData.total_vendido,
            quantity: statsData.total_quantidade,
            pdvs: statsData.total_clientes,
            averageTicket: statsData.ticket_medio,
            orders: statsData.count_pedidos,
            quotes: statsData.count_cotacoes
          }} />
        </div>

        {/* Split panel */}
        <div className="flex-1 flex min-h-0">
          {/* Left: order list */}
          <div className="w-[300px] lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col bg-surface overflow-hidden relative z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
            {/* Search + filters + tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar cliente ou pedido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-xs font-body bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>
                <button className="h-8 w-8 flex items-center justify-center bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <OrderList
                orders={filteredOrders}
                filter={activeTab}
                selectedId={selectedOrderId}
                onSelect={setSelectedOrderId}
                isLoading={loadingOrders}
              />
            </div>
          </div>

          {/* Right: detail panel */}
          <OrderDetail order={selectedOrder} onAction={openForm} />
        </div>
      </div>

      {/* Order Form Modal */}
      <OrderFormModal
        isOpen={formOpen}
        mode={formMode}
        order={selectedOrder}
        selectedIndustry={industriesList.find(i => i.code === selectedIndustry)}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
};

export default FrmGridPedidos;
