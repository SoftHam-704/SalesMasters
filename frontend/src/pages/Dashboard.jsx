import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ProgressRing } from '../components/dashboard/ProgressRing';
import { ActivityItem } from '../components/dashboard/ActivityItem';
import { YearMonthFilter } from '../components/dashboard/YearMonthFilter';
import { TopClientsCard } from '../components/dashboard/TopClientsCard';
import { IndustryRevenueCard } from '../components/dashboard/IndustryRevenueCard';
import { IndustryParetoCard } from '../components/dashboard/IndustryParetoCard';
import { SalesPerformanceTable } from '../components/dashboard/SalesPerformanceTable';
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
    const currentYear = new Date().getFullYear();


    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(null); // null = ano todo
    const [salesComparison, setSalesComparison] = useState([]);
    const [quantitiesComparison, setQuantitiesComparison] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingQuantities, setLoadingQuantities] = useState(true);
    const [loadingClients, setLoadingClients] = useState(true);
    const [industryRevenue, setIndustryRevenue] = useState([]);
    const [loadingIndustry, setLoadingIndustry] = useState(true);

    useEffect(() => {
        fetchSalesComparison();
        fetchQuantitiesComparison();
        fetchTopClients();
        fetchIndustryRevenue();
    }, [selectedYear, selectedMonth]);

    const fetchSalesComparison = async () => {
        try {
            const previousYear = selectedYear - 1;
            const response = await fetch(`http://localhost:3005/api/dashboard/sales-comparison?anoAtual=${selectedYear}&anoAnterior=${previousYear}`);
            const data = await response.json();
            if (data.success) {
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome.substring(0, 3), // Jan, Fev, etc
                    [selectedYear]: parseFloat(item.vendas_ano_atual) / 1000, // Convert to thousands
                    [previousYear]: parseFloat(item.vendas_ano_anterior) / 1000
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
            const previousYear = selectedYear - 1;
            const response = await fetch(`http://localhost:3005/api/dashboard/quantities-comparison?anoAtual=${selectedYear}&anoAnterior=${previousYear}`);
            const data = await response.json();
            if (data.success) {
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome.substring(0, 3),
                    [selectedYear]: parseFloat(item.quantidade_ano_atual),
                    [previousYear]: parseFloat(item.quantidade_ano_anterior)
                }));
                setQuantitiesComparison(chartData);
            }
        } catch (error) {
            console.error('Erro ao buscar comparação de quantidades:', error);
        } finally {
            setLoadingQuantities(false);
        }
    };

    const fetchTopClients = async () => {
        try {
            setLoadingClients(true);
            const params = new URLSearchParams({
                ano: selectedYear,
                limit: 15
            });

            if (selectedMonth) {
                params.append('mes', selectedMonth);
            }

            const response = await fetch(`http://localhost:3005/api/dashboard/top-clients?${params}`);
            const data = await response.json();

            if (data.success) {
                setTopClients(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar top clientes:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchIndustryRevenue = async () => {
        try {
            setLoadingIndustry(true);
            const params = new URLSearchParams({
                ano: selectedYear
            });

            if (selectedMonth) {
                params.append('mes', selectedMonth);
            }

            const response = await fetch(`http://localhost:3005/api/dashboard/industry-revenue?${params}`);
            const data = await response.json();

            if (data.success) {
                setIndustryRevenue(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar faturamento por indústria:', error);
        } finally {
            setLoadingIndustry(false);
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

            {/* Year/Month Filters */}
            <YearMonthFilter
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
            />

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
                {/* Column 1: Both Line Charts Stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Quantities Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '0.75rem',
                            marginBottom: '0.5rem'
                        }}
                    >
                        <div className="card-header">
                            <h3 className="card-title">Quantidades Vendidas ({selectedYear - 1} vs {selectedYear})</h3>
                            <button className="btn-link">
                                Ver relatório <ArrowRight className="arrow-icon" />
                            </button>
                        </div>
                        <div className="chart-container">
                            {loadingQuantities ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
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
                                            dataKey={selectedYear}
                                            stroke="hsl(280, 70%, 55%)"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorQty2025)"
                                            name={selectedYear.toString()}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedYear - 1}
                                            stroke="hsl(30, 90%, 55%)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#colorQty2024)"
                                            name={(selectedYear - 1).toString()}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Sales Comparison Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '0.75rem'
                        }}
                    >
                        <div className="card-header">
                            <h3 className="card-title">Comparação de Vendas ({selectedYear - 1} vs {selectedYear})</h3>
                            <button className="btn-link-small">Ver detalhes</button>
                        </div>
                        <div className="chart-container" style={{ height: '180px', padding: '10px' }}>
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
                                            dataKey={selectedYear}
                                            stroke="hsl(160, 84%, 39%)"
                                            strokeWidth={2}
                                            fill="url(#color2025)"
                                            fillOpacity={1}
                                            name={selectedYear.toString()}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedYear - 1}
                                            stroke="hsl(220, 70%, 50%)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fill="url(#color2024)"
                                            fillOpacity={1}
                                            name={(selectedYear - 1).toString()}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Sales Performance Table */}
                    <SalesPerformanceTable
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                    />
                </div>

                {/* Column 2: Top 15 Clients */}
                <TopClientsCard
                    clients={topClients}
                    loading={loadingClients}
                />

                {/* Column 3: Industry Revenue + Pareto */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <IndustryRevenueCard
                        data={industryRevenue}
                        loading={loadingIndustry}
                    />
                    <IndustryParetoCard
                        data={industryRevenue}
                        loading={loadingIndustry}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
