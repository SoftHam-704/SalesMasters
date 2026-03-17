import React from "react";
import { Search, Plus, Clock, Sparkles } from "lucide-react";

const FormLabel = ({ children, shortcut }) => (
  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
    {children}
    {shortcut && (
      <span className="text-[9px] font-mono text-muted-foreground/50">({shortcut})</span>
    )}
  </label>
);

const FormInput = ({
  placeholder,
  value,
  disabled,
  icon: Icon,
  className = "",
}) => (
  <div className={`relative ${className}`}>
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
    )}
    <input
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      disabled={disabled}
      className={`w-full h-9 ${Icon ? "pl-9" : "pl-3"} pr-3 text-xs font-body bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
    />
  </div>
);

const FormSelect = ({
  placeholder,
  value,
  disabled,
  icon: Icon,
}) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
    )}
    <select
      disabled={disabled}
      defaultValue={value || ""}
      className={`w-full h-9 ${Icon ? "pl-9" : "pl-3"} pr-8 text-xs font-body bg-background border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <option value="" disabled>{placeholder}</option>
      <option value="cotacao">Cotação pendente</option>
      <option value="pedido">Pedido</option>
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 12 12" fill="none">
        <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

const OrderFormFields = ({ mode, order }) => {
  const isDisabled = mode === "view";
  const code = order?.ped_pedido || "";

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      <div className="flex gap-6 max-w-[1100px] mx-auto">
        {/* Left form section */}
        <div className="flex-1 space-y-5 animate-in fade-in slide-in-from-left duration-500">
          {/* Row 1: Pedido, Data, Situação */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <FormLabel>Pedido</FormLabel>
              <FormInput
                value={code}
                disabled
                className="[&_input]:bg-primary/5 [&_input]:border-primary/20 [&_input]:text-primary [&_input]:font-bold [&_input]:font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel>Data</FormLabel>
              <FormInput
                value={new Date(order?.ped_data || new Date()).toLocaleDateString("pt-BR")}
                disabled={isDisabled}
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel>Situação</FormLabel>
              <FormSelect
                placeholder="Selecione..."
                value={order?.ped_situacao === "P" ? "pedido" : "cotacao"}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Action mini buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={isDisabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-40"
            >
              <Clock className="w-3 h-3" />
              HISTÓRICO
            </button>
            <button
              disabled={isDisabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-40"
            >
              <Sparkles className="w-3 h-3" />
              SUGESTÃO
            </button>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <FormLabel shortcut="F8-PESQUISAR">Cliente</FormLabel>
            <FormInput
              placeholder="Busque por nome, CNPJ ou código..."
              value={order?.cli_nome}
              disabled={isDisabled}
              icon={Search}
            />
          </div>

          {/* Transportadora */}
          <div className="space-y-1.5">
            <FormLabel>Transportadora</FormLabel>
            <FormSelect 
              placeholder="Selecione a transportadora..." 
              value={order?.ped_transportadora}
              disabled={isDisabled} 
              icon={Search} 
            />
          </div>

          {/* Vendedor + Condições */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FormLabel>Vendedor</FormLabel>
              <FormSelect 
                placeholder="Selecione o vendedor..." 
                value={order?.ped_vendedor}
                disabled={isDisabled} 
                icon={Search} 
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel>Condições</FormLabel>
              <textarea
                disabled={isDisabled}
                defaultValue={order?.ped_condpag}
                placeholder="Informar condições de pagamento..."
                className="w-full h-[72px] px-3 py-2 text-xs font-body bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Comprador + Frete */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <FormLabel>Comprador</FormLabel>
                <FormInput 
                  placeholder="Nome do comprador" 
                  value={order?.ped_comprador}
                  disabled={isDisabled} 
                />
              </div>
              <button
                disabled={isDisabled}
                className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <FormLabel>Frete</FormLabel>
              <FormSelect 
                placeholder="FOB" 
                value={order?.ped_tipfrete}
                disabled={isDisabled} 
                icon={Search} 
              />
            </div>
          </div>

          {/* Pedido Cliente + Pedido Indústria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FormLabel>Pedido Cliente</FormLabel>
              <FormInput 
                placeholder="Nº do pedido do cliente" 
                value={order?.ped_cliind}
                disabled={isDisabled} 
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel>Pedido Indústria</FormLabel>
              <FormInput 
                placeholder="Nº do pedido da indústria" 
                value={order?.ped_pedind}
                disabled={isDisabled} 
              />
            </div>
          </div>
        </div>

        {/* Right panel: Tabela de Preço & Descontos */}
        <div className="w-[300px] flex-shrink-0 space-y-4 animate-in fade-in slide-in-from-right duration-500">
          {/* Tabela de Preço */}
          <div className="bg-bento-card border border-border rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Tabela de Preço
            </span>
            <FormSelect 
              placeholder="Selecione a tabela..." 
              value={order?.ped_tabela}
              disabled={isDisabled} 
              icon={Search} 
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground italic">Preços e impostos atualizados</span>
            </div>
          </div>

          {/* Descontos */}
          <div className="bg-bento-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Informar Descontos (%)
              </span>
              <button className="text-[10px] font-bold text-primary hover:underline">
                + Adicionar
              </button>
            </div>

            <div className="border border-primary/20 rounded-xl p-3">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[9px] text-muted-foreground font-mono block mb-1">{i + 1}º</span>
                    <input
                      disabled={isDisabled}
                      defaultValue={i === 0 ? "40,00%" : i === 1 ? "10,00%" : "0,00%"}
                      className="w-full h-7 text-center text-[10px] font-mono font-semibold bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={isDisabled}
              className="w-full h-9 bg-primary text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tornar Padrão
            </button>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 rounded border-2 border-destructive/50 flex items-center justify-center group-hover:border-destructive transition-colors">
                {/* checkbox unchecked */}
              </div>
              <span className="text-xs font-medium text-destructive/80">Permitir itens repetidos?</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormFields;
