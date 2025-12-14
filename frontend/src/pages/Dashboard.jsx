import React from 'react';
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const chartData = [
    { name: "Jan", value: 4000 },
    { name: "Fev", value: 3000 },
    { name: "Mar", value: 5000 },
    { name: "Abr", value: 4500 },
    { name: "Mai", value: 6000 },
    { name: "Jun", value: 5500 },
    { name: "Jul", value: 7000 },
];

const activities = [
    { type: "deal", title: "Negócio fechado!", description: "TechCorp - R$ 45.000", time: "2 min" },
    { type: "call", title: "Ligação com cliente", description: "StartupXYZ - Follow-up", time: "15 min" },
    { type: "meeting", title: "Reunião agendada", description: "Demo produto - Empresa ABC", time: "1h" },
    { type: "goal", title: "Meta atingida!", description: "100% da meta semanal", time: "3h" },
    { type: "email", title: "Proposta enviada", description: "InnovateTech - R$ 28.000", time: "5h" },
];

const Dashboard = () => {
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
                        <h3 className="card-title">Performance de Vendas</h3>
                        <button className="btn-link">
                            Ver relatório <ArrowRight className="arrow-icon" />
                        </button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
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
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--bg-card)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                    }}
                                    labelStyle={{ color: "var(--text-primary)" }}
                                    formatter={(value) => [`R$ ${value.toLocaleString()}`, "Vendas"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(160, 84%, 39%)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
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

                {/* Activity Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="activity-card"
                >
                    <div className="card-header">
                        <h3 className="card-title">Atividade Recente</h3>
                        <button className="btn-link-small">Ver tudo</button>
                    </div>
                    <div className="activity-list">
                        {activities.map((activity, index) => (
                            <ActivityItem
                                key={index}
                                {...activity}
                                delay={0.1 * index}
                            />
                        ))}
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
