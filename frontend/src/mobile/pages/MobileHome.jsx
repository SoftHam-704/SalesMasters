import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, ShoppingCart, DollarSign, TrendingUp,
    ChevronRight, Clock, Zap, Target, Package
} from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_vendas: 0,
        total_pedidos: 0,
        total_clientes: 0,
        percentual_meta: 72
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tenant = JSON.parse(sessionStorage.getItem('tenantConfig') || '{}');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setError(null);
            const year = new Date().getFullYear();
            const month = new Date().getMonth() + 1;

            // O interceptor injeta automáticamente x-tenant-cnpj e x-tenant-db-config
            // mas enviamos aqui como redundância e para garantir que o interceptor identifique a URL
            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/dashboard/metrics'), {
                params: { ano: year, mes: month }
            });

            if (response.data && response.data.success) {
                setStats(prev => ({
                    ...prev,
                    ...response.data.data
                }));
            } else {
                setError("Falha ao carregar métricas");
            }
        } catch (error) {
            console.error("Erro ao buscar métricas mobile:", error);
            setError("Erro de conexão com o servidor");
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Novo Pedido', icon: ShoppingCart, path: '/pedidos' },
        { label: 'Meus Clientes', icon: Users, path: '/clientes' },
        { label: 'Lançar Sell-Out', icon: DollarSign, path: '/sellout' },
        { label: 'Minhas Metas', icon: TrendingUp, path: '/metas' },
    ];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Executive Dashboard Header */}
            <div className="bg-obsidian border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden emerald-border-glow">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mb-10"></div>

                <div className="relative z-10 flex justify-between items-center mb-8">
                    <div>
                        <p className="text-sage text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Executive Command</p>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                            Olá, <span className="text-primary">{user.nome || 'Vendedor'}</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            <span className="text-sage text-[9px] font-bold uppercase tracking-widest">Live Intelligence</span>
                        </div>
                    </div>
                </div>

                {/* Main Goal Gauge - Tactical Ring */}
                <div className="flex justify-center items-center py-4 relative">
                    <svg className="w-48 h-48 -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <circle
                            cx="96" cy="96" r="88"
                            fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12"
                        />
                        <circle
                            cx="96" cy="96" r="88"
                            fill="transparent"
                            stroke="url(#emeraldGradient)"
                            strokeWidth="12"
                            strokeDasharray={552.9}
                            strokeDashoffset={552.9 * (1 - stats.percentual_meta / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#065f46" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-black text-white leading-none tracking-tighter">{stats.percentual_meta}%</span>
                        <span className="text-sage text-[10px] font-black uppercase tracking-widest mt-1">Efficiency Index</span>
                        <div className="flex items-center gap-1 mt-2 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                            <TrendingUp size={10} className="text-primary" />
                            <span className="text-primary text-[9px] font-black">+2.4%</span>
                        </div>
                    </div>
                </div>

                {/* Minimal Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <p className="text-sage text-[9px] font-black uppercase tracking-widest mb-1">Net Revenue</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-white">{formatCurrency(stats.total_vendas)}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <p className="text-sage text-[9px] font-black uppercase tracking-widest mb-1">Op Margin</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-white">34.2%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message if any */}
            {error && (
                <div className="mx-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest glow-sm">
                    <Zap size={14} className="animate-pulse" /> {error}
                </div>
            )}

            {/* Strategic Intelligence Stream */}
            <div className="emerald-glass p-5 rounded-[2rem] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/20">
                        <Target className="text-primary" size={16} />
                    </div>
                    <h3 className="font-black text-white text-[11px] uppercase tracking-[0.15em]">AI Strategic Forecast</h3>
                    <span className="ml-auto px-2 py-0.5 bg-primary text-obsidian text-[8px] font-black rounded-full uppercase tracking-widest">Priority</span>
                </div>
                <p className="text-sage text-[11px] leading-relaxed">
                    Detected <span className="text-white font-bold">22% increase</span> in sales velocity for <span className="text-primary opacity-80 underline">Enterprise SaaS</span>. Strategic pivot of $250k marketing spend recommended for Q3 peak.
                </p>
                <button className="w-full mt-4 py-3 bg-primary text-obsidian font-black text-[10px] uppercase tracking-[0.2em] rounded-xl active:scale-[0.98] transition-all">
                    Execute Realignment
                </button>
            </div>

            {/* Quick Actions Grid - Tactical Command */}
            <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => navigate(action.path)}
                        className="emerald-glass p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all hover:bg-primary/5 active:emerald-border-glow stagger-1"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg">
                            <action.icon size={26} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-white text-[10px] uppercase tracking-[0.2em]">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Regional Performance - High Density Data */}
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-sage text-[10px] uppercase tracking-[0.2em]">Regional Performance</h3>
                    <button className="text-primary text-[9px] font-black uppercase tracking-widest hover:underline">Detailed View</button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">North America</p>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-white">$8.4M</p>
                            <p className="text-[8px] text-sage font-bold uppercase">88% of Quota</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">Europe (EMEA)</p>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/20" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-white">$4.2M</p>
                            <p className="text-[8px] text-sage font-bold uppercase">62% of Quota</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Footer */}
            <div className="text-center pb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    Engine Online: SaveInCloud Cluster
                </div>
                <p className="text-[8px] text-sage font-bold uppercase mt-2 tracking-widest opacity-40">System Active // {tenant?.cnpj}</p>
            </div>
        </div>
    );
};

export default MobileHome;
