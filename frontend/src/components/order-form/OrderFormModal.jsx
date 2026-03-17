import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, X, ArrowUpRight, Truck, User, MapPin,
  ShoppingCart, TrendingUp, Zap, Send, Save,
  BarChart3, CreditCard, Clock, ChevronDown,
  Receipt, MessageSquare, Sparkles,
  LayoutDashboard, Boxes, DollarSign,
  Settings2, Plus, Search, Calendar,
  Star, CheckSquare, Percent, Hash,
  UserCheck, FileText, Tag, Pencil,
  MoreHorizontal, Globe, Loader2,
  Wand2, ClipboardCheck, FileCheck2, FileSpreadsheet, FileCode2
} from "lucide-react";
import { useOrderForm } from "@/hooks/orders";

/* ── Sidebar sections (matches legacy OrderForm) ── */
const sections = [
  { key: "magicload", label: "Magic Load", shortcut: "F2", icon: Wand2 },
  { key: "itens", label: "Itens", shortcut: "F3", icon: ShoppingCart },
  { key: "faturas", label: "Faturas", shortcut: "F4", icon: Receipt },
  { key: "conferencia", label: "Conferência", shortcut: "F5", icon: ClipboardCheck },
  { key: "obs", label: "Obs.", shortcut: "F6", icon: MessageSquare },
  { key: "faturados", label: "Faturados", shortcut: "F7", icon: FileCheck2 },
  { key: "impxls", label: "Imp. XLS", shortcut: null, icon: FileSpreadsheet },
  { key: "xml", label: "XML", shortcut: null, icon: FileCode2 },
  { key: "arqtexto", label: "Arq. Texto", shortcut: null, icon: FileText },
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

/* ── Inline ComboBox — Aura style (transparent, search icon on hover) ── */
const InlineComboBox = ({ label, value, displayValue, fetchData, onSelect, disabled, placeholder, icon: FieldIcon }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !fetchData) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const data = await fetchData(search || "", 20); setItems(data || []); setHighlighted(-1); } catch { setItems([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, open, fetchData]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const handleSelect = (item) => { onSelect?.(item.value, item); setOpen(false); setSearch(""); };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(p => p < items.length - 1 ? p + 1 : 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(p => p > 0 ? p - 1 : items.length - 1); }
    else if (e.key === "Enter" && highlighted >= 0 && items[highlighted]) { e.preventDefault(); handleSelect(items[highlighted]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  return (
    <div ref={containerRef} className="relative group py-2.5 border-b border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => !disabled && setOpen(true)}>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] w-28 flex-shrink-0">{label}</span>
        <span className={`text-sm flex-1 min-w-0 truncate leading-relaxed font-body ${displayValue ? "text-foreground" : "text-muted-foreground/50 italic"}`}>
          {displayValue || placeholder || "Selecionar..."}
        </span>
        {!disabled && (
          <Search className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-primary transition-all flex-shrink-0" />
        )}
      </div>
      {open && (
        <div className="absolute left-28 top-full mt-1 w-80 z-50 bg-bento-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 font-body"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading && <div className="px-3 py-3 text-xs text-muted-foreground animate-pulse">Buscando...</div>}
            {!loading && items.length === 0 && <div className="px-3 py-3 text-xs text-muted-foreground italic">Nenhum resultado</div>}
            {items.map((item, i) => (
              <div key={item.value} onClick={() => handleSelect(item)} onMouseEnter={() => setHighlighted(i)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors font-body ${i === highlighted ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-foreground"}`}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Inline Select — Aura style dropdown ── */
const InlineSelect = ({ label, value, onChange, options, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative group py-2.5 border-b border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => !disabled && setOpen(!open)}>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] w-28 flex-shrink-0">{label}</span>
        <span className={`text-sm flex-1 leading-relaxed font-body ${selected ? "text-foreground" : "text-muted-foreground/50 italic"}`}>
          {selected?.label || placeholder || "Selecionar..."}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute left-28 top-full mt-1 w-56 z-50 bg-bento-card border border-border rounded-xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors font-body ${opt.value === value ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary/50 text-foreground"}`}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Inline editable field — Aura Body/Regular typography ── */
const InlineField = ({ label, value, onChange, disabled, mono, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setLocalValue(value); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (onChange && localValue !== value) onChange(localValue);
  };

  return (
    <div className="flex items-center justify-between group py-2.5 border-b border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] w-28 flex-shrink-0">{label}</span>
        {editing && !disabled ? (
          <input
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            placeholder={placeholder}
            className={`flex-1 bg-transparent text-sm text-foreground outline-none border-b border-primary/30 pb-0.5 transition-colors leading-relaxed ${mono ? "font-mono" : "font-body"}`}
          />
        ) : (
          <span className={`text-sm flex-1 min-w-0 truncate leading-relaxed ${localValue ? "text-foreground" : "text-muted-foreground/50 italic"} ${mono ? "font-mono" : "font-body"}`}>
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

const maskCnpjCpf = (value) => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length === 11) return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (cleanValue.length === 14) return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
};

const OrderFormModal = ({ isOpen, mode, order, onClose, onPortals, selectedIndustry }) => {
  const [activeSection, setActiveSection] = useState("principal");
  const [activeTab, setActiveTab] = useState("itens");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);

  // ── REAL DATA: useOrderForm hook ──
  const hook = useOrderForm({
    selectedIndustry,
    existingOrder: order,
    mode,
  });

  const {
    formData, handleFieldChange,
    displayNumber,
    summaryItems,
    allowDuplicates, setAllowDuplicates,
    selectedClientName, selectedTranspName, selectedSellerName,
    handleSave,
    handleClientSelect, handleCarrierSelect, handleSellerSelect, handlePriceTableSelect,
    fetchClients, fetchCarriers, fetchSellers, fetchPriceTables,
    loading, isSaving,
  } = hook;

  // Keyboard shortcuts
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

  // Real data mapping
  const orderCode = formData.ped_pedido || displayNumber;
  const status = getStatusLabel(formData.ped_situacao);
  const isOrder = formData.ped_situacao === "P" || formData.ped_situacao === "F";
  const totalBruto = formData.ped_totbruto || 0;
  const totalLiquido = formData.ped_totliq || 0;
  const totalItems = summaryItems.reduce((s, i) => s + (parseFloat(i.ite_quant) || 0), 0);
  const clientName = selectedClientName || order?.cli_nomred || "";
  const orderDate = formData.ped_data
    ? new Date(formData.ped_data + 'T12:00:00').toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  // Discounts array from formData
  const discountKeys = ['ped_pri', 'ped_seg', 'ped_ter', 'ped_qua', 'ped_qui', 'ped_sex', 'ped_set', 'ped_oit', 'ped_nov'];
  const discountValues = discountKeys.map(k => parseFloat(formData[k]) || 0);

  const ease = [0.22, 1, 0.36, 1];
  const stagger = {
    container: { transition: { staggerChildren: 0.04 } },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
    },
  };

  // Save handlers
  const onSaveClick = async () => {
    await handleSave({ silent: true });
  };

  const onSendClick = async () => {
    const result = await handleSave();
    if (result && onClose) onClose();
  };

  /* ── Section content renderer ── */
  const renderContent = () => {
    if (activeSection === "principal") {
      return (
        <motion.div initial="initial" animate="animate" variants={stagger.container} className="p-7 pt-5 space-y-5">

          {/* ── HERO STRIP: Glassmorphic Premium Header ── */}
          <motion.div 
            variants={stagger.item} 
            className="rounded-[2.5rem] bg-gradient-to-r from-background/40 to-background/5 border border-white/20 backdrop-blur-2xl relative shadow-[0_15px_45px_rgba(0,0,0,0.06)] overflow-visible"
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            <div className="relative flex items-center justify-between px-10 py-7">
              <div className="flex items-center gap-12 w-full">
                {/* Order Icon with breathing glow */}
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/40 transition-all duration-500 animate-pulse" />
                  <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center border border-white/20 shadow-lg relative z-10">
                    <FileText className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] pl-0.5 leading-none">Identificação única</span>
                  <div className="flex items-baseline gap-4 leading-none">
                    <span className="font-heading font-black text-4xl text-foreground tracking-tighter drop-shadow-sm select-none">
                      {orderCode}
                    </span>
                    <div className="h-6 w-px bg-border/40" />
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Emissão</span>
                      <span className="font-mono text-sm font-bold text-foreground/80 leading-none">{orderDate}</span>
                    </div>
                  </div>
                </div>

                <div className="h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent mx-2" />

                <div className="flex flex-col gap-2 flex-1 max-w-[300px]">
                  <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] pl-1">Status Operacional</span>
                  <div className="relative">
                    <InlineSelect
                      label=""
                      value={formData.ped_situacao || "P"}
                      onChange={(v) => handleFieldChange("ped_situacao", v)}
                      disabled={isDisabled}
                      options={[
                        { value: "P", label: "Pedido Ativo" },
                        { value: "C", label: "Cotação em Aberto" },
                        { value: "CC", label: "Cotação Confirmada" },
                        { value: "F", label: "Faturado / Encerrado" },
                        { value: "G", label: "Garantia" },
                        { value: "B", label: "Bonificação" },
                        { value: "X", label: "Cancelado" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <button className="h-11 px-5 rounded-2xl bg-secondary/80 text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all flex items-center gap-2 border border-border/50 shadow-sm group">
                    <Clock className="w-3.5 h-3.5 text-primary group-hover:rotate-[-45deg] transition-transform" /> Histórico
                  </button>
                  <button className="h-11 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)] group">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Sugestões AI
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── 4 CARDS: Cliente, Transportadora, Vendedor, Dados ── */}
          <motion.div variants={stagger.item} className="grid grid-cols-4 gap-4">

            {/* Card 1 — CLIENTE */}
            <div className="rounded-2xl bg-bento-card border border-border p-4 relative hover:border-primary/30 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] group/card">
              <div className="absolute top-5 left-0 w-1 h-10 bg-primary rounded-r-full shadow-[2px_0_12px_rgba(var(--primary-rgb),0.3)] group-hover/card:h-14 transition-all duration-300" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente</span>
              </div>
              <div className="space-y-1">
                <InlineComboBox label="Nome" displayValue={clientName} fetchData={fetchClients} onSelect={handleClientSelect} disabled={isDisabled} placeholder="Selecione o cliente..." />
                <InlineField label="CNPJ" value={formData.cli_cnpj ? maskCnpjCpf(formData.cli_cnpj) : (order?.cli_cnpj ? maskCnpjCpf(order.cli_cnpj) : "")} disabled mono />
                <div className="flex gap-2">
                  <div className="flex-[2]"><InlineField label="Cidade" value={formData.cli_cidade ? `${formData.cli_cidade}, ${formData.cli_uf || ""}` : (order?.cli_cidade ? `${order.cli_cidade}, ${order?.cli_uf || ""}` : "")} disabled /></div>
                  <div className="flex-[1]"><InlineField label="Grupo" value={formData.cli_grupo || order?.cli_grupo || ""} disabled /></div>
                </div>
              </div>
            </div>

            {/* Card 2 — TRANSPORTADORA */}
            <div className="rounded-2xl bg-bento-card border border-border p-4 relative hover:border-bento-warning/30 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] group/card">
              <div className="absolute top-5 left-0 w-1 h-10 bg-bento-warning rounded-r-full shadow-[2px_0_12px_rgba(var(--warning-rgb),0.3)] group-hover/card:h-14 transition-all duration-300" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-bento-warning/10 flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5 text-bento-warning" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transportadora</span>
              </div>
              <div className="space-y-1">
                <InlineComboBox label="Nome" displayValue={selectedTranspName || order?.tra_nome || ""} fetchData={fetchCarriers} onSelect={handleCarrierSelect} disabled={isDisabled} placeholder="Selecione..." />
                <InlineSelect label="Frete" value={formData.ped_tipofrete || "F"} onChange={(v) => handleFieldChange("ped_tipofrete", v)} disabled={isDisabled} options={[{ value: "C", label: "CIF" }, { value: "F", label: "FOB" }]} />
              </div>
            </div>

            {/* Card 3 — VENDEDOR */}
            <div className="rounded-2xl bg-bento-card border border-border p-4 relative hover:border-bento-info/30 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] group/card">
              <div className="absolute top-5 left-0 w-1 h-10 bg-bento-info rounded-r-full shadow-[2px_0_12px_rgba(var(--info-rgb),0.3)] group-hover/card:h-14 transition-all duration-300" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-bento-info/10 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-bento-info" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendedor</span>
              </div>
              <div className="space-y-1">
                <InlineComboBox label="Nome" displayValue={selectedSellerName || order?.ven_nome || ""} fetchData={fetchSellers} onSelect={handleSellerSelect} disabled={isDisabled} placeholder="Selecione..." />
                <InlineField label="Canal" value={formData.ped_codcanal || order?.ped_codcanal || ""} disabled />
                <InlineField label="Comissão" value={formData.ped_comissao ? `${formData.ped_comissao}%` : (order?.ped_comissao ? `${order.ped_comissao}%` : "")} disabled mono />
              </div>
            </div>

            {/* Card 4 — DADOS DO PEDIDO */}
            <div className="rounded-2xl bg-bento-card border border-border p-4 relative hover:border-bento-purple/30 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] group/card">
              <div className="absolute top-5 left-0 w-1 h-10 bg-bento-purple rounded-r-full shadow-[2px_0_12px_rgba(var(--purple-rgb),0.3)] group-hover/card:h-14 transition-all duration-300" />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-bento-purple/10 flex items-center justify-center">
                  <Settings2 className="w-3.5 h-3.5 text-bento-purple" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dados do Pedido</span>
              </div>
              <div className="space-y-1">
                <InlineField label="Pagamento" value={formData.ped_condpag || ""} onChange={(v) => handleFieldChange("ped_condpag", v)} disabled={isDisabled} placeholder="Condição..." />
                <InlineField label="Contato" value={formData.ped_comprador || ""} onChange={(v) => handleFieldChange("ped_comprador", v)} disabled={isDisabled} placeholder="Comprador..." />
                <div className="flex gap-2">
                  <div className="flex-1"><InlineField label="Ped. Cli." value={formData.ped_pedcli || ""} onChange={(v) => handleFieldChange("ped_pedcli", v)} disabled={isDisabled} /></div>
                  <div className="flex-1"><InlineField label="Ped. Ind." value={formData.ped_pedindu || ""} onChange={(v) => handleFieldChange("ped_pedindu", v)} disabled={isDisabled} /></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Main 2-column layout ── */}
          <motion.div variants={stagger.item} className="flex gap-4">
            {/* LEFT: items table */}
            <div className="flex-[3] min-w-0 space-y-4">

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
                        {summaryItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-muted-foreground/50 italic text-xs">
                              Nenhum item lançado. Pressione F3 para adicionar.
                            </td>
                          </tr>
                        ) : (
                          summaryItems.map((item, i) => (
                            <motion.tr key={item.ite_seq || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} className={`group border-b border-border/30 transition-all cursor-default ${hoveredRow === i ? "bg-primary/[0.02]" : ""}`}>
                              <td className="py-3 px-2 first:pl-0 w-8"><div className={`w-1.5 h-8 rounded-full transition-all ${hoveredRow === i ? "bg-primary" : "bg-border"}`} /></td>
                              <td className="py-3 px-2"><span className="font-semibold text-foreground block leading-tight">{item.ite_nomeprod || item.ite_produto}</span><span className="text-[10px] text-muted-foreground font-mono">{item.ite_produto}</span></td>
                              <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">{item.ite_grupo || "—"}</span></td>
                              <td className="py-3 px-2"><span className="font-mono font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{item.ite_quant}</span></td>
                              <td className="py-3 px-2 font-mono tabular-nums text-muted-foreground">{fmt(item.ite_puni)}</td>
                              <td className="py-3 px-2 font-mono tabular-nums font-bold text-right text-foreground">{fmt(item.ite_totliquido || item.ite_totbruto || 0)}</td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Tabela de Preço + Descontos + Financial */}
            <div className="flex-[2] min-w-[300px] space-y-4">
              {/* Tabela de Preço */}
              <div className="rounded-3xl bg-bento-card border border-border p-6 relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all group/tab">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-bento-purple to-bento-purple/10 rounded-r-full" />
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-[1rem] bg-bento-purple/10 flex items-center justify-center border border-bento-purple/20 group-hover/tab:scale-110 transition-transform">
                    <Tag className="w-5 h-5 text-bento-purple" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] block">Canal de Preços</span>
                    <InlineComboBox
                      label=""
                      displayValue={formData.ped_tabela || "Selecione uma tabela..."}
                      fetchData={fetchPriceTables}
                      onSelect={handlePriceTableSelect}
                      disabled={isDisabled}
                      placeholder="Buscar tabela..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{formData.ped_tabela ? "Ativa" : "Pendente"}</span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-foreground">{hook.priceTable?.memtable?.length || 0} itens disponíveis</span>
                </div>
              </div>

              {/* Descontos (Bigger and Clearer) */}
              <div className="rounded-3xl bg-bento-card border border-border p-6 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                    <Percent className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Descontos Progressivos</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {discountValues.slice(0, 9).map((d, i) => (
                    <div key={i}>
                      <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest block mb-1 ml-1">{i + 1}º</span>
                      <div className="relative">
                        <input
                          value={d > 0 ? d.toFixed(2).replace('.', ',') : ""}
                          readOnly={isDisabled}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                            handleFieldChange(discountKeys[i], val);
                          }}
                          placeholder="0,00"
                          className={`w-full h-10 text-center text-base font-mono font-black rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                            d > 0
                              ? "bg-primary/5 border-primary/30 text-primary shadow-[0_4px_12px_rgba(var(--primary-rgb),0.1)]"
                              : "bg-background border-border text-foreground hover:border-muted-foreground/30"
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40">%</span>
                      </div>
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
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 block">Total Líquido</span>
                  <AnimNum value={fmt(totalLiquido)} className="font-heading font-bold text-xl tabular-nums block mt-1" />
                </div>
              </div>

              {/* Tornar Padrão */}
              <button className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Star className="w-3.5 h-3.5" /> TORNAR PADRÃO
              </button>

              <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bento-card border border-border cursor-pointer hover:border-primary/20 transition-all shadow-sm">
                <div
                  onClick={() => !isDisabled && setAllowDuplicates(!allowDuplicates)}
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
              <AnimNum value={String(summaryItems.length)} className="font-heading font-bold text-3xl text-foreground tabular-nums block" />
              <span className="text-[10px] text-muted-foreground font-medium">itens no pedido</span>
            </div>
            <ProgressBar percent={Math.min(summaryItems.length * 5, 100)} color="bg-bento-info" />
          </div>
          <div className="rounded-2xl bg-bento-card border border-border p-5 flex flex-col justify-between shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <AnimNum value={fmt(totalLiquido)} className="font-heading font-bold text-xl text-foreground tabular-nums block" />
              <span className="text-[10px] text-muted-foreground font-medium">valor líquido</span>
            </div>
            <ProgressBar percent={totalBruto > 0 ? Math.round((totalLiquido / totalBruto) * 100) : 0} color="bg-primary" />
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
                      {active && <motion.div layoutId="tab-underline-2" className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </div>
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
                    {summaryItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground/50 italic text-xs">
                          Nenhum item lançado.
                        </td>
                      </tr>
                    ) : (
                      summaryItems.map((item, i) => (
                        <motion.tr key={item.ite_seq || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} className={`group border-b border-border/30 transition-all cursor-default ${hoveredRow === i ? "bg-primary/[0.02]" : ""}`}>
                          <td className="py-3 px-2 first:pl-0 w-8"><div className={`w-1.5 h-8 rounded-full transition-all ${hoveredRow === i ? "bg-primary" : "bg-border"}`} /></td>
                          <td className="py-3 px-2"><span className="font-semibold text-foreground block leading-tight">{item.ite_nomeprod || item.ite_produto}</span><span className="text-[10px] text-muted-foreground font-mono">{item.ite_produto}</span></td>
                          <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-semibold text-muted-foreground">{item.ite_grupo || "—"}</span></td>
                          <td className="py-3 px-2"><span className="font-mono font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{item.ite_quant}</span></td>
                          <td className="py-3 px-2 font-mono tabular-nums text-muted-foreground">{fmt(item.ite_puni)}</td>
                          <td className="py-3 px-2 font-mono tabular-nums font-bold text-right text-foreground">{fmt(item.ite_totliquido || item.ite_totbruto || 0)}</td>
                        </motion.tr>
                      ))
                    )}
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
                { label: "Descontos", value: totalBruto > 0 ? `-${(((totalBruto - totalLiquido) / totalBruto) * 100).toFixed(0)}%` : "0%", color: "text-destructive" },
                { label: "IPI", value: fmt(formData.ped_totalipi || 0), color: "" },
                { label: "Frete", value: "—", color: "" },
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
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 block">Total Líquido</span>
                <AnimNum value={fmt(totalLiquido)} className="font-heading font-bold text-2xl tabular-nums block mt-1" />
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
                    {(loading || isSaving) && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNew ? "Preencha os dados do pedido" : `${clientName} · ${orderDate} · ${summaryItems.length} itens`}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-1.5">
                {onPortals && (
                  <button
                    onClick={() => onPortals(formData.ped_pedido)}
                    className="w-9 h-9 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-all"
                    title="Portais"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                )}
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
                  <span className="text-[10px] font-bold text-primary">{summaryItems.length} itens</span>
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
                    <button
                      onClick={onSaveClick}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
                    </button>
                    <button
                      onClick={onSendClick}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
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
