import React from "react";
import { motion } from "framer-motion";

const formatCurrency = (value) =>
  (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).toUpperCase();
};

const getStatusColor = (situacao) => {
  switch (situacao) {
    case "C": return "#e7661d"; // Laranja (Cotação)
    case "A": return "#1188c3"; // Azul Claro (Cotação Confirmada)
    case "F": return "#648041"; // Verde (Faturado)
    case "G": return "#9160ed"; // Roxo (Garantia)
    case "B": return "#e7661d"; // Laranja (Bonificação)
    case "N": return "#ffc107"; // Amarelo (Notificação)
    case "E": return "#8b4513"; // Marrom (Excluído)
    case "P": return "#0081e6"; // Azul (Pedido)
    default: return "#0081e6";
  }
};

const OrderList = ({ orders, selectedId, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-5 py-4 border-b border-border/50 animate-pulse flex items-center gap-3">
            <div className="w-[3px] h-12 rounded-full bg-secondary/50 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="h-3 w-32 bg-secondary rounded" />
                <div className="h-3 w-12 bg-secondary rounded-full" />
              </div>
              <div className="h-2 w-20 bg-secondary rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in duration-500">
        <p className="text-xs font-semibold uppercase tracking-widest">Nenhum registro encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {orders.map((order) => {
        const isSelected = selectedId === order.ped_numero;
        const isOrder = order.ped_situacao === "P" || order.ped_situacao === "F";
        const statusColor = getStatusColor(order.ped_situacao);

        return (
          <button
            key={order.ped_numero}
            onClick={() => onSelect(order.ped_numero)}
            className={`w-full text-left px-5 py-3.5 border-b border-border/30 transition-all relative group ${
              isSelected
                ? "bg-accent/[0.45] z-10"
                : "hover:bg-secondary/40"
            }`}
          >
            {/* Selection indicator — Positioned absolutely like the reference */}
            {isSelected && (
              <motion.div 
                layoutId="selection-pill"
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]" 
              />
            )}

            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="min-w-0 flex-1">
                {/* Client name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-semibold text-[13.5px] text-foreground truncate uppercase group-hover:text-primary transition-colors leading-tight">
                    {order.cli_nomred}
                  </span>
                </div>

                {/* Code + date */}
                <div className="flex items-center gap-2.5 opacity-60">
                  <span className="font-mono text-[11px] font-medium tracking-tight text-foreground">
                    #{order.ped_pedido}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[10px] tabular-nums font-semibold uppercase tracking-wider">
                    {formatDate(order.ped_data)}
                  </span>
                </div>
              </div>

              {/* Right side: status + value */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider transition-all"
                  style={{ 
                    backgroundColor: statusColor + '15', 
                    color: statusColor
                  }}
                >
                  {isOrder ? "PEDIDO" : "COTAÇÃO"}
                </span>
                <span className="font-mono text-[13px] font-semibold text-foreground tabular-nums tracking-tight">
                  {formatCurrency(order.ped_totliq)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default OrderList;
