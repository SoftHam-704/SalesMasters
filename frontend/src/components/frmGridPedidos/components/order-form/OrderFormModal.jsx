import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, X, ArrowUpRight, Truck, User, MapPin,
  ShoppingCart, TrendingUp, Zap, Send, Save,
  BarChart3, CreditCard, Clock,
  Receipt, MessageSquare, Sparkles,
  LayoutDashboard, Boxes, DollarSign,
  Settings2, Plus, Search, Calendar,
  Star, CheckSquare, Percent, Hash,
  UserCheck, FileText, Tag, Pencil,
  MoreHorizontal
} from "lucide-react";

/* ── Mock data for inside the modal ── */
const mockItems = [
  { sku: "P10001", name: "Rolamento Cônico 32008", cat: "Rolamentos", qty: 12, price: 45.50, total: 546.00 },
  { sku: "P10002", name: "Retentor Dianteiro HD", cat: "Retentores", qty: 8, price: 28.90, total: 231.20 },
  { sku: "P10003", name: "Kit Embreagem Reforçada", cat: "Kits", qty: 3, price: 890.00, total: 2670.00 },
  { sku: "P10004", name: "Junta do Cabeçote Motor", cat: "Juntas", qty: 5, price: 320.00, total: 1600.00 },
  { sku: "P10005", name: "Correia Dentada Poly-V", cat: "Correias", qty: 15, price: 67.30, total: 1009.50 },
  { sku: "P10006", name: "Filtro de Óleo Premium", cat: "Filtros", qty: 20, price: 18.90, total: 378.00 },
];

/* ── Sidebar sections ── */
const sections = [
  { key: "principal", label: "Principal", shortcut: "F1", icon: LayoutDashboard },
  { key: "itens", label: "Itens", shortcut: "F3", icon: Boxes },
  { key: "financeiro", label: "Financeiro", shortcut: "F4", icon: DollarSign },
  { key: "entregas", label: "Entregas", shortcut: "F5", icon: Truck },
  { key: "faturas", label: "Faturas", shortcut: "F6", icon: Receipt },
  { key: "obs", label: "Observações", shortcut: "F7", icon: MessageSquare },
  { key: "config", label: "Config.", shortcut: "F8", icon: Settings2 },
];

const itemTabs = [
  { key: "itens", label: "Itens", icon: ShoppingCart },
  { key: "faturas", label: "Faturas", icon: Receipt },
  { key: "obs", label: "Observações", icon: MessageSquare },
  { key: "entregas", label: "Entregas", icon: Truck },
];

const fmt = (v) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Animated number ── */
const AnimNum = ({ value, className }) => (
  <motion.span
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {value}
  </motion.span>
);

/* ── Progress bar ── */
const ProgressBar = ({ percent, color }) => (
  <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percent}%` }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`h-full rounded-full ${color}`}
    />
  </div>
);

/* ── Searchable select card (empty/filled states) ── */
const SelectCard = ({ label, icon: Icon, value, subtitle, color, colorBg, colorBorder, isNew, extraInfo }) => {
  const isEmpty = isNew && !value;

  if (isEmpty) {
    return (
      <button className={`rounded-2xl border-2 border-dashed ${colorBorder} p-5 flex flex-col items-center justify-center gap-2 hover:${colorBg} transition-all group min-h-[140px]`}>
        <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Plus className={`w-5 h-5 ${color}`} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
        <span className="text-[9px] text-muted-foreground">Clique para selecionar</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-bento-card border border-border p-5 relative overflow-hidden hover:border-primary/20 transition-all">
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${color.includes("primary") ? "from-primary to-primary/20" : color.includes("info") ? "from-bento-info to-bento-info/20" : "from-bento-warning to-bento-warning/20"} rounded-r-full`} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${colorBg} flex items-center justify-center border ${colorBorder}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">{label}</span>
            <span className="font-heading font-bold text-sm text-foreground block mt-0.5">{value}</span>
          </div>
        </div>
        {isNew && (
          <button className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
        {!isNew && (
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
        )}
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground mb-2 truncate">{subtitle}</p>}
      {extraInfo && (
        <div className="space-y-1.5 pl-0.5">
          {extraInfo.map((info) => (
            <div key={info.label} className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground w-16 flex-shrink-0">{info.label}</span>
              <span className="font-mono font-medium text-foreground">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Inline editable field (label-style, pencil to edit) ── */
const InlineField = ({ label, value, disabled, mono, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  return (
    <div className="flex items-center justify-between group py-2 border-b border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest w-24 flex-shrink-0">{label}</span>
        {editing && !disabled ? (
          <input
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent text-xs text-foreground outline-none border-b border-primary/30 pb-0.5 transition-colors ${mono ? "font-mono" : "font-body"}`}
          />
        ) : (
          <span className={`text-xs flex-1 min-w-0 truncate ${localValue ? "text-foreground font-medium" : "text-muted-foreground/50 italic"} ${mono ? "font-mono" : "font-body"}`}>
            {localValue || placeholder || "—"}
          </span>
        )}
      </div>
      {!disabled && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-primary hover:bg-primary/10 transition-all"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const getStatusLabel = (situacao) => {
  switch (situacao) {
    case "P": return "PEDIDO";
    case "C": return "COTAÇÃO";
    case "F": return "FATURADO";
    case "E": return "EXCLUÍDO";
    default: return "COTAÇÃO PENDENTE";
  }
};

const OrderFormModal = ({ isOpen, mode, order, onClose }) => {
  const [activeSection, setActiveSection] = useState("principal");
  const [activeTab, setActiveTab] = useState("itens");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [discounts, setDiscounts] = useState(["40,00", "10,00", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00"]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      const match = sections.find((s) => s.shortcut === e.key);
      if (match) { e.preventDefault(); setActiveSection(match.key); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const isNew = mode === "new";
  const isDisabled = mode === "view";
  
  // Real mapping from API fields
  const orderCode = order?.ped_pedido || "#HS908061";
  const status = getStatusLabel(order?.ped_situacao);
  const isOrder = order?.ped_situacao === "P" || order?.ped_situacao === "F";
  const totalBruto = order?.ped_totliq || 6434.70;
  const totalItems = mockItems.reduce((s, i) => s + i.qty, 0); 
  const totalLiquido = totalBruto * 0.85;
  const clientName = order?.cli_nomred || "TRACTOR PARTS";
  const orderDate = order?.ped_data ? new Date(order.ped_data).toLocaleDateString("pt-BR") : "12/03/2026";

  const ease = [0.22, 1, 0.36, 1];
  const stagger = {
    container: { transition: { staggerChildren: 0.04 } },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
    },
  };

  /* ── Section content renderer ── */
  const renderContent = () => {
    if (activeSection === "principal") {
      return (
        <motion.div initial="initial" animate="animate" variants={stagger.container} className="p-7 pt-5 space-y-5">

          {/* ── HERO: Dados do Pedido ── */}
          <motion.div variants={stagger.item} className="rounded-2xl bg-gradient-to-br from-bento-card via-bento-card to-primary/[0.04] border border-border relative overflow-hidden shadow-sm">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/[0.03] blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-bento-info/[0.03] blur-2xl translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-primary/60 to-transparent rounded-r-full" />
            
            {/* Top row: icon + title + status badges */}
            <div className="relative flex items-center justify-between px-6 pt-5 pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] block">Dados do Pedido</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-heading font-bold text-lg text-foreground tracking-tight">{orderCode}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">· {orderDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${
                  isOrder
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-bento-warning/10 text-bento-warning border border-bento-warning/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOrder ? "bg-primary" : "bg-bento-warning"}`} />
                  {status}
                </div>
                <button className="h-8 px-3.5 rounded-full bg-bento-info/10 text-bento-info text-[10px] font-bold hover:bg-bento-info/15 transition-colors flex items-center gap-1.5 border border-bento-info/15">
                  <Clock className="w-3 h-3" /> Histórico
                </button>
                <button className="h-8 px-3.5 rounded-full bg-bento-purple/10 text-bento-purple text-[10px] font-bold hover:bg-bento-purple/15 transition-colors flex items-center gap-1.5 border border-bento-purple/15">
                  <Sparkles className="w-3 h-3" /> Sugestão
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 mt-4 mb-0 h-px bg-border/60" />

            {/* Fields grid */}
            <div className="relative grid grid-cols-3 gap-x-10 gap-y-0 px-6 py-4">
              <InlineField label="Pedido" value={orderCode} disabled mono />
              <InlineField label="Condições" value={isNew ? "" : (order?.ped_condpag || "20")} disabled={isDisabled} placeholder="Informe" />
              <InlineField label="Comprador" value={isNew ? "" : (order?.ped_comprador || "TESTE")} disabled={isDisabled} placeholder="Selecionar" />
              <InlineField label="Data" value={orderDate} disabled={isDisabled} mono />
              <InlineField label="Frete" value={isNew ? "" : (order?.tra_nome || "FOB")} disabled={isDisabled} placeholder="Selecionar" />
              <InlineField label="Ped. Cliente" value={order?.ped_cliind || ""} disabled={isDisabled} placeholder="Informar" />
              <InlineField label="Ped. Indústria" value="" disabled={isDisabled} placeholder="Informar" />
            </div>
          </motion.div>

          {/* ── Main 2-column layout ── */}
          <motion.div variants={stagger.item} className="flex gap-5">
            {/* LEFT: 3 entity cards (like original) + items table */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Entity cards grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Cliente */}
                <SelectCard
                  label="Cliente"
                  icon={User}
                  value={isNew ? undefined : clientName}
                  subtitle={isNew ? undefined : (order?.cli_nome || "3M Soluções Industriais Ltda")}
                  color="text-primary"
                  colorBg="bg-primary/10"
                  colorBorder="border-primary/20"
                  isNew={isNew}
                  extraInfo={isNew ? undefined : [
                    { label: "CNPJ", value: order?.cli_cnpj || "12.345.678/0001-99" },
                    { label: "Cidade", value: `${order?.cli_cidade || "São Paulo"}, ${order?.cli_uf || "SP"}` },
                  ]}
                />
                {/* Vendedor */}
                <SelectCard
                  label="Vendedor"
                  icon={UserCheck}
                  value={isNew ? undefined : (order?.ven_nome || "Sharon Roberts")}
                  subtitle={isNew ? undefined : "Equipe A · S041"}
                  color="text-bento-info"
                  colorBg="bg-bento-info/10"
                  colorBorder="border-bento-info/20"
                  isNew={isNew}
                  extraInfo={isNew ? undefined : [
                    { label: "Canal", value: order?.ped_codcanal || "LP L.P.U 182008" },
                    { label: "Comissão", value: "3.5%" },
                  ]}
                />
                {/* Transportadora */}
                <SelectCard
                  label="Transportadora"
                  icon={Truck}
                  value={isNew ? undefined : (order?.tra_nome || "3M SOLUCOES EM TRANSPORTES")}
                  subtitle={isNew ? undefined : "Transportadora principal"}
                  color="text-bento-warning"
                  colorBg="bg-bento-warning/10"
                  colorBorder="border-bento-warning/20"
                  isNew={isNew}
                  extraInfo={isNew ? undefined : [
                    { label: "Tipo", value: "Rodoviário" },
                    { label: "Prazo", value: "3-5 dias úteis" },
                  ]}
                />
              </div>

              {/* Items table */}
              <div className="rounded-2xl bg-bento-card border border-border overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 pt-4 pb-0">
                  <div className="flex items-center gap-1">
                    {itemTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.key;
                      return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-xl transition-all ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                          <Icon className="w-3 h-3" />
                          {tab.label}
                          {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                  {!isDisabled && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/15 transition-colors">
                      <Sparkles className="w-3 h-3" /> Adicionar Item
                    </button>
                  )}
                </div>
                <div className="h-px bg-border mx-5" />
                <div className="px-5 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          {["", "Produto", "Categoria", "Qtd", "Unitário", "Total"].map((h) => (
                            <th key={h} className="text-left py-3 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest first:pl-0 last:text-right">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mockItems.map((item, i) => (
                          <motion.tr key={item.sku} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} className={`group border-b border-border/30 transition-all cursor-default ${hoveredRow === i ? "bg-primary/[0.02]" : ""}`}>
                            <td className="py-3 px-2 first:pl-0 w-8"><div className={`w-1.5 h-8 rounded-full transition-all ${hoveredRow === i ? "bg-primary" : "bg-border"}`} /></td>
                            <td className="py-3 px-2"><span className="font-semibold text-foreground block leading-tight">{item.name}</span><span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span></td>
                            <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">{item.cat}</span></td>
                            <td className="py-3 px-2"><span className="font-mono font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{item.qty}</span></td>
                            <td className="py-3 px-2 font-mono tabular-nums text-muted-foreground">{fmt(item.price)}</td>
                            <td className="py-3 px-2 font-mono tabular-nums font-bold text-right text-foreground">{fmt(item.total)}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Tabela de Preço + Descontos + Financial */}
            <div className="w-[280px] flex-shrink-0 space-y-3">
              {/* Tabela de Preço */}
              <div className="rounded-2xl bg-bento-card border border-border p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-bento-purple to-bento-purple/20 rounded-r-full" />
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-bento-purple/10 flex items-center justify-center border border-bento-purple/20">
                    <Tag className="w-4 h-4 text-bento-purple" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Tabela de Preço</span>
                    <span className="font-heading font-bold text-sm text-foreground block mt-0.5">{order?.ped_tabela || "LP L.P.U 182008"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-primary font-medium">Preços atualizados</span>
                  <span className="text-[10px] font-mono font-bold text-bento-info">764 itens</span>
                </div>
              </div>

              {/* Descontos */}
              <div className="rounded-2xl bg-bento-card border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Descontos (%)</span>
                  </div>
                  <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {discounts.slice(0, 8).map((d, i) => (
                    <div key={i} className="text-center">
                      <span className="text-[8px] font-bold text-muted-foreground block mb-1">{i + 1}º</span>
                      <input
                        defaultValue={d}
                        readOnly={isDisabled}
                        className={`w-full h-7 text-center text-[10px] font-mono font-bold rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${
                          parseFloat(d.replace(",", ".")) > 0
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-background border-border text-foreground"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15 p-5 text-center relative overflow-hidden shadow-sm">
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Resumo</span>
                <AnimNum value={fmt(totalBruto)} className="font-heading font-bold text-2xl text-foreground tabular-nums block mt-1" />
              </div>

              {/* Final total */}
              <div className="rounded-2xl bg-primary text-primary-foreground p-4 text-center relative overflow-hidden shadow-lg shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <div className="relative">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 block">Total Final</span>
                  <AnimNum value={fmt(totalLiquido + 950)} className="font-heading font-bold text-xl tabular-nums block mt-1" />
                </div>
              </div>

              {/* Tornar Padrão */}
              <button className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Star className="w-3.5 h-3.5" /> TORNAR PADRÃO
              </button>

              <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bento-card border border-border cursor-pointer hover:border-primary/20 transition-all shadow-sm">
                <div
                  onClick={() => setAllowDuplicates(!allowDuplicates)}
                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    allowDuplicates ? "bg-primary border-primary" : "border-border bg-background"
                  }`}
                >
                  {allowDuplicates && <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <span className="text-[10px] font-semibold text-foreground">Permitir itens repetidos?</span>
              </label>
            </div>
          </motion.div>
        </motion.div>
      );
    }

    // Itens section (and default for others)
    return (
      <motion.div initial="initial" animate="animate" variants={stagger.container} className="p-7 pt-5 space-y-5">
        {/* Hero metrics */}
        <motion.div variants={stagger.item} className="grid grid-cols-4 gap-3">
          <div className="col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] border border-primary/10 p-5 shadow-sm">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-primary/5 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Valor Total</span>
              </div>
              <AnimNum value={fmt(totalBruto)} className="font-heading font-bold text-4xl text-foreground tabular-nums tracking-tight block" />
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                  <ArrowUpRight className="w-3 h-3" /> +18.2%
                </span>
                <span className="text-[10px] text-muted-foreground">vs. mês anterior</span>
              </div>
              <div className="flex items-end gap-[3px] h-10 mt-3 opacity-40">
                {[35, 55, 40, 70, 50, 85, 65, 90, 60, 75, 95, 70].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease }} className="w-1.5 rounded-t-sm bg-primary/50" />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-bento-card border border-border p-5 flex flex-col justify-between shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-bento-info/10 flex items-center justify-center mb-2">
              <ShoppingCart className="w-4 h-4 text-bento-info" />
            </div>
            <div>
              <AnimNum value={String(totalItems)} className="font-heading font-bold text-3xl text-foreground tabular-nums block" />
              <span className="text-[10px] text-muted-foreground font-medium">itens no pedido</span>
            </div>
            <ProgressBar percent={72} color="bg-bento-info" />
          </div>
          <div className="rounded-2xl bg-bento-card border border-border p-5 flex flex-col justify-between shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <AnimNum value={fmt(totalLiquido)} className="font-heading font-bold text-xl text-foreground tabular-nums block" />
              <span className="text-[10px] text-muted-foreground font-medium">valor líquido</span>
            </div>
            <ProgressBar percent={85} color="bg-primary" />
          </div>
        </motion.div>

        {/* Items table + Financial */}
        <motion.div variants={stagger.item} className="flex gap-4">
          <div className="flex-1 min-w-0 rounded-2xl bg-bento-card border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 pt-4 pb-0">
              <div className="flex items-center gap-1">
                {itemTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-xl transition-all ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      <Icon className="w-3 h-3" />
                      {tab.label}
                      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </div>
              {!isDisabled && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/15 transition-colors">
                  <Sparkles className="w-3 h-3" /> Adicionar Item
                </button>
              )}
            </div>
            <div className="h-px bg-border mx-5" />
            <div className="px-5 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {["", "Produto", "Categoria", "Qtd", "Unitário", "Total"].map((h) => (
                        <th key={h} className="text-left py-3 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest first:pl-0 last:text-right">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockItems.map((item, i) => (
                      <motion.tr key={item.sku} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} className={`group border-b border-border/30 transition-all cursor-default ${hoveredRow === i ? "bg-primary/[0.02]" : ""}`}>
                        <td className="py-3 px-2 first:pl-0 w-8"><div className={`w-1.5 h-8 rounded-full transition-all ${hoveredRow === i ? "bg-primary" : "bg-border"}`} /></td>
                        <td className="py-3 px-2"><span className="font-semibold text-foreground block leading-tight">{item.name}</span><span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span></td>
                        <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">{item.cat}</span></td>
                        <td className="py-3 px-2"><span className="font-mono font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{item.qty}</span></td>
                        <td className="py-3 px-2 font-mono tabular-nums text-muted-foreground">{fmt(item.price)}</td>
                        <td className="py-3 px-2 font-mono tabular-nums font-bold text-right text-foreground">{fmt(item.total)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <div className="w-[260px] flex-shrink-0 space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15 p-5 text-center relative overflow-hidden shadow-sm">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
              <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Resumo Financeiro</span>
              <AnimNum value={fmt(totalBruto)} className="font-heading font-bold text-3xl text-foreground tabular-nums block mt-2" />
              <span className="text-[10px] text-muted-foreground mt-1 block">valor bruto total</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Subtotal", value: fmt(totalBruto), color: "" },
                { label: "Descontos", value: "-15%", color: "text-destructive" },
                { label: "Impostos", value: fmt(totalBruto * 0.125), color: "" },
                { label: "Frete", value: fmt(950), color: "" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-bento-card border border-border p-3 text-center shadow-sm">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">{item.label}</span>
                  <span className={`text-[11px] font-bold tabular-nums block mt-1 ${item.color || "text-foreground"}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-primary text-primary-foreground p-5 text-center relative overflow-hidden shadow-lg shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <div className="relative">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 block">Total Final</span>
                <AnimNum value={fmt(totalLiquido + 950)} className="font-heading font-bold text-2xl tabular-nums block mt-1" />
                <div className="flex items-center justify-center gap-1 mt-2 opacity-70">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px] font-medium">Atualizado agora</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-foreground/30 backdrop-blur-md" onClick={onClose} />

        <motion.div
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.5 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[78%] bg-background sm:rounded-l-[32px] shadow-2xl border-l border-border overflow-hidden flex"
        >
          {/* ═══════════ LEFT SIDEBAR NAV ═══════════ */}
          <div className="w-[72px] flex-shrink-0 border-r border-border bg-secondary/30 flex flex-col items-center py-4 relative">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 mb-6"
            >
              <Package className="w-5 h-5 text-primary" />
            </motion.div>

            <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
              {sections.map((section, i) => {
                const Icon = section.icon;
                const isActive = activeSection === section.key;
                const isHovered = hoveredNav === section.key;
                return (
                  <motion.button
                    key={section.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03, duration: 0.3, ease }}
                    onClick={() => setActiveSection(section.key)}
                    onMouseEnter={() => setHoveredNav(section.key)}
                    onMouseLeave={() => setHoveredNav(null)}
                    className={`relative w-full flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl transition-all duration-200 group ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {isActive && (
                      <motion.div layoutId="nav-active-indicator" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                    )}
                    {(isActive || isHovered) && (
                      <motion.div layoutId="nav-hover-bg" className={`absolute inset-0 rounded-xl ${isActive ? "bg-primary/10" : "bg-secondary"}`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="text-[8px] font-bold uppercase tracking-wider relative z-10 leading-none">
                      {section.label.length > 8 ? section.label.slice(0, 6) + "." : section.label}
                    </span>
                    <AnimatePresence>
                      {isHovered && !isActive && (
                        <motion.div initial={{ opacity: 0, x: 4, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 4, scale: 0.9 }} className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-foreground text-background text-[9px] font-bold whitespace-nowrap z-50 shadow-xl pointer-events-none">
                          {section.label}
                          <span className="ml-1.5 opacity-60 font-mono">{section.shortcut}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-muted-foreground">F1</span>
              </div>
            </div>
          </div>

          {/* ═══════════ MAIN CONTENT ═══════════ */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-4 flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-bento-warning/[0.03]" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="relative flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading font-bold text-lg text-foreground tracking-tight">
                      {isNew ? "Novo Pedido de Venda" : "Pedido de Venda"}
                    </h2>
                    {!isNew && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border">
                        {orderCode}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNew ? "Preencha os dados do pedido" : `${clientName} · ${orderDate} · ${totalItems} itens`}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-1.5">
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-7 py-3.5 flex-shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary">{totalItems} itens</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{fmt(totalBruto)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  Fechar
                </button>
                {mode !== "view" && (
                  <>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </button>
                    <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                      <Send className="w-3.5 h-3.5" /> Enviar Pedido
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderFormModal;
