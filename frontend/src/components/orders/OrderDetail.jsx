import React from "react";
import {
  Eye, FileEdit, Copy, Printer, Share2, ExternalLink,
  Clock, Hash, User, Truck, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Calendar, CreditCard, MapPin, Building2
} from "lucide-react";

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Bento Card wrapper ── */
const BentoCard = ({
  children,
  className = "",
  span = "1",
}) => {
  const colSpan = span === "full" ? "col-span-full" : span === "2" ? "col-span-2" : "col-span-1";
  return (
    <div
      className={`bg-bento-card rounded-2xl border border-border p-5 transition-all hover:shadow-md hover:border-border/80 ${colSpan} ${className}`}
    >
      {children}
    </div>
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
      <circle
        cx="34" cy="34" r={r} fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

/* ── Quick action pill ── */
const ActionPill = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

/* ── Inline stat ── */
const InlineStat = ({
  label,
  value,
  trend,
  icon: Icon,
  color = "text-foreground",
}) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <span className={`text-sm font-bold font-heading ${color}`}>{value}</span>
    </div>
    {trend && (
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend === "up" ? "text-primary" : "text-destructive"}`}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend === "up" ? "+12%" : "-3%"}
      </span>
    )}
  </div>
);

const OrderDetail = ({ order, onAction }) => {
  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Selecione um pedido para visualizar
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Clique em um card na lista à esquerda
          </p>
        </div>
      </div>
    );
  }

  const isOrder = order.ped_situacao === "P";
  const completionPercent = isOrder ? 100 : 35; // Example logic

  return (
    <div className="flex-1 bg-[#F9FAFB] overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500">
      <div className="p-6 max-w-[900px] mx-auto">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-xs text-muted-foreground">#{order.ped_pedido}</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  isOrder
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-bento-warning/10 text-bento-warning border border-bento-warning/20"
                }`}
              >
                 {isOrder ? "PEDIDO" : "COTAÇÃO PENDENTE"}
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground tracking-tight uppercase">
              {order.cli_nomred || order.cli_nome}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase">{order.cli_nome}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* HERO: Total value — large card */}
          <BentoCard span="2" className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                  Valor Total do Pedido
                </span>
                <span className="font-heading font-bold text-4xl text-foreground tabular-nums tracking-tight block">
                  {formatCurrency(order.ped_totliq || 0)}
                </span>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +Faturado
                  </span>
                  <span className="text-[10px] text-muted-foreground">Inclui IPI e impostos</span>
                </div>
              </div>
              {/* Mini bar chart decoration */}
              <div className="flex items-end gap-1 h-16 opacity-30">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-2.5 rounded-t-sm bg-primary"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            {/* Gradient accent */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
          </BentoCard>

          {/* Progress ring card */}
          <BentoCard className="flex flex-col items-center justify-center text-center">
            <div className="relative">
              <ProgressRing
                percent={completionPercent}
                color={isOrder ? "#10B981" : "#FBBF24"}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading font-bold text-lg text-foreground">{completionPercent}%</span>
              </div>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-2">
              {isOrder ? "Concluído" : "Status"}
            </span>
          </BentoCard>

          {/* Info cards row */}
          <BentoCard>
            <InlineStat icon={Calendar} label="Data do Pedido" value={new Date(order.ped_data.includes('T') ? order.ped_data : order.ped_data + 'T00:00:00').toLocaleDateString('pt-BR')} />
          </BentoCard>

          <BentoCard>
            <InlineStat icon={Truck} label="Transportadora" value={order.tra_nome || "FOB"} />
          </BentoCard>

          <BentoCard>
            <InlineStat icon={Building2} label="Tabela" value={order.ped_tabela || "Padrão"} color="text-primary" />
          </BentoCard>

          {/* Quick actions — full width */}
          <BentoCard span="full" className="!p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ActionPill icon={Eye} label="Visualizar" onClick={() => onAction?.("view")} />
              <ActionPill icon={FileEdit} label="Editar" onClick={() => onAction?.("edit")} />
              <ActionPill icon={Copy} label="Duplicar" />
              <ActionPill icon={Printer} label="Imprimir" />
              <ActionPill icon={Share2} label="Compartilhar" />
              <ActionPill icon={CreditCard} label="Faturar" />
            </div>
          </BentoCard>

          {/* Client details card */}
          <BentoCard span="2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-4">
              Informações Adicionais
            </span>
            <div className="space-y-3.5">
              <InlineStat icon={User} label="Comprador" value={order.ped_comprador || "Não inf."} />
              <InlineStat icon={MapPin} label="Cidade/UF" value={`${order.cli_cidade || ""} - ${order.cli_uf || ""}`} />
              <InlineStat icon={Hash} label="Ref. Cliente" value={order.ped_cliind || "—"} />
            </div>
          </BentoCard>

          {/* Activity / timeline mini card */}
          <BentoCard>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-3">
              Cond. Pagamento
            </span>
            <div className="flex flex-col gap-2">
               <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-[11px] font-bold text-foreground">
                    {order.ped_condpag || "À VISTA"}
                  </p>
               </div>
               <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Atualizado em {new Date(order.ped_datdigit.includes('T') ? order.ped_datdigit : order.ped_datdigit + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
               </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
