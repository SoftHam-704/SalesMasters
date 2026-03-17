import React, { useState } from 'react';
import {
    BarChart3,
    Users,
    BarChart2,
    ArrowLeftRight,
    Building2,
    Package,
    Calendar,
    ShoppingCart,
    UserX,
    FilePieChart,
    PieChart,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Importação das Páginas Estatísticas
import Mapa3AnosPage from './Mapa3AnosPage';
import ItensNuncaCompradosPage from './ItensNuncaCompradosPage';
import PivotReportPage from './PivotReportPage';
import ClientIndustryMapPage from './ClientIndustryMapPage';
import SelloutPeriodPage from './SelloutPeriodPage';
import ClientesMoMPage from './ClientesMoMPage';
import ComparativoClientesPage from './ComparativoClientesPage';
import GrupoLojasPage from './GrupoLojasPage';
import MapaClienteGeralPage from './MapaClienteGeralPage';
import MapaQuantidadePage from './MapaQuantidadePage';
import ProdutosUnicaCompraPage from './ProdutosUnicaCompraPage';
import UltimasComprasPage from './UltimasComprasPage';
import InactiveClientsPage from './InactiveClientsPage';
import MapaMensalItemPage from './MapaMensalItemPage';

import ClosePageButton from '../../components/common/ClosePageButton';

const REPORTS = [
    { id: 'mapa-vendas', label: 'Mapa de Vendas', icon: BarChart3, component: PivotReportPage, props: { reportType: 'vendas' } },
    { id: 'sellout-periodo', label: 'Sellout Período', icon: Calendar, component: SelloutPeriodPage },
    { id: 'mapa-cli-ind', label: 'Mapa Cli/Indústria', icon: Users, component: ClientIndustryMapPage },
    { id: 'clientes-mom', label: 'Clientes MoM', icon: BarChart2, component: ClientesMoMPage },
    { id: 'mapa-mensal-item', label: 'Mapa Mensal de Itens', icon: FilePieChart, component: MapaMensalItemPage },
    { id: 'comparativo', label: 'Comparativo Clientes', icon: ArrowLeftRight, component: ComparativoClientesPage },
    { id: 'grupo-lojas', label: 'Grupo de Lojas', icon: Building2, component: GrupoLojasPage },
    { id: 'itens-nunca', label: 'Itens Nunca Comprados', icon: Package, component: ItensNuncaCompradosPage },
    { id: 'mapa-3-anos', label: 'Mapa 3 Anos', icon: Calendar, component: Mapa3AnosPage },
    { id: 'mapa-quantidade', label: 'Mapa Quantidade', icon: FilePieChart, component: MapaQuantidadePage },
    { id: 'ultimas-compras', label: 'Últimas Compras', icon: ShoppingCart, component: UltimasComprasPage },
    { id: 'clientes-inativos', label: 'Clientes Inativos', icon: UserX, component: InactiveClientsPage },
    { id: 'prod-unica', label: 'Prod Única Compra', icon: Package, component: ProdutosUnicaCompraPage },
];

export default function FrmEstatisticos() {
    const [activeTab, setActiveTab] = useState(REPORTS[0].id);

    const activeReport = REPORTS.find(r => r.id === activeTab);
    const ActiveComponent = activeReport.component;

    return (
        <div className="h-full flex flex-col bg-stone-50/30 overflow-hidden font-sans">
            {/* HUB HEADER - AURA v2.0 DESIGN */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-6 py-4 z-30 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-transform duration-300">
                                <PieChart className="w-5 h-5 !text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-stone-900 tracking-tight">Central de Estatísticas</h1>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    <span>Business Intelligence</span>
                                    <ChevronRight size={10} />
                                    <span className="text-emerald-600">{activeReport.label}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group mr-4 hidden md:block">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors">
                                    <Search size={14} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Pesquisar relatório..."
                                    className="bg-stone-100/50 border border-stone-200 rounded-full py-2 pl-9 pr-4 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all"
                                />
                            </div>
                            <ClosePageButton />
                        </div>
                    </div>

                    {/* TABS SCROLLER */}
                    <div className="flex items-center w-full gap-2 overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
                        {REPORTS.map((report) => {
                            const isActive = activeTab === report.id;

                            return isActive ? (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveTab(report.id)}
                                    className="relative flex-shrink-0 px-[2px] py-[2px] rounded-xl group overflow-hidden transition-all duration-300 scale-[1.02] shadow-md shadow-stone-200"
                                >
                                    {/* Orbital Gradient Background for Active State */}
                                    <div className="absolute inset-[-2px] z-0 bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#10b981_50%,#e2e8f0_100%)] animate-[spin_4s_linear_infinite]" />

                                    {/* Inner Button Content */}
                                    <div className="relative z-10 flex items-center justify-center w-full h-full gap-2 px-4 py-2 bg-gradient-to-br from-emerald-600 to-teal-700 border border-white/10 rounded-[10px] text-[11px] font-bold tracking-wider !text-white uppercase whitespace-nowrap shadow-inner">
                                        <report.icon size={14} className="!text-white" />
                                        <span className="!text-white">{report.label}</span>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveTab(report.id)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 bg-stone-100/80 text-stone-500 hover:bg-stone-200/80 hover:text-stone-900 border border-transparent flex-shrink-0"
                                >
                                    <report.icon size={14} className="text-stone-400" />
                                    <span>{report.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - THE "GROUPBOX" */}
            <div className="flex-1 overflow-hidden relative p-4 lg:p-6 bg-[#fdfdfd]">
                <div className="h-full w-full bg-white border border-stone-200/80 rounded-[32px] overflow-hidden shadow-2xl shadow-stone-100 flex flex-col relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="h-full w-full"
                        >
                            <ActiveComponent {...(activeReport.props || {})} isSubComponent={true} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}
