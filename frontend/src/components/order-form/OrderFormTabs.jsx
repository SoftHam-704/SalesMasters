import React, { useState } from "react";
import { LayoutGrid, Wand2, ShoppingCart, Receipt, ClipboardCheck, MessageSquare, FileCheck, FileSpreadsheet } from "lucide-react";

const tabs = [
  { key: "principal", label: "F1 - PRINCIPAL", icon: LayoutGrid },
  { key: "magic", label: "F2 - MAGIC LOAD", icon: Wand2 },
  { key: "itens", label: "F3 - ITENS", icon: ShoppingCart },
  { key: "faturas", label: "F4 - FATURAS", icon: Receipt },
  { key: "conferencia", label: "F5 - CONFERÊNCIA", icon: ClipboardCheck },
  { key: "obs", label: "F6 - OBS.", icon: MessageSquare },
  { key: "faturados", label: "F7 - FATURADOS", icon: FileCheck },
  { key: "import", label: "XX - IMP. XLS", icon: FileSpreadsheet },
];

const OrderFormTabs = ({ disabled, activeTab, onTabChange }) => {
  return (
    <div className="px-6 py-2 border-t border-border bg-surface animate-in fade-in duration-300">
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              disabled={disabled}
              onClick={() => onTabChange?.(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              } disabled:opacity-40`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderFormTabs;
