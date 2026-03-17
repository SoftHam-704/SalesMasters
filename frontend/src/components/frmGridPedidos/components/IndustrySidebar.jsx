import React, { useState } from "react";
import { Factory, ChevronRight, Building2, Plane, Cpu, Shield, Store } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap = {
  building: Building2,
  plane: Plane,
  cpu: Cpu,
  shield: Shield,
  store: Store,
};

const IndustrySidebar = ({ industries = [], selected, onSelect, isLoading }) => {
  const [collapsed, setCollapsed] = useState(false);
  const totalCount = industries.reduce((sum, i) => sum + (i.count || 0), 0);

  const IndustryAvatar = ({ industry, size = "sm" }) => {
    const Icon = iconMap[industry.icon] || Building2;
    const dim = size === "sm" ? "w-8 h-8" : "w-6 h-6";
    const iconDim = size === "sm" ? "w-3.5 h-3.5" : "w-3 h-3";
    return (
      <div
        className={`${dim} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: (industry.color || "#4b5563") + "1a" }}
      >
        <Icon className={iconDim} style={{ color: industry.color || "#4b5563" }} />
      </div>
    );
  };

  if (collapsed) {
    return (
      <aside className="w-14 h-screen bg-surface border-r border-border flex flex-col items-center py-4 flex-shrink-0 transition-all duration-300">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors mb-6"
              >
                <Factory className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px] font-medium">
              Expandir menu
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {industries.map((industry) => (
          <TooltipProvider key={industry.code} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelect(industry.code)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all ${
                    selected === industry.code
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-surface"
                      : "hover:scale-105"
                  }`}
                >
                  <IndustryAvatar industry={industry} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px] font-medium">
                {industry.name} <span className="font-mono opacity-60 ml-1">({industry.count})</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-56 h-screen bg-surface border-r border-border flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Factory className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-heading font-bold text-xs text-foreground tracking-tight">INDÚSTRIAS</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all mb-0.5 ${
            selected === null
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-secondary font-medium"
          }`}
        >
          <span>Todas</span>
          <span className="font-mono text-[10px] opacity-60">{totalCount}</span>
        </button>

        {industries.map((industry) => (
          <button
            key={industry.code}
            onClick={() => onSelect(industry.code)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all mb-0.5 group ${
              selected === industry.code
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary font-medium"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <IndustryAvatar industry={industry} size="md" />
              <span className="truncate">{industry.name}</span>
            </div>
            <span className="font-mono text-[10px] opacity-60">{industry.count}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default IndustrySidebar;
