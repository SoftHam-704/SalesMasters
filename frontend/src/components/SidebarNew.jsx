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
    Home,
    MessageCircle,
    Route,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

import iconeMasters2025 from '../assets/icone_masters_2025.png';
import logoSales from '../assets/salesmasters_logo_v2.png';
import softHamLogo from '../assets/softham_logo.png';

const NavItem = ({ icon: Icon, label, active, badge, badgeClassName, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "group relative w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-300 rounded-xl mb-0.5 border border-transparent",
            active
                ? "bg-white shadow-[0_10px_25px_-5px_rgba(30,64,175,0.12)] border-blue-100"
                : "hover:bg-blue-50/50"
        )}
    >
        {/* Subtle Indicator for active state */}
        {active && (
            <motion.div
                layoutId="activeAccent"
                className="absolute left-2 w-1 h-5 bg-blue-600 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
        )}

        {/* Icon */}
        <div className={cn(
            "flex items-center justify-center w-5 h-5 transition-all duration-300 ml-1.5",
            active
                ? "text-blue-600 scale-110"
                : "text-slate-400 group-hover:text-blue-500"
        )}>
            <Icon className={cn("w-full h-full", badgeClassName && "animate-pulse")} strokeWidth={active ? 2.5 : 2} />
        </div>

        {/* Label - Darker and Bolder */}
        <span className={cn(
            "flex-1 text-[13px] transition-colors tracking-wide",
            active
                ? "text-blue-900 font-black"
                : "text-slate-700 font-bold group-hover:text-slate-950"
        )}>
            {label}
        </span>

        {/* Badge */}
        {badge && (
            <span
                className={cn(
                    "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[9px] font-black rounded-full transition-all border",
                    badgeClassName
                        ? badgeClassName
                        : active
                            ? "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-600/20"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                )}
            >
                {badge}
            </span>
        )}
    </motion.button>
);

const CollapsibleSection = ({
    icon: Icon,
    title,
    children,
    isOpen,
    onToggle,
    accentColor
}) => {
    return (
        <div className="mb-1">
            <motion.button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-1.5 mt-2 rounded-xl transition-all duration-300 group"
                whileTap={{ scale: 0.98 }}
            >
                {/* Section title - Deep Slate for Contrast */}
                <span className="flex-1 text-left text-[10px] font-black tracking-[0.15em] uppercase text-slate-500 group-hover:text-blue-600 transition-colors">
                    {title}
                </span>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400 group-hover:text-blue-500"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <div className="py-1 px-1 space-y-0.5">
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

    const [dbType, setDbType] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [lastSync, setLastSync] = useState(null);
    const [openSectionId, setOpenSectionId] = useState('movimentacoes');
    const [userPermissions, setUserPermissions] = useState(null);
    const [isMaster, setIsMaster] = useState(false);
    const [isGerencia, setIsGerencia] = useState(false);
    const [isBiEnabled, setIsBiEnabled] = useState(false);
    const [chatNaoLidas, setChatNaoLidas] = useState(0);

    // Escutar eventos de novas mensagens do chat para atualizar o badge
    React.useEffect(() => {
        const handleBadge = (e) => setChatNaoLidas(e.detail);
        window.addEventListener('chat:badge', handleBadge);
        return () => window.removeEventListener('chat:badge', handleBadge);
    }, []);

    const handleToggleSection = (sectionId) => {
        setOpenSectionId(prev => prev === sectionId ? null : sectionId);
    };

    const canAccess = (indice) => {
        if (isMaster) return true; // Master vê tudo
        if (!userPermissions) return true; // Se ainda não carregou ou não tem tabela, mostra (fallback de segurança)

        const permission = userPermissions.find(p => p.indice === indice);
        if (!permission) return true; // Se não houver regra específica para esse índice, assume visível

        return !permission.invisivel;
    };

    React.useEffect(() => {
        const fetchSystemInfo = async () => {
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/system-info'));
                const data = await response.json();
                if (data.success) {
                    setDbType(data.database_type);
                }
            } catch (error) {
                console.error('Error fetching system info:', error);
            }
        };

        const fetchCompanyConfig = async () => {
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/company'));
                const data = await response.json();
                if (data.success && data.config?.nome) {
                    // Pegar apenas a primeira parte do nome (antes da primeira vírgula ou 30 chars)
                    const fullName = data.config.nome;
                    const shortName = fullName.includes(' - ')
                        ? fullName.split(' - ')[0].trim()
                        : fullName.length > 25
                            ? fullName.substring(0, 25) + '...'
                            : fullName;
                    setCompanyName(shortName);
                }
            } catch (error) {
                console.error('Error fetching company config:', error);
            }
        };

        const fetchUserPermissions = async () => {
            try {
                const userJson = sessionStorage.getItem('user');
                if (!userJson) return;
                const user = JSON.parse(userJson);

                // Pegar se o BI está habilitado para a empresa (definido no login pelo banco Master)
                setIsBiEnabled(user.biEnabled === true);

                const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/system/my-permissions?userId=${user.id}`));
                const data = await response.json();

                if (data.success) {
                    setIsMaster(data.master);
                    setIsGerencia(data.isGerencia);
                    setUserPermissions(data.permissions);
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchSystemInfo();
        fetchCompanyConfig();
        fetchUserPermissions();
    }, []);

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-[280px] h-screen flex flex-col bg-slate-50 border-r border-slate-200/60 flex-shrink-0 relative overflow-hidden"
            style={{ position: 'sticky', top: 0, zIndex: 50 }}
        >
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 via-transparent to-transparent pointer-events-none" />

            {/* Header / Logo */}
            <div className="px-5 pt-6 pb-6 text-center relative z-10">
                <div className="flex flex-col items-center justify-center gap-3">
                    <img
                        src={logoSales}
                        alt="SalesMasters"
                        className="w-40 drop-shadow-2xl"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                        <p className="text-blue-900/40 text-[9.5px] font-black tracking-[0.3em] uppercase">
                            Enterprise Edition
                        </p>
                        <div className="h-[1px] w-10 bg-blue-200" />
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

                    {isBiEnabled && (isMaster || isGerencia) && (
                        <NavItem
                            icon={BarChart2}
                            label="Business Intelligence"
                            active={isActive("/bi-intelligence")}
                            onClick={() => navigate("/bi-intelligence")}
                            badge="NEW"
                            badgeClassName="bg-amber-100 text-amber-700 border-amber-200"
                        />
                    )}

                    <NavItem
                        icon={Calendar}
                        label="Minha Agenda"
                        active={isActive("/agenda")}
                        onClick={() => navigate("/agenda")}
                        badge="PRO"
                        badgeClassName="bg-emerald-100 text-emerald-700 border-emerald-200"
                    />
                </div>

                {/* CADASTROS */}
                {canAccess(10) && (
                    <CollapsibleSection
                        icon={Building2}
                        title="Cadastros"
                        isOpen={openSectionId === 'cadastros'}
                        onToggle={() => handleToggleSection('cadastros')}
                        accentColor="#0284C7"
                    >
                        {canAccess(100) && <NavItem icon={Building2} label="Indústrias" active={isActive("/industrias")} onClick={() => navigate("/industrias")} />}
                        {canAccess(101) && <NavItem icon={Users} label="Clientes" active={isActive("/clientes")} onClick={() => navigate("/clientes")} />}
                        {canAccess(103) && <NavItem icon={Briefcase} label="Vendedores" active={isActive("/vendedores")} onClick={() => navigate("/vendedores")} />}
                        {canAccess(105) && <NavItem icon={Package} label="Produtos" active={isActive("/produtos")} onClick={() => navigate("/produtos")} />}
                        {canAccess(117) && <NavItem icon={Tags} label="Categorias" active={isActive("/cadastros/categorias")} onClick={() => navigate("/cadastros/categorias")} />}
                        {canAccess(104) && <NavItem icon={Tags} label="Grupos de Produtos" active={isActive("/cadastros/grupos-produtos")} onClick={() => navigate("/cadastros/grupos-produtos")} />}
                        {canAccess(118) && <NavItem icon={DollarSign} label="Grupos Descontos" active={isActive("/cadastros/grupos-descontos")} onClick={() => navigate("/cadastros/grupos-descontos")} />}
                        {canAccess(113) && <NavItem icon={Map} label="Regiões" active={isActive("/cadastros/regioes")} onClick={() => navigate("/cadastros/regioes")} />}
                        {canAccess(113) && <NavItem icon={MapPin} label="Setores / Bairros" active={isActive("/cadastros/setores")} onClick={() => navigate("/cadastros/setores")} />}
                        {canAccess(113) && <NavItem icon={Route} label="Itinerários de Visita" active={isActive("/cadastros/itinerarios")} onClick={() => navigate("/cadastros/itinerarios")} badge="NOVO" badgeClassName="bg-emerald-100 text-emerald-700" />}
                        {canAccess(114) && <NavItem icon={Map} label="Área Atuação" active={isActive("/cadastros/area-atuacao")} onClick={() => navigate("/cadastros/area-atuacao")} />}
                        {canAccess(106) && <NavItem icon={Truck} label="Transportadoras" active={isActive("/cadastros/transportadoras")} onClick={() => navigate("/cadastros/transportadoras")} />}
                        {canAccess(111) && <NavItem icon={FileText} label="Tabelas Preços" active={isActive("/cadastros/tabelas-precos")} onClick={() => navigate("/cadastros/tabelas-precos")} />}
                    </CollapsibleSection>
                )}

                {/* MOVIMENTAÇÕES */}
                {canAccess(20) && (
                    <CollapsibleSection
                        icon={Briefcase}
                        title="Movimentações"
                        isOpen={openSectionId === 'movimentacoes'}
                        onToggle={() => handleToggleSection('movimentacoes')}
                        accentColor="#059669"
                    >
                        {canAccess(207) && <NavItem icon={ShoppingCart} label="Pedidos de Venda" active={isActive("/pedidos")} onClick={() => navigate("/pedidos")} />}
                        {canAccess(207) && <NavItem icon={Target} label="Campanhas & Metas" active={isActive("/vendas/campanhas")} onClick={() => navigate("/vendas/campanhas")} badge="BETA" badgeClassName="bg-purple-100 text-purple-700 font-bold" />}
                        {canAccess(205) && <NavItem icon={FileText} label="Baixa via XML" active={isActive("/movimentacoes/baixa-xml")} onClick={() => navigate("/movimentacoes/baixa-xml")} />}
                        {canAccess(208) && <NavItem icon={TrendingUp} label="SELL-OUT" active={isActive("/movimentacoes/sell-out")} onClick={() => navigate("/movimentacoes/sell-out")} />}
                        {canAccess(206) && <NavItem icon={Users} label="CRM / Atendimentos" active={isActive("/crm")} onClick={() => navigate("/crm")} />}
                    </CollapsibleSection>
                )}


                {/* FINANCEIRO */}
                {canAccess(30) && (
                    <CollapsibleSection
                        icon={Wallet}
                        title="Financeiro"
                        isOpen={openSectionId === 'financeiro'}
                        onToggle={() => handleToggleSection('financeiro')}
                        accentColor="#7C3AED"
                    >
                        {canAccess(301) && <NavItem icon={DollarSign} label="Contas a Receber" active={isActive("/financeiro/receber")} onClick={() => navigate("/financeiro/receber")} />}
                        {canAccess(302) && <NavItem icon={DollarSign} label="Contas a Pagar" active={isActive("/financeiro/pagar")} onClick={() => navigate("/financeiro/pagar")} />}
                        {canAccess(303) && <NavItem icon={TrendingUp} label="Fluxo de Caixa" active={isActive("/financeiro/relatorios/fluxo-caixa")} onClick={() => navigate("/financeiro/relatorios/fluxo-caixa")} />}
                        {canAccess(304) && <NavItem icon={PieChart} label="DRE Gerencial" active={isActive("/financeiro/relatorios/dre")} onClick={() => navigate("/financeiro/relatorios/dre")} />}
                        {canAccess(109) && <NavItem icon={Settings} label="Plano de Contas" active={isActive("/financeiro/plano-contas")} onClick={() => navigate("/financeiro/plano-contas")} />}
                        {canAccess(108) && <NavItem icon={Building2} label="Centro de Custo" active={isActive("/financeiro/centro-custo")} onClick={() => navigate("/financeiro/centro-custo")} />}
                        {canAccess(305) && <NavItem icon={Users} label="Clientes Financeiros" active={isActive("/financeiro/clientes")} onClick={() => navigate("/financeiro/clientes")} />}
                        {canAccess(307) && <NavItem icon={Truck} label="Fornecedores Fin." active={isActive("/financeiro/fornecedores")} onClick={() => navigate("/financeiro/fornecedores")} />}
                    </CollapsibleSection>
                )}


                {/* ESTATISTICOS */}
                {canAccess(50) && (
                    <CollapsibleSection
                        icon={PieChart}
                        title="Estatísticos"
                        isOpen={openSectionId === 'estatisticos'}
                        onToggle={() => handleToggleSection('estatisticos')}
                        accentColor="#DB2777"
                    >
                        {canAccess(501) && <NavItem icon={BarChart2} label="Mapa de Vendas" active={isActive("/estatisticos/mapa-vendas")} onClick={() => navigate("/estatisticos/mapa-vendas")} />}
                        {canAccess(502) && <NavItem icon={PieChart} label="Mapa Cli/Indústria" active={isActive("/estatisticos/mapa-cliente-industria")} onClick={() => navigate("/estatisticos/mapa-cliente-industria")} />}
                        {canAccess(503) && <NavItem icon={BarChart2} label="Mapa Cli Mês a Mês" active={isActive("/estatisticos/mapa-cliente-mes")} onClick={() => navigate("/estatisticos/mapa-cliente-mes")} />}
                        {canAccess(504) && <NavItem icon={Users} label="Mapa por Vendedor" active={isActive("/estatisticos/mapa-vendedor")} onClick={() => navigate("/estatisticos/mapa-vendedor")} />}
                        {canAccess(505) && <NavItem icon={Package} label="Mapa Produtos" active={isActive("/estatisticos/mapa-produtos")} onClick={() => navigate("/estatisticos/mapa-produtos")} />}
                        {canAccess(506) && <NavItem icon={ShoppingCart} label="Últimas Compras" active={isActive("/estatisticos/ultimas-compras")} onClick={() => navigate("/estatisticos/ultimas-compras")} />}
                        {canAccess(507) && <NavItem icon={BarChart2} label="Mapa em Qtd" active={isActive("/estatisticos/mapa-quantidade")} onClick={() => navigate("/estatisticos/mapa-quantidade")} />}
                        {canAccess(508) && <NavItem icon={Users} label="Comparativo Clientes" active={isActive("/estatisticos/comparativo-clientes")} onClick={() => navigate("/estatisticos/comparativo-clientes")} />}
                        {canAccess(509) && <NavItem icon={Building2} label="Grupo de Lojas" active={isActive("/estatisticos/grupo-lojas")} onClick={() => navigate("/estatisticos/grupo-lojas")} />}
                    </CollapsibleSection>
                )}


                {/* UTILITÁRIOS */}
                {canAccess(60) && (
                    <CollapsibleSection
                        icon={Wrench}
                        title="Utilitários"
                        isOpen={openSectionId === 'utilitarios'}
                        onToggle={() => handleToggleSection('utilitarios')}
                        accentColor="#4B5563"
                    >
                        {canAccess(610) && <NavItem icon={Package} label="Catálogo Digital" active={isActive("/utilitarios/catalogo-produtos")} onClick={() => navigate("/utilitarios/catalogo-produtos")} />}
                        {canAccess(620) && <NavItem icon={Sparkles} label="Assistente IA" active={isActive("/assistente")} onClick={() => navigate("/assistente")} />}
                        {canAccess(630) && <NavItem icon={Gamepad2} label="🎮 Tetris" active={isActive("/utilitarios/tetris")} onClick={() => navigate("/utilitarios/tetris")} />}
                        {canAccess(640) && <NavItem icon={Gamepad2} label="🎲 Jogo de Dados" active={isActive("/utilitarios/jogo-dados")} onClick={() => navigate("/utilitarios/jogo-dados")} />}
                        {canAccess(601) && <NavItem icon={Users} label="Usuários do sistema" active={isActive("/utilitarios/usuarios")} onClick={() => navigate("/utilitarios/usuarios")} />}
                        {canAccess(611) && <NavItem icon={Settings} label="Parâmetros" active={isActive("/utilitarios/parametros")} onClick={() => navigate("/utilitarios/parametros")} />}
                        {canAccess(612) && <NavItem icon={Settings} label="Configurações" active={isActive("/utilitarios/configuracoes")} onClick={() => navigate("/utilitarios/configuracoes")} />}
                    </CollapsibleSection>
                )}

            </nav>

            {/* Footer - Logout and SoftHam Branding */}
            <div className="px-3 pb-6 pt-4 border-t border-slate-200/60 bg-white/40 backdrop-blur-md relative z-10 text-left">
                {/* Botão do Chat Pro */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('chat:toggle'))}
                    className="w-full flex items-center gap-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300 group mb-2 border border-emerald-100/50 bg-emerald-50/30 relative"
                >
                    <div className="relative">
                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {chatNaoLidas > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                                {chatNaoLidas}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-start translate-y-[-1px]">
                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">SalesMaster Chat</span>
                        <span className="text-[9px] font-bold text-emerald-500/70 tracking-wider">MENSAGENS INTERNAS</span>
                    </div>
                    <div className="ml-auto">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white">
                            PRO
                        </div>
                    </div>
                </motion.button>

                {/* Botão de Sair */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (window.confirm('Deseja realmente sair?')) {
                            sessionStorage.clear();
                            localStorage.removeItem('user');
                            localStorage.removeItem('tenantConfig');
                            window.location.href = '/login';
                        }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 group mb-3"
                >
                    <ArrowLeftRight className="w-4 h-4 rotate-180 transform group-hover:scale-110 transition-transform text-slate-400 group-hover:text-rose-500" />
                    <span className="text-[12px] font-black uppercase tracking-[0.15em]">Sair do Sistema</span>
                </motion.button>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-200/60 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                    <div className="relative z-10">
                        <img src={softHamLogo} alt="SoftHam" className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    <div className="flex flex-col overflow-hidden relative z-10">
                        <p className="text-[11px] font-black text-blue-900 truncate tracking-tight">SoftHam Sistemas</p>
                        <p className="text-[9px] text-slate-600 font-extrabold tracking-wide mt-0.5">(67) 9.9607-8885</p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <div className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                dbType === 'local' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            )}>
                                <span className={cn("h-1 w-1 rounded-full animate-pulse", dbType === 'local' ? "bg-amber-500" : "bg-emerald-500")} />
                                {dbType === 'local' ? 'LOCAL' : 'CLOUD'}
                            </div>

                            {companyName && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 max-w-[120px]">
                                    <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="truncate" title={companyName}>{companyName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </motion.aside>
    );
};

export default Sidebar;
