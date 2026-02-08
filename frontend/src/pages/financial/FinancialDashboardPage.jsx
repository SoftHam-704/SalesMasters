import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle,
    TrendingUp,
    Plus,
    FileText,
    Banknote,
    ArrowRight,
    Calendar,
    Filter
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar
} from 'recharts';
import { MetricCard } from '../../components/dashboard/MetricCard';
import '../Dashboard.css';
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { useNavigate } from 'react-router-dom';

const FinancialDashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        receber: { vencido: 0, hoje: 0, prox_7_dias: 0 },
        pagar: { vencido: 0, hoje: 0, prox_7_dias: 0 },
        grafico: [],
        saldo_atual: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const url = getApiUrl(NODE_API_URL, '/api/financeiro/dashboard/summary');
            const response = await axios.get(url);
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do dashboard financeiro:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xl">
                    <p className="text-slate-900 font-bold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen space-y-6 overflow-auto custom-scrollbar">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Hub</h1>
                    <p className="text-slate-500 font-medium">Gestão inteligente e saúde financeira em tempo real.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/financeiro/receber')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all whitespace-nowrap"
                    >
                        <Plus size={18} /> Novo Recebimento
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/financeiro/pagar')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all whitespace-nowrap"
                    >
                        <Plus size={18} /> Novo Pagamento
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/financeiro/relatorios/fluxo-caixa')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all whitespace-nowrap"
                    >
                        <FileText size={18} /> Fluxo Completo
                    </motion.button>
                </div>
            </div>

            {/* Grid de KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Previsão de Saldo (Hoje)"
                    value={loading ? "..." : formatCurrency(data.saldo_atual)}
                    icon={Wallet}
                    variant="financial"
                    subtitle="Considerando vencidos + hoje"
                    delay={0.1}
                />
                <MetricCard
                    title="A Receber (Total Aberto)"
                    value={loading ? "..." : formatCurrency(data.receber.vencido + data.receber.hoje + data.receber.prox_7_dias)}
                    icon={ArrowUpCircle}
                    variant="revenue"
                    subtitle={`${formatCurrency(data.receber.vencido)} vencidos`}
                    delay={0.2}
                />
                <MetricCard
                    title="A Pagar (Total Aberto)"
                    value={loading ? "..." : formatCurrency(data.pagar.vencido + data.pagar.hoje + data.pagar.prox_7_dias)}
                    icon={ArrowDownCircle}
                    variant="expense"
                    subtitle={`${formatCurrency(data.pagar.vencido)} vencidos`}
                    delay={0.3}
                />
                <MetricCard
                    title="Alerta de Inadimplência"
                    value={loading ? "..." : formatCurrency(data.receber.vencido)}
                    icon={AlertCircle}
                    variant="birthday"
                    subtitle="Total em atraso no receber"
                    delay={0.4}
                />
            </div>

            {/* Conteúdo Principal: Gráficos e Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Gráfico de Evolução Mensal */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Evolução de Fluxo (6 Meses)</h3>
                            <p className="text-sm text-slate-500 font-medium">Comparativo mensal entre Receitas e Despesas.</p>
                        </div>
                        <TrendingUp className="text-blue-500" />
                    </div>

                    <div className="h-[350px] w-full">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <span className="text-slate-400 animate-pulse">Carregando gráfico...</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.grafico}>
                                    <defs>
                                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        tickFormatter={(val) => `R$${val / 1000}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" />
                                    <Area
                                        type="monotone"
                                        dataKey="receitas"
                                        name="Receitas"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorReceitas)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="despesas"
                                        name="Despesas"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorDespesas)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Widgets Laterais */}
                <div className="space-y-6">

                    {/* Próximas Contas a Pagar */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Atenção no Pagar</h3>
                            <button onClick={() => navigate('/financeiro/pagar')} className="text-blue-500 hover:text-blue-700 transition-colors">
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-600 text-white rounded-lg">
                                        <AlertCircle size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-rose-900 uppercase">Vencidos</p>
                                        <p className="text-lg font-black text-rose-600">{formatCurrency(data.pagar.vencido)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-600 text-white rounded-lg">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-amber-900 uppercase">Vence Hoje</p>
                                        <p className="text-lg font-black text-amber-600">{formatCurrency(data.pagar.hoje)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-600 text-white rounded-lg">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">Próx. 7 Dias</p>
                                        <p className="text-lg font-black text-slate-800">{formatCurrency(data.pagar.prox_7_dias)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Próximas Contas a Receber */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Fluxo de Recebimento</h3>
                            <button onClick={() => navigate('/financeiro/receber')} className="text-blue-500 hover:text-blue-700 transition-colors">
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                        <Banknote size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 uppercase">Hoje + Vencidos</p>
                                        <p className="text-lg font-black text-emerald-600">{formatCurrency(data.receber.vencido + data.receber.hoje)}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-tighter italic">
                                Use as ações rápidas para baixar títulos recebidos
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FinancialDashboardPage;
