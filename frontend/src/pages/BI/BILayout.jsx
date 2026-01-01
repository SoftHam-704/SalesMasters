import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, BarChart2, TrendingUp,
    Target, UserCircle, Package, RefreshCw, Zap, Calendar
} from 'lucide-react';
import { BIFiltersProvider, useBIFilters } from '../../contexts/BIFiltersContext';

const BILayoutContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { filters, updateFilters } = useBIFilters();
    const [loading, setLoading] = useState(false);

    const months = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'VISÃO GERAL', path: '/bi-python/visao-geral', color: '#10B981' },
        { icon: <Building2 size={20} />, label: 'INDÚSTRIAS', path: '/bi-python/industrias', color: '#10B981' },
        { icon: <Users size={20} />, label: 'CLIENTES', path: '/bi-python/clientes', color: '#3B82F6' },
        { icon: <BarChart2 size={20} />, label: 'ESTATÍSTICAS', path: '/bi-python/estatisticas', color: '#6366F1' },
        { icon: <TrendingUp size={20} />, label: 'CURVA ABC', path: '/bi-python/curva-abc', color: '#F59E0B' },
        { icon: <Target size={20} />, label: 'METAS', path: '/bi-python/metas', color: '#EC4899' },
        { icon: <UserCircle size={20} />, label: 'EQUIPE', path: '/bi-python/equipe', color: '#8B5CF6' },
        { icon: <Package size={20} />, label: 'PRODUTOS', path: '/bi-python/produtos', color: '#F43F5E' },
    ];

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-8 relative overflow-x-hidden">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#009EDF] rounded-2xl flex items-center justify-center p-2.5 shadow-lg shadow-blue-200">
                        <Zap className="text-white fill-white" />
                    </div>
                    <div className="flex items-center gap-3 h-12">
                        <h1 className="text-2xl font-bold text-[#1E293B]">BI Intelligence</h1>
                        <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Premium</span>
                        <span className="border border-gray-300 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-md uppercase">V2.0 Advanced</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                        <select
                            value={filters.mes}
                            onChange={(e) => updateFilters({ mes: e.target.value })}
                            className="bg-transparent text-sm font-bold text-[#334155] border-none focus:ring-0 cursor-pointer py-1 pl-3 pr-8 outline-none"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <select
                            value={filters.ano}
                            onChange={(e) => updateFilters({ ano: e.target.value })}
                            className="bg-transparent text-sm font-bold text-[#334155] border-none focus:ring-0 cursor-pointer py-1 pl-3 pr-8 outline-none"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="ml-2 hover:rotate-180 transition-transform duration-500"
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="text-right space-y-0.5">
                        <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Status do Sistema</p>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-[#1E293B] font-extrabold text-xs">Real-time Data</span>
                            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse shadow-sm shadow-green-200"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slogan Section - Left Aligned */}
            <div className="border border-gray-100 rounded-xl px-4 py-2 bg-white max-w-xl shadow-sm mb-8">
                <p className="text-gray-500 italic text-sm">
                    "Dados transformados em vantagem competitiva. Onde outros veem números, você visualiza estratégias."
                </p>
            </div>

            {/* Tab Content Area (Outlet for nested routes) */}
            <Outlet />

            {/* Menu Bar - Above Footer */}
            <div className="flex justify-center mb-6">
                <div className="bg-white rounded-full px-6 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center gap-3">
                    {navItems.map((item, i) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={i}
                                onClick={() => navigate(item.path)}
                                className={`group px-10 py-2.5 rounded-full flex items-center gap-4 transition-all duration-300 ${isActive
                                    ? 'bg-[#0F172A] text-white shadow-xl shadow-slate-200'
                                    : 'hover:bg-slate-50 text-slate-500'
                                    }`}
                            >
                                <div className="transition-transform duration-300 group-hover:scale-110" style={{ color: isActive ? 'white' : item.color }}>
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <p className={`text-[11px] font-bold tracking-wider whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                        {item.label}
                                    </p>
                                    <p className={`text-[8px] font-black tracking-[0.15em] ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                                        EXPLORAR
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-8 border-t border-gray-100 flex justify-between items-center text-[11px] tracking-widest uppercase">
                <div className="flex gap-8 font-bold text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></div>
                        <span>Sincronizado: 30/12/2025, 15:47</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full"></div>
                        <span>Base de Dados: Firebird + Postgres</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="h-px w-24 bg-gray-200"></div>
                    <span className="font-extrabold text-[#94A3B8]">
                        SALESMASTERS <span className="text-[#10B981]">AI ENGINE</span> BY <span className="text-[#009EDF] text-sm">SOFTHAM</span>
                    </span>
                    <div className="h-px w-24 bg-gray-200"></div>
                </div>
            </div>
        </div>
    );
};

const BILayout = () => {
    return (
        <BIFiltersProvider>
            <BILayoutContent />
        </BIFiltersProvider>
    );
};

export default BILayout;
