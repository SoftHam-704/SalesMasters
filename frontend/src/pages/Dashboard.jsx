import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ProgressRing } from '../components/dashboard/ProgressRing';
import { ActivityItem } from '../components/dashboard/ActivityItem';
import {
    DollarSign,
    Users,
    Target,
    TrendingUp,
    ArrowRight,
    Flame,
    Sparkles
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { ThemeToggle } from '../components/ThemeToggle';
import './Dashboard.css';



const activities = [
    { type: "deal", title: "Negócio fechado!", description: "TechCorp - R$ 45.000", time: "2 min" },
    { type: "call", title: "Ligação com cliente", description: "StartupXYZ - Follow-up", time: "15 min" },
    { type: "meeting", title: "Reunião agendada", description: "Demo produto - Empresa ABC", time: "1h" },
    { type: "goal", title: "Meta atingida!", description: "100% da meta semanal", time: "3h" },
    { type: "email", title: "Proposta enviada", description: "InnovateTech - R$ 28.000", time: "5h" },
];

const Dashboard = () => {
    const [salesComparison, setSalesComparison] = useState([]);
    const [quantitiesComparison, setQuantitiesComparison] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingQuantities, setLoadingQuantities] = useState(true);

    useEffect(() => {
        fetchSalesComparison();
        fetchQuantitiesComparison();
    }, []);

    const fetchSalesComparison = async () => {
        try {
            const response = await fetch('http://localhost:3005/api/dashboard/sales-comparison?anoAtual=2025&anoAnterior=2024');
            const data = await response.json();
            if (data.success) {
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome.substring(0, 3), // Jan, Fev, etc
                    '2025': parseFloat(item.vendas_ano_atual) / 1000, // Convert to thousands
                    '2024': parseFloat(item.vendas_ano_anterior) / 1000
                }));
                setSalesComparison(chartData);
            }
        } catch (error) {
            console.error('Erro ao buscar comparação de vendas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuantitiesComparison = async () => {
        try {
            const response = await fetch('http://localhost:3005/api/dashboard/quantities-comparison?anoAtual=2025&anoAnterior=2024');
            const data = await response.json();
            if (data.success) {
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome.substring(0, 3),
                    '2025': parseFloat(item.quantidade_ano_atual),
                    '2024': parseFloat(item.quantidade_ano_anterior)
                }));
                setQuantitiesComparison(chartData);
            }
        } catch (error) {
            console.error('Erro ao buscar comparação de quantidades:', error);
        } finally {
            setLoadingQuantities(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div className="dashboard-lovable-page">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="welcome-section"
            >
                <div className="welcome-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h1 className="welcome-title">
                            {getGreeting()}, João!
                        </h1>
                        <motion.span
                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="wave-emoji"
                        >
                            👋
                        </motion.span>
                        <ThemeToggle />
                    </div>
                </div>
                <div className="welcome-subtitle">
                    <Flame className="flame-icon" />
                    <span className="streak-text">12 dias de sequência!</span>
                    <span className="separator">·</span>
                    <span>Você está no top 5% dos vendedores esta semana</span>
                    <Sparkles className="sparkles-icon" />
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <MetricCard
                    title="Vendas do Mês"
                    value="R$ 127.450"
                    change={23.5}
                    icon={DollarSign}
                    delay={0.1}
                />
                <MetricCard
                    title="Novos Clientes"
                    value="48"
                    change={12.3}
                    icon={Users}
                    delay={0.2}
                />
                <MetricCard
                    title="Taxa de Conversão"
                    value="34.2%"
                    change={8.1}
                    icon={Target}
                    delay={0.3}
                />
                <MetricCard
                    title="Ticket Médio"
                    value="R$ 2.655"
                    change={-2.4}
                    icon={TrendingUp}
                    delay={0.4}
                />
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="chart-card"
                >
                    <div className="card-header">
                        <h3 className="card-title">Quantidades Vendidas (2024 vs 2025)</h3>
                        <button className="btn-link">
                            Ver relatório <ArrowRight className="arrow-icon" />
                        </button>
                    </div>
                    <div className="chart-container">
                        {loadingQuantities ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={quantitiesComparison}>
                                    <defs>
                                        <linearGradient id="colorQty2025" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorQty2024" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(30, 90%, 55%)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="hsl(30, 90%, 55%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="mes"
                                        stroke="var(--text-secondary)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => value.toLocaleString()}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-card)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                        }}
                                        labelStyle={{ color: "var(--text-primary)" }}
                                        formatter={(value) => [`${value.toLocaleString()} unidades`, ""]}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '10px' }}
                                        iconType="line"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="2025"
                                        stroke="hsl(280, 70%, 55%)"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorQty2025)"
                                        name="2025"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="2024"
                                        stroke="hsl(30, 90%, 55%)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fillOpacity={1}
                                        fill="url(#colorQty2024)"
                                        name="2024"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Goal Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="goal-card"
                >
                    <div className="card-header">
                        <h3 className="card-title">
                            <Target className="title-icon" />
                            Meta Mensal
                        </h3>
                    </div>
                    <div className="goal-content">
                        <ProgressRing
                            progress={78}
                            label="da meta"
                            sublabel="R$ 127.450 / R$ 163.500"
                        />
                        <div className="goal-details">
                            <div className="goal-detail-item">
                                <span>Faltam</span>
                                <strong>R$ 36.050</strong>
                            </div>
                            <div className="goal-detail-item">
                                <span>Dias restantes</span>
                                <strong>8 dias</strong>
                            </div>
                        </div>
                        <button className="btn-primary-full">Ver Oportunidades</button>
                    </div>
                </motion.div>

                {/* Sales Comparison Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="activity-card"
                >
                    <div className="card-header">
                        <h3 className="card-title">Comparação de Vendas (2024 vs 2025)</h3>
                        <button className="btn-link-small">Ver detalhes</button>
                    </div>
                    <div className="chart-container" style={{ height: '280px', padding: '20px 10px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesComparison}>
                                    <defs>
                                        <linearGradient id="color2025" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="color2024" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="mes"
                                        stroke="var(--text-secondary)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-card)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                        }}
                                        labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                                        formatter={(value) => [`R$ ${(value * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '10px' }}
                                        iconType="line"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="2025"
                                        stroke="hsl(160, 84%, 39%)"
                                        strokeWidth={2}
                                        fill="url(#color2025)"
                                        fillOpacity={1}
                                        name="2025"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="2024"
                                        stroke="hsl(220, 70%, 50%)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fill="url(#color2024)"
                                        fillOpacity={1}
                                        name="2024"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="quick-actions-card"
                >
                    <div className="card-header">
                        <h3 className="card-title">Ações Rápidas</h3>
                    </div>
                    <div className="quick-actions-list">
                        <button className="quick-action-btn">
                            <div className="quick-action-icon users">
                                <Users size={16} />
                            </div>
                            Adicionar Cliente
                        </button>
                        <button className="quick-action-btn">
                            <div className="quick-action-icon sales">
                                <DollarSign size={16} />
                            </div>
                            Registrar Venda
                        </button>
                        <button className="quick-action-btn">
                            <div className="quick-action-icon target">
                                <Target size={16} />
                            </div>
                            Criar Oportunidade
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
