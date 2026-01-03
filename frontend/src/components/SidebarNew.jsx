import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Target,
    TrendingUp,
    Calendar,
    MessageSquare,
    Settings,
    Trophy,
    Building2,
    ShoppingCart,
    BarChart2,
    BarChart3,
    ChevronRight,
    Briefcase,
    Zap,
    Award,
    Sparkles,
    Database,
    Wallet,
    ArrowLeftRight,
    Wrench,
    PieChart,
    Map,
    Package,
    Truck,
    Tags,
    DollarSign,
    FileText,
    BookOpen,
    Gamepad2,
    Home
} from "lucide-react";
import { cn } from "@/lib/utils";

import salesMastersLogo from '../assets/salesmasters_logo.png';
import softHamLogo from '../assets/softham_logo.png';

// --- NavItem Component ---
const NavItem = ({ icon: Icon, label, active, badge, badgeClassName, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "group relative w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 rounded-xl",
            active
                ? "bg-emerald-50"
                : "hover:bg-gray-50"
        )}
    >
        {/* Left accent bar for active state */}
        {active && (
            <motion.div
                layoutId="activeAccent"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
        )}

        {/* Icon container */}
        <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
            active
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
        )}>
            <Icon className={cn("w-[20px] h-[20px]", badgeClassName && "animate-pulse")} strokeWidth={2} />
        </div>

        {/* Label */}
        <span className={cn(
            "flex-1 text-[14px] transition-colors font-medium",
            active ? "text-emerald-700" : "text-gray-600 group-hover:text-gray-900"
        )}>
            {label}
        </span>

        {/* Badge */}
        {badge && (
            <span
                className={cn(
                    "min-w-[24px] h-6 px-2 flex items-center justify-center text-[10px] font-bold rounded-full transition-all border",
                    badgeClassName
                        ? badgeClassName
                        : active
                            ? "bg-emerald-500 text-white border-transparent"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}
            >
                {badge}
            </span>
        )}
    </motion.button>
);

// --- CollapsibleSection Component ---
const CollapsibleSection = ({
    icon: Icon,
    title,
    children,
    defaultOpen = false,
    accentColor,
    accentBg
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-1">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50 group"
                whileTap={{ scale: 0.98 }}
            >
                {/* Section icon */}
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: accentBg }}
                >
                    <Icon className="w-4 h-4" style={{ color: accentColor }} />
                </div>

                {/* Section title */}
                <span className="flex-1 text-left text-[12px] font-bold tracking-[0.05em] uppercase text-gray-400">
                    {title}
                </span>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-300"
                >
                    <ChevronRight className="w-4 h-4" />
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="py-1 space-y-0.5 ml-2 border-l border-gray-100 pl-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sidebar Component ---
export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active page
    const isActive = (path) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-[280px] h-screen flex flex-col bg-white border-r border-gray-100 flex-shrink-0"
            style={{ position: 'sticky', top: 0, zIndex: 50 }}
        >
            {/* Header / Logo */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 p-[2px] shadow-lg shadow-blue-500/30 flex items-center justify-center">
                        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={salesMastersLogo} alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-gray-900 font-bold text-[18px] tracking-tight">
                            SalesMasters
                        </h1>
                        <p className="text-blue-600 text-[11px] font-semibold tracking-wide uppercase">
                            Professional v2.5
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">

                {/* Dashboard & Intelligence (Top Level) */}
                <div className="mb-2 space-y-1">
                    <NavItem
                        icon={Home}
                        label="Dashboard"
                        active={isActive("/") && location.pathname === "/"}
                        onClick={() => navigate("/")}
                    />

                    <NavItem
                        icon={BarChart2}
                        label="Business Intelligence"
                        active={isActive("/bi-intelligence")}
                        onClick={() => navigate("/bi-intelligence")}
                        badge="NEW"
                        badgeClassName="bg-amber-100 text-amber-700 border-amber-200"
                    />
                </div>

                {/* CADASTROS */}
                <CollapsibleSection
                    icon={Building2}
                    title="Cadastros"
                    defaultOpen={false}
                    accentColor="#0284C7"
                    accentBg="#E0F2FE"
                >
                    <NavItem icon={Building2} label="Indústrias" active={isActive("/industrias")} onClick={() => navigate("/industrias")} />
                    <NavItem icon={Users} label="Clientes" active={isActive("/clientes")} onClick={() => navigate("/clientes")} />
                    <NavItem icon={Briefcase} label="Vendedores" active={isActive("/vendedores")} onClick={() => navigate("/vendedores")} />
                    <NavItem icon={Package} label="Produtos" active={isActive("/produtos")} onClick={() => navigate("/produtos")} />
                    <NavItem icon={Tags} label="Categorias" active={isActive("/cadastros/categorias")} onClick={() => navigate("/cadastros/categorias")} />
                    <NavItem icon={Tags} label="Grupos de Produtos" active={isActive("/cadastros/grupos-produtos")} onClick={() => navigate("/cadastros/grupos-produtos")} />
                    <NavItem icon={DollarSign} label="Grupos Descontos" active={isActive("/cadastros/grupos-descontos")} onClick={() => navigate("/cadastros/grupos-descontos")} />
                    <NavItem icon={Map} label="Regiões" active={isActive("/cadastros/regioes")} onClick={() => navigate("/cadastros/regioes")} />
                    <NavItem icon={Map} label="Área Atuação" active={isActive("/cadastros/area-atuacao")} onClick={() => navigate("/cadastros/area-atuacao")} />
                    <NavItem icon={Truck} label="Transportadoras" active={isActive("/cadastros/transportadoras")} onClick={() => navigate("/cadastros/transportadoras")} />
                    <NavItem icon={FileText} label="Tabelas Preços" active={isActive("/cadastros/tabelas-precos")} onClick={() => navigate("/cadastros/tabelas-precos")} />
                </CollapsibleSection>

                {/* MOVIMENTAÇÕES */}
                <CollapsibleSection
                    icon={Briefcase}
                    title="Movimentações"
                    defaultOpen={true}
                    accentColor="#059669"
                    accentBg="#D1FAE5"
                >
                    <NavItem icon={ShoppingCart} label="Pedidos de Venda" active={isActive("/pedidos")} onClick={() => navigate("/pedidos")} />
                    <NavItem icon={FileText} label="Baixa via XML" active={isActive("/movimentacoes/baixa-xml")} onClick={() => navigate("/movimentacoes/baixa-xml")} />
                    <NavItem icon={TrendingUp} label="SELL-OUT" active={isActive("/movimentacoes/sell-out")} onClick={() => navigate("/movimentacoes/sell-out")} />
                    <NavItem icon={Users} label="CRM / Atendimentos" active={isActive("/crm")} onClick={() => navigate("/crm")} />
                </CollapsibleSection>


                {/* FINANCEIRO */}
                <CollapsibleSection
                    icon={Wallet}
                    title="Financeiro"
                    defaultOpen={false}
                    accentColor="#7C3AED"
                    accentBg="#EDE9FE"
                >
                    <NavItem icon={DollarSign} label="Contas a Receber" active={isActive("/financeiro/receber")} onClick={() => navigate("/financeiro/receber")} />
                    <NavItem icon={DollarSign} label="Contas a Pagar" active={isActive("/financeiro/pagar")} onClick={() => navigate("/financeiro/pagar")} />
                    <NavItem icon={TrendingUp} label="Fluxo de Caixa" active={isActive("/financeiro/relatorios/fluxo-caixa")} onClick={() => navigate("/financeiro/relatorios/fluxo-caixa")} />
                    <NavItem icon={PieChart} label="DRE Gerencial" active={isActive("/financeiro/relatorios/dre")} onClick={() => navigate("/financeiro/relatorios/dre")} />
                    <NavItem icon={Settings} label="Plano de Contas" active={isActive("/financeiro/plano-contas")} onClick={() => navigate("/financeiro/plano-contas")} />
                    <NavItem icon={Building2} label="Centro de Custo" active={isActive("/financeiro/centro-custo")} onClick={() => navigate("/financeiro/centro-custo")} />
                </CollapsibleSection>


                {/* ESTATISTICOS */}
                <CollapsibleSection
                    icon={PieChart}
                    title="Estatísticos"
                    defaultOpen={false}
                    accentColor="#DB2777"
                    accentBg="#FCE7F3"
                >
                    <NavItem icon={BarChart2} label="Mapa de Vendas" active={isActive("/estatisticos/mapa-vendas")} onClick={() => navigate("/estatisticos/mapa-vendas")} />
                    <NavItem icon={PieChart} label="Mapa Cli/Indústria" active={isActive("/estatisticos/mapa-cliente-industria")} onClick={() => navigate("/estatisticos/mapa-cliente-industria")} />
                    <NavItem icon={BarChart2} label="Mapa Cli Mês a Mês" active={isActive("/estatisticos/mapa-cliente-mes")} onClick={() => navigate("/estatisticos/mapa-cliente-mes")} />
                    <NavItem icon={Users} label="Mapa por Vendedor" active={isActive("/estatisticos/mapa-vendedor")} onClick={() => navigate("/estatisticos/mapa-vendedor")} />
                    <NavItem icon={Package} label="Mapa Produtos" active={isActive("/estatisticos/mapa-produtos")} onClick={() => navigate("/estatisticos/mapa-produtos")} />
                    <NavItem icon={ShoppingCart} label="Últimas Compras" active={isActive("/estatisticos/ultimas-compras")} onClick={() => navigate("/estatisticos/ultimas-compras")} />
                    <NavItem icon={BarChart2} label="Mapa em Qtd" active={isActive("/estatisticos/mapa-quantidade")} onClick={() => navigate("/estatisticos/mapa-quantidade")} />
                    <NavItem icon={Users} label="Comparativo Clientes" active={isActive("/estatisticos/comparativo-clientes")} onClick={() => navigate("/estatisticos/comparativo-clientes")} />
                    <NavItem icon={Building2} label="Grupo de Lojas" active={isActive("/estatisticos/grupo-lojas")} onClick={() => navigate("/estatisticos/grupo-lojas")} />
                </CollapsibleSection>


                {/* UTILITÁRIOS */}
                <CollapsibleSection
                    icon={Wrench}
                    title="Utilitários"
                    defaultOpen={false}
                    accentColor="#4B5563"
                    accentBg="#F3F4F6"
                >
                    <NavItem icon={Package} label="Catálogo Digital" active={isActive("/utilitarios/catalogo-produtos")} onClick={() => navigate("/utilitarios/catalogo-produtos")} />
                    <NavItem icon={Sparkles} label="Assistente IA" active={isActive("/assistente")} onClick={() => navigate("/assistente")} />
                    <NavItem icon={Settings} label="Configurações" active={isActive("/utilitarios/configuracoes")} onClick={() => navigate("/utilitarios/configuracoes")} />
                </CollapsibleSection>

            </nav>

            {/* Footer - Restored SoftHam Branding */}
            <div className="px-4 pb-4 pt-3 border-t border-gray-100">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <img src={softHamLogo} alt="SoftHam" className="w-10 h-10 rounded-full border border-gray-200 bg-white p-0.5" />
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-[12px] font-bold text-gray-900 truncate">SoftHam Sistemas</p>
                        <p className="text-[10px] text-gray-500 font-mono">(67) 9 9607-8885</p>

                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Conectado</span>
                        </div>
                    </div>
                </div>
            </div>

        </motion.aside>
    );
};

export default Sidebar;
