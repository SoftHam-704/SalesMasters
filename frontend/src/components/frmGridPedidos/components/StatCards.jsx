import React from "react";

const formatCurrency = (value) =>
  (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const StatCards = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: "FATURAMENTO", value: formatCurrency(stats.revenue) },
    { label: "QTDE", value: (stats.quantity || 0).toLocaleString("pt-BR") },
    { label: "PDVS", value: String(stats.pdvs || 0) },
    { label: "TICKET", value: formatCurrency(stats.averageTicket) },
    { label: "PEDIDOS", value: String(stats.orders || 0), accent: true },
    { label: "COTAÇÕES", value: String(stats.quotes || 0) },
  ];

  return (
    <div className="flex items-center gap-6 px-1 overflow-x-auto custom-scrollbar no-scrollbar py-1">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <div className="flex items-baseline gap-2 group/stat cursor-default">
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.1em] font-body transition-colors group-hover/stat:text-primary/50">
              {item.label}
            </span>
            <span className={`font-heading font-semibold text-[13px] tabular-nums tracking-tight transition-all group-hover/stat:scale-105 ${
              item.accent ? "text-primary drop-shadow-[0_0_8px_rgba(20,184,166,0.1)]" : "text-foreground"
            }`}>
              {item.value}
            </span>
          </div>
          {idx < items.length - 1 && (
            <div className="h-3 w-px bg-border/60" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StatCards;
