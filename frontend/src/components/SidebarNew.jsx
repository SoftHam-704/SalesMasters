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
    ShoppingBag,
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
    MapPin,
    UserX,
    Construction,
    HardHat,
    Layers,
    Boxes,
    Calculator,
    ClipboardList,
    Info,
    Globe,
    Printer,
    Tag,
    CheckCircle2,
    Clock,
    PackageX,
    CalendarRange,
    ClipboardCheck,
    Kanban,
    ListChecks
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
                : "text-slate-500 group-hover:text-blue-500"
        )}>
            <Icon className={cn("w-full h-full", badgeClassName && "animate-pulse")} strokeWidth={active ? 2.5 : 2} />
        </div>

        {/* Label - More compact and lighter */}
        <span className={cn(
            "flex-1 text-[13px] transition-colors tracking-tight leading-tight",
            active
                ? "text-blue-900 font-bold"
                : "text-slate-600 font-medium group-hover:text-slate-900"
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
                className="w-full flex items-center gap-3 px-4 py-2.5 mt-3 rounded-xl transition-all duration-300 group bg-slate-100/50 border border-slate-200/40 hover:bg-white hover:shadow-md hover:border-blue-200"
                whileTap={{ scale: 0.98 }}
            >
                {/* Section title - Deep Slate for Contrast */}
                <span className="flex-1 text-left text-[12px] font-extrabold tracking-[0.2em] uppercase text-slate-900 group-hover:text-blue-700 transition-colors">
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

    // Configuração do Tenant para Menu Dinâmico
    const tenantConfigStr = sessionStorage.getItem('tenantConfig');
    const tenantConfig = tenantConfigStr ? JSON.parse(tenantConfigStr) : {};
    const isProjetos = tenantConfig.ramoatv === 'Projetos' || tenantConfig.ramoatv === 'Logística';
    const isAutopecas = tenantConfig.ramoatv === 'Autopeças';
    const companyCnpj = (tenantConfig?.cnpj || '').replace(/\D/g, '');

    // Determine active page
    const isActive = (path) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const [dbType, setDbType] = useState(null);
    const [userName, setUserName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [lastSync, setLastSync] = useState(null);
    const [openSectionId, setOpenSectionId] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [isMaster, setIsMaster] = useState(false);
    const [isGerencia, setIsGerencia] = useState(false);
    const [isBiEnabled, setIsBiEnabled] = useState(false);
    const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(false);
    const [isCrmRepEnabled, setIsCrmRepEnabled] = useState(false);
    const [chatNaoLidas, setChatNaoLidas] = useState(0);
    const [openSubSectionId, setOpenSubSectionId] = useState(null);

    const toggleSubSection = (id) => {
        setOpenSubSectionId(prev => prev === id ? null : id);
    };

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

        // --- REGRA ESPECIAL: Bloqueios Globais para Não-Masters ---
        // 30=Financeiro, 40/50=Estatísticos/BI, 70=CRM Greenfield
        const masterOnlySections = [30, 70];
        if (masterOnlySections.some(m => indice === m || (indice >= m && indice < m + 10))) {
            return false;
        }

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

        const loadCompanyInfo = async () => {
            try {
                // 1. Tentar pegar do objeto user na sessão (Nome Fantasia vindo do Master DB)
                const userJson = sessionStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    if (user.empresa) {
                        const fullName = user.empresa;
                        const shortName = fullName.includes(' - ')
                            ? fullName.split(' - ')[0].trim()
                            : fullName.length > 25
                                ? fullName.substring(0, 25) + '...'
                                : fullName;
                        setCompanyName(shortName);
                        // Se já pegamos do user, podemos pular o fetch da config da empresa
                        return;
                    }
                }

                // 2. Fallback: buscar na configuração da empresa (Tenant DB)
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/company'));
                const data = await response.json();
                if (data.success && data.config?.nome) {
                    const fullName = data.config.nome;
                    const shortName = fullName.includes(' - ')
                        ? fullName.split(' - ')[0].trim()
                        : fullName.length > 25
                            ? fullName.substring(0, 25) + '...'
                            : fullName;
                    setCompanyName(shortName);
                }
            } catch (error) {
                console.error('Error fetching company info:', error);
            }
        };

        const fetchUserPermissions = async () => {
            try {
                const userJson = sessionStorage.getItem('user');
                if (!userJson) return;
                const user = JSON.parse(userJson);
                setUserName(user.nome || '');

                // Pegar se os módulos estão habilitados para a empresa (definido no login pelo banco Master)
                setIsBiEnabled(user.biEnabled === true);
                setIsWhatsAppEnabled(user.whatsappEnabled === true);
                setIsCrmRepEnabled(user.crmRepEnabled === true);

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
        loadCompanyInfo();
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
                        <p className="text-blue-900/40 text-[11px] font-black tracking-[0.3em] uppercase">
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

                    {isBiEnabled && isMaster && (
                        <NavItem
                            icon={BarChart2}
                            label="Business Intelligence"
                            active={isActive("/bi-intelligence")}
                            onClick={() => navigate("/bi-intelligence")}
                            badge="NEW"
                            badgeClassName="bg-amber-100 text-amber-700 border-amber-200"
                        />
                    )}

                    {/* ESTATISTICOS */}
                    {canAccess(50) && (
                        <NavItem
                            icon={PieChart}
                            label="Central de Estatísticas"
                            active={isActive("/estatisticos")}
                            onClick={() => navigate("/estatisticos")}
                            badge="BI"
                            badgeClassName="bg-pink-100 text-pink-700 font-bold"
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
                    {isProjetos && (
                        <NavItem
                            icon={HardHat}
                            label="Console de Projetos"
                            active={isActive("/projetos/console")}
                            onClick={() => navigate("/projetos/console")}
                            badge="MASTER"
                            badgeClassName="bg-blue-600 text-white border-transparent animate-pulse"
                        />
                    )}
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
                        {canAccess(105) && <NavItem icon={Package} label="Tabela de Preços" active={isActive("/produtos")} onClick={() => navigate("/produtos")} />}

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
                        {canAccess(207) && !isProjetos && (
                            <NavItem
                                icon={ShoppingCart}
                                label="Pedidos de Venda"
                                active={isActive("/pedidos") && location.pathname === "/pedidos"}
                                onClick={() => navigate("/pedidos")}
                            />
                        )}

                        {canAccess(207) && !isProjetos && (
                            <NavItem
                                icon={ShoppingBag}
                                label="Importador Simplificado"
                                active={isActive("/movimentacoes/importador")}
                                onClick={() => navigate("/movimentacoes/importador")}
                                badge="MÁGICO"
                                badgeClassName="bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 shadow-sm"
                            />
                        )}

                        {canAccess(207) && <NavItem icon={Target} label="Campanhas" active={isActive("/vendas/campanhas")} onClick={() => navigate("/vendas/campanhas")} badge="BETA" badgeClassName="bg-purple-100 text-purple-700 font-bold" />}
                        {canAccess(205) && <NavItem icon={FileText} label="Baixa via XML" active={isActive("/movimentacoes/baixa-xml")} onClick={() => navigate("/movimentacoes/baixa-xml")} />}
                        {canAccess(208) && <NavItem icon={TrendingUp} label="SELL-OUT" active={isActive("/movimentacoes/sell-out")} onClick={() => navigate("/movimentacoes/sell-out")} />}
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
                        <NavItem icon={LayoutDashboard} label="Dashboard Hub" active={isActive("/financeiro/dashboard")} onClick={() => navigate("/financeiro/dashboard")} badge="PRO" badgeClassName="bg-blue-100 text-blue-700 font-bold" />
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



                {/* CRM - Módulo unificado */}
                <CollapsibleSection
                    icon={Sparkles}
                    title="CRM"
                    isOpen={openSectionId === 'repcrm'}
                    onToggle={() => handleToggleSection('repcrm')}
                    accentColor="#10B981"
                >
                    {isCrmRepEnabled && <NavItem icon={LayoutDashboard} label="Dashboard CRM" active={isActive("/repcrm/dashboard")} onClick={() => navigate("/repcrm/dashboard")} badge="PRO" badgeClassName="bg-blue-100 text-blue-700 font-bold" />}
                    <NavItem icon={ClipboardCheck} label="Meus Atendimentos" active={isActive("/repcrm/atendimentos")} onClick={() => navigate("/repcrm/atendimentos")} />
                    {isCrmRepEnabled && <NavItem icon={ListChecks} label="Follow-ups" active={isActive("/repcrm/followups")} onClick={() => navigate("/repcrm/followups")} badge="NOVO" badgeClassName="bg-emerald-100 text-emerald-700 font-bold" />}
                    {isCrmRepEnabled && <NavItem icon={Kanban} label="Pipeline" active={isActive("/repcrm/pipeline")} onClick={() => navigate("/repcrm/pipeline")} />}
                    {isCrmRepEnabled && <NavItem icon={Target} label="Gestão de Metas" active={isActive("/repcrm/config")} onClick={() => navigate("/repcrm/config")} />}

                        {isWhatsAppEnabled && (
                            <NavItem
                                icon={MessageCircle}
                                label="WhatsApp IA"
                                active={isActive("/utilitarios/whatsapp-ia")}
                                onClick={() => navigate("/utilitarios/whatsapp-ia")}
                                badge="IA"
                                badgeClassName="bg-emerald-100 text-emerald-700 animate-pulse"
                            />
                        )}
                    </CollapsibleSection>

                {/* RELATÓRIOS */}
                {canAccess(55) && (
                    <CollapsibleSection
                        icon={FileText}
                        title="Relatórios"
                        isOpen={openSectionId === 'relatorios'}
                        onToggle={() => handleToggleSection('relatorios')}
                        accentColor="#F59E0B"
                    >
                        {canAccess(551) && (
                            <div className="mb-1">
                                <button
                                    onClick={() => toggleSubSection('rel_cadastros')}
                                    className="w-full flex items-center gap-2 px-4 py-2 mt-2 hover:bg-slate-200/50 rounded-lg transition-colors group"
                                >
                                    <Database size={14} className={cn("transition-colors", openSubSectionId === 'rel_cadastros' ? "text-blue-600" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic flex-1 text-left", openSubSectionId === 'rel_cadastros' ? "text-blue-700" : "text-slate-500")}>
                                        Cadastros
                                    </span>
                                    <ChevronRight className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", openSubSectionId === 'rel_cadastros' && "rotate-90 text-blue-500")} />
                                </button>

                                <AnimatePresence>
                                    {openSubSectionId === 'rel_cadastros' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-3 border-l border-slate-200 ml-4 mt-1 mb-2 space-y-0.5">
                                                <NavItem
                                                    icon={Printer}
                                                    label="clientes (simplificada)"
                                                    active={isActive("/print/customers-reduced")}
                                                    onClick={() => navigate('/print/customers-reduced')}
                                                />
                                                <NavItem
                                                    icon={Users}
                                                    label="clientes (selecionável)"
                                                    active={isActive("/relatorios/clientes-selecionavel")}
                                                    onClick={() => navigate('/relatorios/clientes-selecionavel')}
                                                />
                                                <NavItem
                                                    icon={FileText}
                                                    label="clientes (ficha)"
                                                    active={isActive("/relatorios/clientes-ficha")}
                                                    onClick={() => navigate('/relatorios/clientes-ficha')}
                                                />
                                                <NavItem
                                                    icon={Building2}
                                                    label="indústrias"
                                                    active={isActive("/relatorios/industrias")}
                                                    onClick={() => navigate('/relatorios/industrias')}
                                                />
                                                <NavItem
                                                    icon={Briefcase}
                                                    label="vendedores"
                                                    active={isActive("/relatorios/vendedores")}
                                                    onClick={() => navigate('/relatorios/vendedores')}
                                                />
                                                <NavItem
                                                    icon={Truck}
                                                    label="transportadoras"
                                                    active={isActive("/relatorios/transportadoras")}
                                                    onClick={() => navigate('/relatorios/transportadoras')}
                                                />
                                                <NavItem
                                                    icon={Tag}
                                                    label="tab. preços (descontos)"
                                                    active={isActive("/relatorios/tabelas-precos-descontos")}
                                                    onClick={() => navigate('/relatorios/tabelas-precos-descontos')}
                                                />
                                                <NavItem
                                                    icon={Tag}
                                                    label="tab. preços (completa)"
                                                    active={isActive("/relatorios/tabelas-precos-completa")}
                                                    onClick={() => navigate('/relatorios/tabelas-precos-completa')}
                                                />
                                                <NavItem
                                                    icon={Tag}
                                                    label="tab. preço (reduzida)"
                                                    active={isActive("/relatorios/tabelas-precos-reduzida")}
                                                    onClick={() => navigate('/relatorios/tabelas-precos-reduzida')}
                                                />
                                                <NavItem
                                                    icon={Tag}
                                                    label="tab. preço (aplicação)"
                                                    active={isActive("/relatorios/tabelas-precos-aplicacao")}
                                                    onClick={() => navigate('/relatorios/tabelas-precos-aplicacao')}
                                                />
                                                <NavItem
                                                    icon={Tag}
                                                    label="tab. preço (impostos)"
                                                    active={isActive("/relatorios/tabelas-precos-impostos")}
                                                    onClick={() => navigate('/relatorios/tabelas-precos-impostos')}
                                                />
                                                <NavItem
                                                    icon={Users}
                                                    label="clientes por indústria"
                                                    active={isActive("/relatorios/clientes-por-industria")}
                                                    onClick={() => navigate('/relatorios/clientes-por-industria')}
                                                />
                                                <NavItem
                                                    icon={Zap}
                                                    label="promoção de produtos"
                                                    active={isActive("/relatorios/promocao-produtos")}
                                                    onClick={() => navigate('/relatorios/promocao-produtos')}
                                                />
                                                <NavItem
                                                    icon={MapPin}
                                                    label="clientes área atuação"
                                                    active={isActive("/relatorios/clientes-area-atuacao")}
                                                    onClick={() => navigate('/relatorios/clientes-area-atuacao')}
                                                />
                                                <NavItem
                                                    icon={UserX}
                                                    label="clientes sem compras"
                                                    active={isActive("/relatorios/clientes-sem-compras")}
                                                    onClick={() => navigate('/relatorios/clientes-sem-compras')}
                                                />
                                                <NavItem
                                                    icon={Map}
                                                    label="clientes por cidade"
                                                    active={isActive("/relatorios/clientes-por-cidade")}
                                                    onClick={() => navigate('/relatorios/clientes-por-cidade')}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {canAccess(552) && (
                            <div className="mb-1">
                                <button
                                    onClick={() => toggleSubSection('rel_movimentacoes')}
                                    className="w-full flex items-center gap-2 px-4 py-2 mt-1 hover:bg-slate-200/50 rounded-lg transition-colors group"
                                >
                                    <ArrowLeftRight size={14} className={cn("transition-colors", openSubSectionId === 'rel_movimentacoes' ? "text-emerald-600" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic flex-1 text-left", openSubSectionId === 'rel_movimentacoes' ? "text-emerald-700" : "text-slate-500")}>
                                        Movimentação
                                    </span>
                                    <ChevronRight className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", openSubSectionId === 'rel_movimentacoes' && "rotate-90 text-emerald-500")} />
                                </button>

                                <AnimatePresence>
                                    {openSubSectionId === 'rel_movimentacoes' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-3 border-l border-slate-200 ml-4 mt-1 mb-2 space-y-0.5">
                                                <NavItem
                                                    icon={Layers}
                                                    label="venda por família"
                                                    active={isActive("/relatorios/vendas-familia")}
                                                    onClick={() => navigate("/relatorios/vendas-familia")}
                                                />
                                                <NavItem
                                                    icon={Boxes}
                                                    label="venda por produto"
                                                    active={isActive("/relatorios/vendas-produto")}
                                                    onClick={() => navigate("/relatorios/vendas-produto")}
                                                />
                                                <NavItem
                                                    icon={Briefcase}
                                                    label="vendas por vendedor/nd."
                                                    active={isActive("/relatorios/vendas-vendedor-industria")}
                                                    onClick={() => navigate("/relatorios/vendas-vendedor-industria")}
                                                />
                                                <NavItem
                                                    icon={Users}
                                                    label="vendas por cliente/ind."
                                                    active={isActive("/relatorios/vendas-cliente-industria")}
                                                    onClick={() => navigate("/relatorios/vendas-cliente-industria")}
                                                />
                                                <NavItem
                                                    icon={Calculator}
                                                    label="vendas período (totais)"
                                                    active={isActive("/relatorios/vendas-periodo-totais")}
                                                    onClick={() => navigate("/relatorios/vendas-periodo-totais")}
                                                />
                                                <NavItem
                                                    icon={MapPin}
                                                    label="vendas por cidade/estado"
                                                    active={isActive("/relatorios/vendas-cidade-estado")}
                                                    onClick={() => navigate("/relatorios/vendas-cidade-estado")}
                                                />
                                                <NavItem
                                                    icon={ClipboardList}
                                                    label="cotações pendentes"
                                                    active={isActive("/relatorios/cotacoes-pendentes")}
                                                    onClick={() => navigate("/relatorios/cotacoes-pendentes")}
                                                />
                                                <NavItem
                                                    icon={Info}
                                                    label="informativo de vendas"
                                                    active={isActive("/relatorios/informativo-vendas")}
                                                    onClick={() => navigate("/relatorios/informativo-vendas")}
                                                />
                                                <NavItem
                                                    icon={UserX}
                                                    label="clientes inativos"
                                                    active={isActive("/relatorios/clientes-inativos")}
                                                    onClick={() => navigate("/relatorios/clientes-inativos")}
                                                />
                                                <NavItem
                                                    icon={Layers}
                                                    label="produtos por grupo/cli."
                                                    active={isActive("/relatorios/produtos-grupo-clientes")}
                                                    onClick={() => navigate("/relatorios/produtos-grupo-clientes")}
                                                />
                                                <NavItem
                                                    icon={Globe}
                                                    label="vendas por região"
                                                    active={isActive("/relatorios/vendas-regiao")}
                                                    onClick={() => navigate("/relatorios/vendas-regiao")}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {canAccess(553) && (
                            <div className="mb-1">
                                <button
                                    onClick={() => toggleSubSection('rel_financeiro')}
                                    className="w-full flex items-center gap-2 px-4 py-2 mt-1 hover:bg-slate-200/50 rounded-lg transition-colors group"
                                >
                                    <DollarSign size={14} className={cn("transition-colors", openSubSectionId === 'rel_financeiro' ? "text-amber-600" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic flex-1 text-left", openSubSectionId === 'rel_financeiro' ? "text-amber-700" : "text-slate-500")}>
                                        Financeiro
                                    </span>
                                    <ChevronRight className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", openSubSectionId === 'rel_financeiro' && "rotate-90 text-amber-500")} />
                                </button>

                                <AnimatePresence>
                                    {openSubSectionId === 'rel_financeiro' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-3 border-l border-slate-200 ml-4 mt-1 mb-2 space-y-0.5">
                                                <NavItem
                                                    icon={CalendarRange}
                                                    label="contas pagar/receber venc."
                                                    active={isActive("/relatorios/financeiro/contas-vencimento")}
                                                    onClick={() => navigate("/relatorios/financeiro/contas-vencimento")}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {canAccess(555) && (
                            <div className="mb-1">
                                <button
                                    onClick={() => toggleSubSection('rel_faturamento')}
                                    className="w-full flex items-center gap-2 px-4 py-2 mt-1 hover:bg-slate-200/50 rounded-lg transition-colors group"
                                >
                                    <TrendingUp size={14} className={cn("transition-colors", openSubSectionId === 'rel_faturamento' ? "text-blue-600" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic flex-1 text-left", openSubSectionId === 'rel_faturamento' ? "text-blue-700" : "text-slate-500")}>
                                        Faturamento
                                    </span>
                                    <ChevronRight className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", openSubSectionId === 'rel_faturamento' && "rotate-90 text-blue-500")} />
                                </button>

                                <AnimatePresence>
                                    {openSubSectionId === 'rel_faturamento' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-3 border-l border-slate-200 ml-4 mt-1 mb-2 space-y-0.5">
                                                <NavItem
                                                    icon={DollarSign}
                                                    label="comissão vendedores"
                                                    active={isActive("/relatorios/comissao-vendedores")}
                                                    onClick={() => navigate("/relatorios/comissao-vendedores")}
                                                />
                                                <NavItem
                                                    icon={Calendar}
                                                    label="faturamento no período"
                                                    active={isActive("/relatorios/faturamento-periodo")}
                                                    onClick={() => navigate("/relatorios/faturamento-periodo")}
                                                />
                                                <NavItem
                                                    icon={CheckCircle2}
                                                    label="pedidos faturados"
                                                    active={isActive("/relatorios/pedidos-faturados-periodo")}
                                                    onClick={() => navigate("/relatorios/pedidos-faturados-periodo")}
                                                />
                                                <NavItem
                                                    icon={Clock}
                                                    label="faturamento pendente"
                                                    active={isActive("/relatorios/faturamento-pendente")}
                                                    onClick={() => navigate("/relatorios/faturamento-pendente")}
                                                />
                                                <NavItem
                                                    icon={PackageX}
                                                    label="produtos não faturados"
                                                    active={isActive("/relatorios/produtos-nao-faturados")}
                                                    onClick={() => navigate("/relatorios/produtos-nao-faturados")}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
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
                        {canAccess(650) && <NavItem icon={MessageSquare} label="Envio de emails" active={isActive("/utilitarios/envio-emails")} onClick={() => navigate("/utilitarios/envio-emails")} />}
                        {canAccess(630) && <NavItem icon={Gamepad2} label="🎮 Tetris" active={isActive("/utilitarios/tetris")} onClick={() => navigate("/utilitarios/tetris")} />}
                        {canAccess(640) && <NavItem icon={Gamepad2} label="🎲 Jogo de Dados" active={isActive("/utilitarios/jogo-dados")} onClick={() => navigate("/utilitarios/jogo-dados")} />}
                        {canAccess(601) && <NavItem icon={Users} label="Usuários do sistema" active={isActive("/utilitarios/usuarios")} onClick={() => navigate("/utilitarios/usuarios")} />}
                        {canAccess(611) && <NavItem icon={Settings} label="Parâmetros" active={isActive("/utilitarios/parametros")} onClick={() => navigate("/utilitarios/parametros")} />}
                        {canAccess(612) && <NavItem icon={Settings} label="Configurações" active={isActive("/utilitarios/configuracoes")} onClick={() => navigate("/utilitarios/configuracoes")} />}
                        <NavItem icon={BookOpen} label="Central de Vídeos" active={isActive("/utilitarios/tutoriais")} onClick={() => navigate("/utilitarios/tutoriais")} badge="VIDEO" badgeClassName="bg-blue-100 text-blue-700" />
                        <NavItem icon={LayoutDashboard} label="Dashboard Legado" active={isActive("/utilitarios/dashboard-legado")} onClick={() => navigate("/utilitarios/dashboard-legado")} />
                        <NavItem icon={ShoppingCart} label="Pedidos (Novo)" active={isActive("/utilitarios/frmGridPedidos")} onClick={() => navigate("/utilitarios/frmGridPedidos")} badge="NOVO" badgeClassName="bg-indigo-100 text-indigo-700 font-bold" />
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
                        <MessageCircle className={cn(
                            "w-5 h-5 transition-transform",
                            chatNaoLidas > 0 ? "text-emerald-400 scale-110 animate-pulse" : "group-hover:scale-110"
                        )} />
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
                    <span className="text-[13px] font-black uppercase tracking-[0.15em]">Sair do Sistema</span>
                </motion.button>

                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-200/60 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                    <div className="relative z-10">
                        <img src={softHamLogo} alt="SoftHam" className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 group-hover:scale-105 transition-transform duration-500" />
                    </div>

                    <div className="flex flex-col overflow-hidden relative z-10">

                        <p className="text-[13px] font-black text-blue-900 truncate tracking-tight" title={companyName}>
                            {companyName || 'Carregando...'}
                        </p>
                        <p className="text-[11px] text-slate-600 font-extrabold tracking-wide mt-0.5">Gestão Inteligente</p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <div className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                dbType === 'local' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            )}>
                                <span className={cn("h-1 w-1 rounded-full animate-pulse", dbType === 'local' ? "bg-amber-500" : "bg-emerald-500")} />
                                {dbType === 'local' ? 'LOCAL' : 'CLOUD'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.aside>
    );
};

export default Sidebar;
