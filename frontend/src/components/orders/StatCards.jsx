import React from "react";

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const StatCards = ({ stats }) => {
  const items = [
    { label: "Faturamento", value: formatCurrency(stats.total_vendido || 0) },
    { label: "Qtde", value: (stats.total_quantidade || 0).toLocaleString("pt-BR") },
    { label: "PDVs", value: String(stats.total_clientes || 0) },
    { label: "Ticket", value: formatCurrency(stats.ticket_medio || 0) },
    { label: "Pedidos", value: String(stats.count_pedidos || 0), accent: true },
    { label: "Cotações", value: String(stats.count_cotacoes || 0) },
  ];

  return (
    <div className="flex items-center gap-6 px-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-baseline gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300" style={{ animationDelay: `${idx * 0.05}s` }}>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {item.label}
          </span>
          <span className={`font-heading font-bold text-sm tabular-nums ${
            item.accent ? "text-primary" : "text-foreground"
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
