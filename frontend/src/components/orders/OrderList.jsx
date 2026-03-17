import React from "react";

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const OrderList = ({ orders, filter, selectedId, onSelect }) => {
  const filtered = orders.filter((o) => {
    // Mapping ped_situacao to filter
    if (filter === "orders") return o.ped_situacao === "P"; 
    if (filter === "quotes") return o.ped_situacao === "C";
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Nenhum registro encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map((order, index) => {
        const isSelected = selectedId === order.ped_numero;
        const isOrder = order.ped_situacao === "P";

        return (
          <button
            key={order.ped_numero}
            onClick={() => onSelect(order.ped_numero)}
            className={`w-full text-left px-4 py-3.5 border-b border-border transition-all relative group animate-in fade-in slide-in-from-bottom-2 duration-300`}
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Client name + code */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-semibold text-[13px] text-foreground truncate uppercase">
                    {order.cli_nomred || order.cli_nome}
                  </span>
                </div>

                {/* Code + date */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    #{order.ped_pedido}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(order.ped_data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Right side: status + value */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${
                    isOrder
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-bento-warning/10 text-bento-warning border border-bento-warning/20"
                  }`}
                >
                  {isOrder ? "PEDIDO" : "COTAÇÃO"}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatCurrency(order.ped_totliq || 0)}
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
