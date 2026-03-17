import React from "react";
import { Package } from "lucide-react";

const columns = [
  "SEQ", "CÓDIGO", "COMPLEM.", "DESCRIÇÃO", "", "QUANT", "UNITÁRIO",
  "DESC %", "UNI. LQ", "UN. IMP.", "TOTAL BR.", "TOTAL LIQ",
  "TOT C/ IMPOS", "1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "IPI"
];

const OrderFormItemsTable = () => {
  return (
    <div className="border-t border-border bg-background flex-shrink-0 animate-in fade-in duration-500">
      {/* Section header */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border">
        <Package className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
          Resumo dos Itens do Pedido
        </span>
      </div>

      {/* Table header */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[1200px]">
          <div className="flex items-center px-4 py-2 bg-secondary/50">
            {columns.map((col, i) => (
              <span
                key={i}
                className={`text-[9px] font-bold text-muted-foreground uppercase tracking-wider ${
                  col === "DESCRIÇÃO" ? "flex-1 min-w-[180px]" : "w-[70px] text-center flex-shrink-0"
                } ${col === "DESC %" ? "text-primary" : ""}`}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Empty state */}
          <div className="flex items-center justify-center py-10">
            <span className="text-xs text-muted-foreground/50 italic">
              Nenhum item lançado. Pressione F3 para adicionar.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormItemsTable;
