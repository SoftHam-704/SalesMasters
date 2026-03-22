import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ProgressRing } from '../components/dashboard/ProgressRing';
import { ActivityItem } from '../components/dashboard/ActivityItem';
import { YearMonthFilter } from '../components/dashboard/YearMonthFilter';
import { TopClientsCard } from '../components/dashboard/TopClientsCard';
import { IndustryRevenueCard } from '../components/dashboard/IndustryRevenueCard';
import { IndustryProductPerformanceCard } from '../components/dashboard/IndustryProductPerformanceCard';
import { SalesPerformanceTable } from '../components/dashboard/SalesPerformanceTable';
import { BirthdayCard } from '../components/dashboard/BirthdayCard';
import DashboardAlertPanel from '../components/dashboard/DashboardAlertPanel';
import RetentionAlertCard from '../components/dashboard/RetentionAlertCard';
import {
    DollarSign,
    Users,
    Target,
    TrendingUp,
    ArrowRight,
    Flame,
    Sparkles,
    Cake
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import './Dashboard.css';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';



const activities = [
    { type: "deal", title: "Negócio fechado!", description: "TechCorp - R$ 45.000", time: "2 min" },
    { type: "call", title: "Ligação com cliente", description: "StartupXYZ - Follow-up", time: "15 min" },
    { type: "meeting", title: "Reunião agendada", description: "Demo produto - Empresa ABC", time: "1h" },
    { type: "goal", title: "Meta atingida!", description: "100% da meta semanal", time: "3h" },
    { type: "email", title: "Proposta enviada", description: "InnovateTech - R$ 28.000", time: "5h" },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null); // null = ano todo
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [industries, setIndustries] = useState([]);
    const [salesComparison, setSalesComparison] = useState([]);
    const [quantitiesComparison, setQuantitiesComparison] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingQuantities, setLoadingQuantities] = useState(true);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingIndustry, setLoadingIndustry] = useState(true);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [industryRevenue, setIndustryRevenue] = useState([]);
    const [userName, setUserName] = useState('Usuário');
    const [userInitials, setUserInitials] = useState('US');
    const [birthdayCount, setBirthdayCount] = useState(0);
    const [birthdays, setBirthdays] = useState([]);
    const [loadingBirthdays, setLoadingBirthdays] = useState(true);

    const [sellOutSummary, setSellOutSummary] = useState(null);
    const [loadingSellOut, setLoadingSellOut] = useState(true);


    const fetchSellOutSummary = async () => {
        try {
            setLoadingSellOut(true);
            const response = await fetch(`${NODE_API_URL}/api/crm/sellout/summary`);
            const data = await response.json();
            if (data.success) {
                setSellOutSummary(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar resumo sell-out:', error);
        } finally {
            setLoadingSellOut(false);
        }
    };

    const fetchBirthdays = async () => {
        try {
            setLoadingBirthdays(true);
            const mesBusca = selectedMonth || new Date().getMonth() + 1;
            const url = getApiUrl(NODE_API_URL, `/api/cli-aniv/birthdays?mes=${mesBusca}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setBirthdayCount(data.data?.length || 0);
                setBirthdays(data.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error);
        } finally {
            setLoadingBirthdays(false);
        }
    };

    useEffect(() => {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                if (user.nome) {
                    setUserName(user.nome);
                    // Gerar iniciais
                    const nome = user.nome || '';
                    const sobrenome = user.sobrenome || '';
                    const initials = (nome.charAt(0) + (sobrenome.charAt(0) || nome.charAt(1) || '')).toUpperCase();
                    setUserInitials(initials);
                }
            } catch (e) {
                console.error('Erro ao ler usuário do sessionStorage', e);
            }
        }
        fetchBirthdays();
        fetchSellOutSummary();
        fetchIndustries();
    }, []);

    const fetchIndustries = async () => {
        try {
            const url = getApiUrl(NODE_API_URL, '/api/aux/industrias');
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setIndustries(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching industries:', error);
        }
    };

    useEffect(() => {
        fetchSalesComparison();
        fetchQuantitiesComparison();
        fetchTopClients();
        fetchIndustryRevenue();
        fetchDashboardMetrics();
    }, [selectedYear, selectedMonth, selectedIndustry]);

    const fetchSalesComparison = async () => {
        try {
            const previousYear = selectedYear - 1;
            const params = new URLSearchParams({
                anoAtual: selectedYear,
                anoAnterior: previousYear
            });
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);

            console.log(`📡 [DASHBOARD] Buscando vendas: ${selectedYear} vs ${previousYear}`);
            const url = getApiUrl(NODE_API_URL, `/api/dashboard/sales-comparison?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                console.log(`✅ [DASHBOARD] Vendas Jan: ${data.data[0]?.vendas_ano_atual} | Fev: ${data.data[1]?.vendas_ano_atual}`);
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome ? item.mes_nome.substring(0, 3) : '???',
                    atual: Number(item.vendas_ano_atual || 0) / 1000,
                    anterior: Number(item.vendas_ano_anterior || 0) / 1000
                }));
                setSalesComparison(chartData);
            } else {
                setSalesComparison([]);
            }
        } catch (error) {
            console.error('❌ [DASHBOARD] Erro ao buscar comparação de vendas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuantitiesComparison = async () => {
        try {
            const previousYear = selectedYear - 1;
            const params = new URLSearchParams({
                anoAtual: selectedYear,
                anoAnterior: previousYear
            });
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/quantities-comparison?${params}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                // Transform data for chart
                const chartData = data.data.map(item => ({
                    mes: item.mes_nome ? item.mes_nome.substring(0, 3) : '???',
                    atual: parseFloat(item.quantidade_ano_atual || 0),
                    anterior: parseFloat(item.quantidade_ano_anterior || 0)
                }));
                setQuantitiesComparison(chartData);
            } else {
                setQuantitiesComparison([]);
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
            if (selectedIndustry) {
                params.append('for_codigo', selectedIndustry);
            }

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/top-clients?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setTopClients(data.data || []);
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
            if (selectedIndustry) {
                params.append('for_codigo', selectedIndustry);
            }

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/industry-revenue?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ [DASHBOARD] Indústrias recebidas:`, data.data?.length || 0);
                setIndustryRevenue(data.data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar faturamento por indústria:', error);
        } finally {
            setLoadingIndustry(false);
        }
    };

    const fetchDashboardMetrics = async () => {
        try {
            setLoadingMetrics(true);
            const params = new URLSearchParams({
                ano: selectedYear
            });

            if (selectedMonth) {
                params.append('mes', selectedMonth);
            }
            if (selectedIndustry) {
                params.append('for_codigo', selectedIndustry);
            }

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/metrics?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ [DASHBOARD] Métricas recebidas:`, data.data);
                setMetrics(data.data || null);
            }
        } catch (error) {
            console.error('Erro ao buscar métricas do dashboard:', error);
        } finally {
            setLoadingMetrics(false);
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
            {/* Welcome Section with Alert Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="welcome-section"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
            >
                <div>
                    <div className="welcome-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h1 className="welcome-title">
                                {getGreeting()}, {userName}!
                            </h1>
                            <motion.span
                                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="wave-emoji"
                            >
                                👋
                            </motion.span>
                        </div>
                    </div>
                    <div className="welcome-subtitle">
                        <Flame className="flame-icon" />
                        <span className="welcome-slogan">Inteligência comercial que guia decisões.</span>
                    </div>
                </div>

                {/* Painel de Alertas + Avatar */}
                <DashboardAlertPanel
                    userName={userName}
                    userInitials={userInitials}
                    onLogout={() => {
                        sessionStorage.clear();
                        navigate('/login');
                    }}
                    onOpenAgenda={() => navigate('/agenda')}
                />
            </motion.div>

            {/* 🚀 RepOne Teaser Banner */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
                    border: '1px solid #2dd4bf33',
                    marginBottom: '0.5rem',
                    width: 'fit-content',
                    cursor: 'default',
                    userSelect: 'none',
                    boxShadow: '0 0 18px #0d948822'
                }}
            >
                {/* Ícone orbital inline */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ flexShrink: 0 }}
                >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="9" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 2" />
                        <text x="7" y="15.5" fontFamily="'Inter',sans-serif" fontWeight="800" fontSize="10" fill="#2dd4bf">R</text>
                    </svg>
                </motion.div>

                {/* Dot pulsante */}
                <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: '#2dd4bf', flexShrink: 0, display: 'block' }}
                />

                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    Em breve o <span style={{ color: '#2dd4bf', fontWeight: 900 }}>SalesMasters</span> irá se chamar{' '}
                    <span style={{ color: '#ffffff', fontWeight: 900, letterSpacing: '0.05em' }}>RepOne</span>
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem' }}>🚀</span>
                </span>
            </motion.div>

            {/* Year/Month Filters */}
            <YearMonthFilter
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedIndustry={selectedIndustry}
                industries={industries}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
                onIndustryChange={setSelectedIndustry}
            />


            {/* Metrics Grid */}
            <div className="metrics-grid">
                <MetricCard
                    title="Aniversariantes (Mês)"
                    value={String(birthdayCount)}
                    icon={Cake}
                    delay={0.05}
                    onClick={() => {
                        const element = document.getElementById('dashboard-birthday-card');
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Highlight effect
                            element.style.boxShadow = '0 0 20px rgba(251, 113, 133, 0.5)';
                            setTimeout(() => {
                                element.style.boxShadow = '';
                            }, 2000);
                        }
                    }}
                    showTrend={false}
                    subtitle="Clique para ver lista"
                    variant="birthday"
                />
                <MetricCard
                    title="Total Vendido"
                    value={loadingMetrics || !metrics ? "..." : `R$ ${parseFloat(metrics.total_vendido_current || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={loadingMetrics || !metrics ? 0 : parseFloat(metrics.vendas_percent_change || 0)}
                    icon={DollarSign}
                    delay={0.1}
                />
                <MetricCard
                    title="Quantidade Vendida"
                    value={loadingMetrics || !metrics ? "..." : Math.round(parseFloat(metrics.quantidade_vendida_current || 0)).toLocaleString('pt-BR')}
                    change={loadingMetrics || !metrics ? 0 : parseFloat(metrics.quantidade_percent_change || 0)}
                    icon={Users}
                    delay={0.2}
                />
                <MetricCard
                    title="Clientes Atendidos"
                    value={loadingMetrics || !metrics ? "..." : String(metrics.clientes_atendidos_current || 0)}
                    change={loadingMetrics || !metrics ? 0 : parseFloat(metrics.clientes_percent_change || 0)}
                    icon={Target}
                    delay={0.3}
                />
                <MetricCard
                    title="Sell-Out (Mês)"
                    value={loadingSellOut || !sellOutSummary ? "..." : `R$ ${parseFloat(sellOutSummary.current_month_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    change={loadingSellOut || !sellOutSummary ? 0 : parseFloat(sellOutSummary.growth || 0)}
                    icon={TrendingUp}
                    delay={0.4}
                    onClick={() => navigate('/movimentacoes/sell-out')}
                    subtitle="Clique para detalhes"
                />

                {(() => {
                    const totalVendido = parseFloat(metrics?.total_vendido_current || 0);
                    const clientesAtendidos = parseFloat(metrics?.clientes_atendidos_current || 0);
                    const ticketMedio = clientesAtendidos > 0 ? totalVendido / clientesAtendidos : 0;

                    // Approximate Ticket Change
                    const sPct = parseFloat(metrics?.vendas_percent_change || 0) / 100;
                    const cPct = parseFloat(metrics?.clientes_percent_change || 0) / 100;
                    // T_change = ((1 + S) / (1 + C)) - 1
                    const tChange = (1 + cPct) !== 0 ? (((1 + sPct) / (1 + cPct)) - 1) * 100 : 0;

                    return (
                        <MetricCard
                            title="Ticket Médio"
                            value={loadingMetrics || !metrics ? "..." : `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            change={loadingMetrics || !metrics ? 0 : tChange}
                            icon={Sparkles}
                            delay={0.5}
                        />
                    );
                })()}
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Column 1: Both Line Charts Stacked */}
                <div className="dashboard-column">
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
                        <div className="chart-container" style={{ height: '200px', width: '100%' }}>
                            {loadingQuantities ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={10}>
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
                                            dataKey="atual"
                                            stroke="hsl(280, 70%, 55%)"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorQty2025)"
                                            name={selectedYear.toString()}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="anterior"
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
                        <div className="chart-container" style={{ height: '200px', width: '100%', padding: '10px' }}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={10}>
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
                                            dataKey="atual"
                                            stroke="hsl(160, 84%, 39%)"
                                            strokeWidth={2}
                                            fill="url(#color2025)"
                                            fillOpacity={1}
                                            name={selectedYear.toString()}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="anterior"
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
                        selectedIndustry={selectedIndustry}
                    />

                    {/* Birthday Card - below Sales Performance */}
                    <div id="dashboard-birthday-card">
                        <BirthdayCard
                            birthdays={birthdays}
                            loading={loadingBirthdays}
                        />
                    </div>
                </div>

                {/* Column 2: Retention Alert + Industry Revenue */}
                <div className="dashboard-column">
                    <RetentionAlertCard />
                    <IndustryRevenueCard
                        data={industryRevenue}
                        loading={loadingIndustry}
                    />
                </div>

                {/* Column 3: Top 15 Clients */}
                <div className="dashboard-column">
                    <TopClientsCard
                        clients={topClients}
                        loading={loadingClients}
                    />
                </div>
            </div>

            {/* Full Width Section */}
            <div className="full-width-section mt-4">
                <IndustryProductPerformanceCard
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    selectedIndustry={selectedIndustry}
                />
            </div>
        </div>
    );
};

export default Dashboard;
