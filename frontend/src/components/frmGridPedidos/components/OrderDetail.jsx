import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from "recharts";
import {
  Eye, FileEdit, Copy, Printer, Share2, ExternalLink,
  Hash, User, Truck, Package,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Calendar, CreditCard, MapPin, Building2, Check,
  TrendingUp
} from "lucide-react";

const formatCurrency = (value) =>
  (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Bento Card wrapper with Framer Motion ── */
const BentoCard = ({
  children,
  className = "",
  span = "1",
  delay = 0
}) => {
  const colSpan = 
    span === "full" ? "col-span-1 sm:col-span-2 lg:col-span-3" : 
    span === "2" ? "col-span-1 sm:col-span-2" : 
    "col-span-1";
    
  const transition = {
    type: "spring",
    stiffness: 100,
    damping: 15,
    delay: delay
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className={`bg-bento-card rounded-2xl border border-border/50 p-6 transition-all hover:shadow-xl hover:border-border/80 ${colSpan} ${className}`}
      style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,0.04)' }}
    >
      {children}
    </motion.div>
  );
};

/* ── Mini progress ring ── */
const ProgressRing = ({ percent, color }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="68" height="68" className="transform -rotate-90">
      <circle cx="34" cy="34" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
      <motion.circle
        cx="34" cy="34" r={r} fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
};

/* ── Quick action pill with tooltip ── */
const ActionPill = ({ icon: Icon, label, tooltip, onClick, variant = "default" }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (tooltip) {
      setIsClicked(true);
      setShowTooltip(true);
      setTimeout(() => {
        setIsClicked(false);
        setShowTooltip(false);
      }, 2000);
    }
  };

  const variants = {
    default: "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border-transparent",
    primary: "bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
    info: "bg-bento-info/5 text-bento-info hover:bg-bento-info/10 border-bento-info/10",
    warning: "bg-status-pending-bg text-status-pending-foreground hover:bg-status-pending-bg/80 border-status-pending/10",
    purple: "bg-bento-purple/5 text-bento-purple hover:bg-bento-purple/10 border-bento-purple/10",
  };

  return (
    <div className="relative group/pill">
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        onMouseEnter={() => !isClicked && tooltip && setShowTooltip(true)}
        onMouseLeave={() => !isClicked && setShowTooltip(false)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border transition-all ${variants[variant] || variants.default}`}
      >
        <motion.div
          whileHover={{ rotate: 15, scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className="w-3.5 h-3.5" />
        </motion.div>
        {label}
      </motion.button>
      
      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div 
            initial={{ opacity: 0, y: 5, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none flex items-center gap-1.5 border border-white/10"
          >
            {isClicked && <Check className="w-3 h-3 text-primary animate-in zoom-in" />}
            {tooltip || label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Inline stat ── */
const InlineStat = ({
  label,
  value,
  trend,
  icon: Icon,
  color = "text-foreground",
}) => (
  <div className="flex items-center gap-3 group/stat">
    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover/stat:bg-secondary/80 transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground group-hover/stat:text-primary transition-colors" />
    </div>
      <div className="flex-1 min-w-0">
      <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em] block mb-0.5">
        {label}
      </span>
      <span className={`text-sm font-semibold font-heading tracking-tight ${color} truncate block`}>{value}</span>
    </div>
    {trend && (
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend === "up" ? "text-primary" : "text-destructive"}`}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend === "up" ? "12%" : "3%"}
      </span>
    )}
  </div>
);

const getStatusLabel = (situacao) => {
  switch (situacao) {
    case "P": return "PEDIDO";
    case "C": return "COTAÇÃO";
    case "F": return "FATURADO";
    case "E": return "EXCLUÍDO";
    case "G": return "GARANTIA";
    case "B": return "BONIFICAÇÃO";
    case "N": return "NOTIFICAÇÃO";
    default: return "OUTROS";
  }
};

const OrderDetail = ({ order, onAction }) => {
  const [displayPrice, setDisplayPrice] = useState(0);

  React.useEffect(() => {
    if (order?.ped_totliq) {
      const target = order.ped_totliq;
      const start = displayPrice;
      const duration = 1000; // 1s
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * easeOut;
        
        setDisplayPrice(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayPrice(0);
    }
  }, [order?.ped_numero]);

  const chartData = [
    { name: "S", val: 40 },
    { name: "T", val: 65 },
    { name: "Q", val: 45 },
    { name: "Q", val: 80 },
    { name: "S", val: 55 },
    { name: "S", val: 95 },
    { name: "D", val: 70 },
  ];

  if (!order) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center bg-detail-bg"
      >
        <div className="text-center group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5 border border-border/50 group-hover:border-primary/20 transition-colors"
          >
            <Package className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-tight">
            Selecione um pedido para visualizar
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase font-bold">
            Use as teclas ↑↓ para navegar
          </p>
        </div>
      </motion.div>
    );
  }

  const isOrder = order.ped_situacao === "P" || order.ped_situacao === "F";
  const statusLabel = getStatusLabel(order.ped_situacao);
  const completionPercent = order.ped_situacao === "F" ? 100 : order.ped_situacao === "P" ? 75 : 35;
  return (
    <div className="flex-1 bg-detail-bg overflow-y-auto custom-scrollbar no-scrollbar relative border-l border-border/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={order.ped_numero}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6 lg:p-10 max-w-[1200px]"
        >
          {/* ── Header row ── */}
          <div className="flex items-start justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-[12px] font-semibold text-primary tracking-tight uppercase bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 shadow-sm transition-all hover:bg-primary/10">
                  #{order.ped_pedido}
                </span>
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: 1
                  }}
                  transition={{ 
                    scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                    opacity: { duration: 0.3 }
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-[0.1em] ${
                  isOrder 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-status-pending-bg border-status-pending/20 text-status-pending-foreground"
                }`}>
                  {statusLabel}
                </motion.span>
              </div>
              <h2 className="font-heading font-semibold text-3xl text-foreground tracking-tight uppercase leading-none mb-3">
                {order.cli_nomred}
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] leading-none">
                <span className="truncate max-w-[300px]">{order.cli_nome}</span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span>{order.ped_cliind || "PADRÃO"}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <button className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-all active:scale-95 shadow-sm">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-all active:scale-95 shadow-sm">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>

          {/* ── Bento Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* HERO: Total value — large card */}
            <BentoCard span="2" className="relative overflow-hidden group/hero border-primary/10 shadow-sm">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em] block mb-4">
                    VALOR TOTAL DO PEDIDO
                  </span>
                  <div className="flex items-baseline gap-1">
                    <motion.span 
                      key={order.ped_numero}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="font-heading font-semibold text-4xl text-foreground tabular-nums tracking-tight block leading-none"
                    >
                      {formatCurrency(displayPrice)}
                    </motion.span>
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/10"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +18.2%
                    </motion.span>
                    <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em]">vs. mês anterior</span>
                  </div>
                </div>
                
                {/* Recharts AreaChart Sparkline — Fixed Gradient Implementation */}
                <div className="hidden sm:block h-28 min-h-[110px] w-1/3 opacity-90 group-hover/hero:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#sparklineGradient)" 
                        animationBegin={400}
                        animationDuration={1800}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/hero:bg-primary/10 transition-colors duration-700" />
            </BentoCard>

            {/* Progress ring card */}
            <BentoCard delay={0.1} className="flex flex-col items-center justify-center text-center shadow-sm relative group/completion overflow-hidden">
              <div className="relative group/progress mb-4 z-10">
                <ProgressRing
                  percent={completionPercent}
                  color={isOrder ? "hsl(var(--primary))" : "hsl(var(--status-pending))"}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading font-bold text-2xl text-foreground leading-none">{completionPercent}%</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em] z-10">
                {isOrder ? "APROVAÇÃO" : "COTAÇÃO"}
              </span>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-primary/5 group-hover/completion:h-full transition-all duration-700 opacity-0 group-hover/completion:opacity-20 translate-y-full group-hover/completion:translate-y-0" />
            </BentoCard>

            {/* Info cards row */}
            <BentoCard className="shadow-sm hover:shadow-md transition-shadow">
              <InlineStat icon={Calendar} label="Data" value={new Date(order.ped_data.includes('T') ? order.ped_data : order.ped_data + 'T00:00:00').toLocaleDateString("pt-BR")} />
            </BentoCard>

            <BentoCard className="shadow-sm hover:shadow-md transition-shadow">
              <InlineStat icon={Truck} label="Canal" value={order.ped_cliind || "Padrão"} />
            </BentoCard>

            <BentoCard className="shadow-sm hover:shadow-md transition-shadow">
              <InlineStat icon={Building2} label="Código" value={`#${order.ped_numero}`} color="text-primary" />
            </BentoCard>

            {/* Quick actions — full width */}
            <BentoCard span="full" delay={0.3} className="!p-3 bg-secondary/30 border-dashed shadow-none border-border/60">
              <div className="flex items-center gap-2.5 flex-wrap justify-center px-4">
                <ActionPill icon={Eye} label="Visualizar" variant="info" onClick={() => onAction?.("view")} tooltip="Abrindo pré-visualização..." />
                <ActionPill icon={FileEdit} label="Editar" variant="primary" onClick={() => onAction?.("edit")} tooltip="Iniciando editor..." />
                <ActionPill icon={Copy} label="Duplicar" variant="warning" tooltip="Pedido duplicado com sucesso!" />
                <ActionPill icon={Printer} label="Imprimir" variant="purple" tooltip="Enviado para fila de impressão!" />
                <ActionPill icon={Share2} label="Compartilhar" variant="default" tooltip="Link copiado para área de transferência!" />
                <ActionPill icon={CreditCard} label="Faturar" variant="primary" tooltip="Processando fatura..." />
              </div>
            </BentoCard>

            {/* Client details card */}
            <BentoCard span="2" delay={0.35} className="shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em] block mb-6">
                DETALHES DO CLIENTE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                <InlineStat icon={User} label="RAZÃO SOCIAL" value={order.cli_nome} />
                <InlineStat icon={MapPin} label="STATUS ERP" value={statusLabel} color={isOrder ? "text-primary" : "text-status-pending-foreground"} />
                <InlineStat icon={Hash} label="REFERÊNCIA" value={order.ped_pedido} />
                <InlineStat icon={Building2} label="INDÚSTRIA" value={order.ped_cliind || "PADRÃO"} />
              </div>
            </BentoCard>

            {/* Activity / timeline mini card */}
            <BentoCard delay={0.4}>
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em] block mb-6">
                ATIVIDADE RECENTE
              </span>
              <div className="space-y-4">
                {[
                  { time: "10:32", text: "Pedido criado", dot: "bg-primary" },
                  { time: "10:45", text: "Itens adicionados", dot: "bg-blue-500" },
                  { time: "11:02", text: "Aguardando aprovação", dot: "bg-amber-500" },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-start gap-3 group/activity transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)] group-hover/activity:scale-125 transition-transform`} />
                    <div className="flex-1">
                      <span className="text-[11px] text-foreground font-semibold block uppercase leading-none mb-1">{item.text}</span>
                      <span className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter">{item.time} — REGISTRADO</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </BentoCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OrderDetail;
