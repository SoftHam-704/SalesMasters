import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Award, Calendar, ChevronRight } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileGoals = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            // NOTE: In a real scenario, fetch this from /api/bi/metas or similar
            // Simulating API response for now to demonstrate UI
            const user = JSON.parse(sessionStorage.getItem('user'));

            // Simulating a delay
            await new Promise(r => setTimeout(r, 800));

            setStats({
                financial: { current: 85400, target: 120000, label: 'Faturamento' },
                positivacao: { current: 45, target: 60, label: 'Positivação (Clientes)' },
                mix: { current: 120, target: 150, label: 'Mix de Produtos' },
                projection: 115000,
                daysLeft: 12
            });
        } catch (error) {
            console.error("Erro ao carregar metas:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (current, target) => {
        return Math.min(Math.round((current / target) * 100), 100);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-gray-400">
                <div className="animate-pulse flex flex-col items-center">
                    <Target size={48} className="mb-4 opacity-50" />
                    <span className="text-sm">Calculando sua performance...</span>
                </div>
            </div>
        );
    }

    const mainProgress = calculateProgress(stats?.financial.current, stats?.financial.target);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header com Gradiente Motivacional */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-5"></div>

                <div className="relative z-10 text-center">
                    <h1 className="text-lg font-medium opacity-90 mb-1">Desempenho Geral</h1>
                    <div className="text-5xl font-bold mb-2 tracking-tight">
                        {mainProgress}%
                    </div>
                    <p className="text-sm opacity-75">da meta mensal atingida</p>
                </div>
            </div>

            {/* Cards de Metas - Sobrepondo o Header */}
            <div className="px-4 -mt-8 relative z-20 space-y-4">

                {/* Card Principal - Financeiro */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Faturamento</h3>
                                <p className="text-xs text-gray-400">Objetivo: {formatCurrency(stats.financial.target)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-green-600">{formatCurrency(stats.financial.current)}</span>
                        </div>
                    </div>
                    {/* Barra de Progresso Customizada */}
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${mainProgress}%` }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30"></div>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-gray-500 font-medium">
                        <span>Hoje</span>
                        <span className={stats.projection < stats.financial.target ? "text-orange-500" : "text-blue-500"}>
                            Projeção: {formatCurrency(stats.projection)}
                        </span>
                    </div>
                </div>

                {/* Grid para Metas Secundárias */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Positivação */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                                <Users size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">Positivação</span>
                        </div>

                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold text-gray-800">{stats.positivacao.current}</span>
                            <span className="text-xs text-gray-400 mb-1">/ {stats.positivacao.target}</span>
                        </div>

                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${calculateProgress(stats.positivacao.current, stats.positivacao.target)}%` }}></div>
                        </div>
                    </div>

                    {/* Mix */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md">
                                <Award size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">Mix Total</span>
                        </div>

                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold text-gray-800">{stats.mix.current}</span>
                            <span className="text-xs text-gray-400 mb-1">/ {stats.mix.target}</span>
                        </div>

                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${calculateProgress(stats.mix.current, stats.mix.target)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Banner de Incentivo */}
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Faltam {stats.daysLeft} dias</p>
                            <p className="text-xs text-orange-600 font-medium">Acelera que dá tempo!</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-orange-300" />
                </div>
            </div>
        </div>
    );
};

export default MobileGoals;
