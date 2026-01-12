import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Factory, BarChart3, Target, BookOpen,
    Settings, LogOut, ChevronRight, HelpCircle, History
} from 'lucide-react';

const MobileMenu = () => {
    const navigate = useNavigate();

    const menuSections = [
        {
            title: 'Operacional',
            items: [
                { label: 'Indústrias (Representadas)', icon: Factory, color: 'text-blue-600', bg: 'bg-blue-50', path: '/industrias' },
                { label: 'Histórico de Pedidos', icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/pedidos/historico' },
                { label: 'Lançar Sell-Out', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/sellout' },
            ]
        },
        {
            title: 'Desempenho',
            items: [
                { label: 'Minhas Metas', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', path: '/metas' },
                { label: 'Minhas Interações (CRM)', icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50', path: '/crm' },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Ajuda e Suporte', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-100', path: '/ajuda' },
                { label: 'Configurações', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100', path: '/config' },
            ]
        }
    ];

    const handleLogout = () => {
        if (window.confirm("Deseja sair do sistema?")) {
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <h1 className="text-2xl font-bold text-gray-800 px-1">Menu</h1>

            {menuSections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">
                        {section.title}
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        {section.items.map((item, itemIdx) => (
                            <button
                                key={itemIdx}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                                        <item.icon size={22} />
                                    </div>
                                    <span className="font-semibold text-gray-700">{item.label}</span>
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 active:bg-red-100 transition-colors mt-4"
            >
                <LogOut size={20} /> Sair do Sistema
            </button>

            <div className="text-center text-gray-300 text-[10px] font-medium mt-10">
                SALESMASTERS PROFESSIONAL V2.5<br />
                SOFT HAM SISTEMAS © 2026
            </div>
        </div>
    );
};

export default MobileMenu;
