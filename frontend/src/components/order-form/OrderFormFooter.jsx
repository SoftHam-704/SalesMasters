import React from "react";
import { X, Save } from "lucide-react";

const OrderFormFooter = ({ mode, onClose, itemsCount = 0 }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Itens no Pedido</span>
        <span className="text-xs font-heading font-bold text-foreground">{itemsCount} produtos</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-destructive/30 transition-all shadow-sm"
        >
          <X className="w-3.5 h-3.5" />
          CANCELAR
        </button>

        {mode !== "view" && (
          <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <Save className="w-3.5 h-3.5" />
            SALVAR (F10)
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderFormFooter;
