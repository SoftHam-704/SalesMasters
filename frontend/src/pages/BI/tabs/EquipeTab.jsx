import React, { useState, useEffect, useMemo } from 'react';
// import { useBIFilters } from '../../../contexts/BIFiltersContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Users, TrendingUp, Target, AlertTriangle, Trophy, CheckCircle, XCircle, Phone, Mail, MapPin, MessageCircle, Sparkles, ChevronDown } from 'lucide-react';
import './EquipeTab.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = import.meta.env.VITE_BI_API_URL || 'http://localhost:8000';

const EquipeTab = ({ filters }) => {
    // const { filters } = useBIFilters(); // Removido para usar prop vinda do IntelligencePage
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState([]);
    const [selectedVendedor, setSelectedVendedor] = useState(null);
    const [iaInsights, setIaInsights] = useState(null);
    const [vendedores, setVendedores] = useState([]);

    const metricMonth = useMemo(() => {
        const monthMap = {
            'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
            'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
            'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
        };
        return monthMap[filters?.mes] || new Date().getMonth() + 1;
    }, [filters?.mes]);

    // Fetch vendedores list
    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const response = await fetch(`${API_URL}/api/equipe/vendedores`);
                const data = await response.json();
                if (data.success) {
                    setVendedores(data.data || []);
                }
            } catch (error) {
                console.error('Erro ao buscar vendedores:', error);
            }
        };
        fetchVendedores();
    }, []);

    // Fetch performance data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const url = `${API_URL}/api/equipe/performance?ano=${filters.ano}&mes=${metricMonth}${selectedVendedor ? `&vendedor=${selectedVendedor}` : ''}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    setPerformance(data.data || []);
                    // Auto-select first vendedor for IA insights
                    if (data.data?.length > 0 && !selectedVendedor) {
                        fetchIAInsights(data.data[0].vendedor_codigo);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar performance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters.ano, metricMonth, selectedVendedor]);

    const fetchIAInsights = async (vendedorId) => {
        try {
            const response = await fetch(`${API_URL}/api/equipe/ia-insights?vendedor=${vendedorId}&ano=${filters.ano}&mes=${metricMonth}`);
            const data = await response.json();
            if (data.success) {
                setIaInsights(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar IA insights:', error);
            // Use mock data for testing
            setIaInsights(getMockInsights());
        }
    };

    const getMockInsights = () => ({
        recomendacoes: [
            {
                prioridade: 1,
                tipo: 'cliente_em_risco',
                titulo: 'Cliente VIP em risco crítico',
                descricao: 'Cliente importante sem comprar há mais de 60 dias.',
                acao: 'Agendar visita presencial nos próximos 3 dias.',
                impacto_estimado: 'R$ 285.000'
            },
            {
                prioridade: 2,
                tipo: 'oportunidade',
                titulo: 'Oportunidade de upsell',
                descricao: 'Cliente em forte crescimento.',
                acao: 'Apresentar linha premium de produtos.',
                impacto_estimado: 'R$ 120.000'
            }
        ],
        previsao: {
            valor_estimado: 20100000,
            probabilidade_bater_meta: 92,
            tendencia: 'crescente'
        }
    });

    // Calculate KPIs
    const kpis = useMemo(() => {
        if (!performance.length) return null;

        const totalVendas = performance.reduce((sum, v) => sum + Number(v.total_vendas_mes || 0), 0);
        const totalMeta = performance.reduce((sum, v) => sum + Number(v.meta_mes || 0), 0);
        const totalClientesRisco = performance.reduce((sum, v) => sum + Number(v.clientes_perdidos || 0), 0);
        const avgTicket = performance.reduce((sum, v) => sum + Number(v.ticket_medio || 0), 0) / performance.length;
        const percMeta = totalMeta > 0 ? (totalVendas / totalMeta * 100) : 0;
        const variacao = performance.reduce((sum, v) => sum + Number(v.variacao_mom_percent || 0), 0) / performance.length;

        return {
            totalVendas,
            avgTicket,
            percMeta,
            totalClientesRisco,
            variacao
        };
    }, [performance]);

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0';
        if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `R$ ${(value / 1000).toFixed(0)}K`;
        }
        return `R$ ${value.toFixed(0)}`;
    };

    const getRankingBadgeClass = (ranking) => {
        switch (ranking) {
            case 1: return 'ranking-1';
            case 2: return 'ranking-2';
            case 3: return 'ranking-3';
            default: return 'ranking-other';
        }
    };

    const getStatusBadge = (status) => {
        if (!status) return { class: 'badge-info', icon: '📊', text: 'N/A' };
        if (status.includes('Acima')) return { class: 'badge-success', icon: '🏆', text: 'Acima' };
        if (status.includes('Na Meta') || status.includes('✅')) return { class: 'badge-success', icon: '✅', text: 'Atingiu' };
        if (status.includes('Em Risco') || status.includes('⚠️')) return { class: 'badge-warning', icon: '⚠️', text: 'Na Meta' };
        return { class: 'badge-danger', icon: '🔴', text: 'Crítico' };
    };

    const getProgressClass = (perc) => {
        if (perc >= 100) return 'progress-success';
        if (perc >= 80) return 'progress-warning';
        return 'progress-danger';
    };

    const getInsightClass = (prioridade, tipo) => {
        if (tipo === 'cliente_em_risco' || prioridade === 1) return 'insight-danger';
        if (tipo === 'oportunidade' || tipo === 'crm') return 'insight-success';
        return 'insight-warning';
    };

    // Chart data for evolution
    const chartEvolucaoData = {
        labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Vendas',
            data: [17200000, 17800000, 18100000, 18200000, 18500000, kpis?.totalVendas || 19625027],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3
        }]
    };

    // Chart data for Meta vs Realizado
    const chartMetaData = {
        labels: performance.slice(0, 5).map(v => v.vendedor_nome?.split(' ')[0] || 'N/A'),
        datasets: [
            {
                label: 'Meta',
                data: performance.slice(0, 5).map(v => v.meta_mes || 0),
                backgroundColor: '#e2e8f0',
                borderRadius: 6
            },
            {
                label: 'Realizado',
                data: performance.slice(0, 5).map(v => v.total_vendas_mes || 0),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }
        ]
    };

    // Chart data for Clients
    const chartClientesData = {
        labels: ['Ativos', 'Inativos', 'Novos', 'Em Risco'],
        datasets: [{
            data: [
                performance.reduce((sum, v) => sum + (v.clientes_ativos || 0), 0),
                23,
                performance.reduce((sum, v) => sum + (v.clientes_novos || 0), 0),
                performance.reduce((sum, v) => sum + (v.clientes_perdidos || 0), 0)
            ],
            backgroundColor: ['#10b981', '#94a3b8', '#3b82f6', '#ef4444'],
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        }
    };

    if (loading) {
        return (
            <div className="equipe-loading">
                <div className="loading-spinner"></div>
                <p>Carregando dashboard de equipe...</p>
            </div>
        );
    }

    return (
        <div className="equipe-container">

            {/* Filtro de Vendedor */}
            <div className="vendedor-filter-bar">
                <div className="filter-label">
                    <Users size={18} />
                    <span>Filtrar por Vendedor:</span>
                </div>
                <select
                    value={selectedVendedor || ''}
                    onChange={(e) => setSelectedVendedor(e.target.value || null)}
                    className="vendedor-select"
                >
                    <option value="">Todos os Vendedores</option>
                    {vendedores.map(v => (
                        <option key={v.ven_codigo} value={v.ven_codigo}>
                            {v.ven_nome}
                        </option>
                    ))}
                </select>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card success">
                    <div className="kpi-label">Total de Vendas</div>
                    <div className="kpi-value">{formatCurrency(kpis?.totalVendas)}</div>
                    <div className={`kpi-change ${kpis?.variacao >= 0 ? 'positive' : 'negative'}`}>
                        {kpis?.variacao >= 0 ? '▲' : '▼'} {Math.abs(kpis?.variacao || 0).toFixed(2)}% vs mês anterior
                    </div>
                </div>

                <div className="kpi-card info">
                    <div className="kpi-label">Ticket Médio</div>
                    <div className="kpi-value">{formatCurrency(kpis?.avgTicket)}</div>
                    <div className="kpi-change">
                        📊 Média da equipe
                    </div>
                </div>

                <div className="kpi-card warning">
                    <div className="kpi-label">% Meta Atingida</div>
                    <div className="kpi-value">{(kpis?.percMeta || 0).toFixed(1)}%</div>
                    <div className="kpi-change">
                        ⏱ {kpis?.percMeta >= 100 ? 'Meta batida!' : 'Em andamento'}
                    </div>
                </div>

                <div className="kpi-card danger">
                    <div className="kpi-label">Clientes em Risco</div>
                    <div className="kpi-value">{kpis?.totalClientesRisco || 0}</div>
                    <div className="kpi-change negative">
                        ⚠️ Necessitam atenção
                    </div>
                </div>
            </div>

            {/* Main Grid: Tabela + IA Insights */}
            <div className="main-grid">

                {/* Tabela de Vendedores */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <span className="card-icon">📊</span>
                            Ranking de Performance
                        </div>
                        <div className="card-badge">{performance.length} vendedores</div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Vendedor</th>
                                    <th className="text-right">Vendas</th>
                                    <th className="text-right">Meta</th>
                                    <th className="td-center">% Meta</th>
                                    <th className="text-right">MoM</th>
                                    <th className="td-center">Clientes</th>
                                    <th className="td-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map((vendedor, index) => {
                                    const statusBadge = getStatusBadge(vendedor.status);
                                    const percMeta = vendedor.perc_atingimento_meta || 0;

                                    return (
                                        <tr
                                            key={vendedor.vendedor_codigo}
                                            onClick={() => fetchIAInsights(vendedor.vendedor_codigo)}
                                            className={iaInsights?.vendedor?.vendedor_codigo === vendedor.vendedor_codigo ? 'selected' : ''}
                                        >
                                            <td>
                                                <span className={`ranking-badge ${getRankingBadgeClass(vendedor.ranking)}`}>
                                                    {vendedor.ranking}
                                                </span>
                                            </td>
                                            <td className="td-vendedor">{vendedor.vendedor_nome}</td>
                                            <td className="td-valor">{formatCurrency(vendedor.total_vendas_mes)}</td>
                                            <td className="td-valor">{formatCurrency(vendedor.meta_mes)}</td>
                                            <td className="td-center">
                                                <div className="progress-bar">
                                                    <div
                                                        className={`progress-fill ${getProgressClass(percMeta)}`}
                                                        style={{ width: `${Math.min(percMeta, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <small>{percMeta.toFixed(1)}%</small>
                                            </td>
                                            <td className={`td-valor ${vendedor.variacao_mom_percent >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {vendedor.variacao_mom_percent >= 0 ? '+' : ''}{(vendedor.variacao_mom_percent || 0).toFixed(2)}%
                                            </td>
                                            <td className="td-center">
                                                <span className="badge badge-info">{vendedor.clientes_ativos || 0}</span>
                                            </td>
                                            <td className="td-center">
                                                <span className={`badge ${statusBadge.class}`}>
                                                    {statusBadge.icon} {statusBadge.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Painel de Recomendações Estratégicas */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <span className="card-icon">📊</span>
                            Recomendações Estratégicas
                        </div>
                        <select
                            className="vendedor-select-insights"
                            value={iaInsights?.vendedor?.vendedor_codigo || ''}
                            onChange={(e) => e.target.value && fetchIAInsights(e.target.value)}
                        >
                            <option value="">Selecione um vendedor</option>
                            {vendedores.map(v => (
                                <option key={v.ven_codigo} value={v.ven_codigo}>
                                    {v.ven_nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ia-panel">
                        {iaInsights?.recomendacoes?.map((rec, index) => (
                            <div key={index} className={`insight-card ${getInsightClass(rec.prioridade, rec.tipo)}`}>
                                <div className="insight-header">
                                    <span className="insight-icon">
                                        {rec.tipo === 'cliente_em_risco' ? '📞' : rec.tipo === 'oportunidade' ? '📈' : '🎯'}
                                    </span>
                                    <span className="insight-title">{rec.titulo}</span>
                                    <span className="insight-priority">P{rec.prioridade}</span>
                                </div>
                                <div className="insight-description">{rec.descricao}</div>
                                <div className="insight-action">➜ {rec.acao}</div>
                                {rec.impacto_estimado && (
                                    <div className="insight-impact">💰 Impacto: {rec.impacto_estimado}</div>
                                )}
                            </div>
                        ))}

                        {iaInsights?.previsao && (
                            <div className="insight-card insight-prediction">
                                <div className="insight-header">
                                    <span className="insight-icon">🔮</span>
                                    <span className="insight-title">Previsão para o Próximo Mês</span>
                                </div>
                                <div className="insight-description">
                                    <strong className="text-success">{formatCurrency(iaInsights.previsao.valor_estimado)}</strong><br />
                                    Probabilidade de bater meta: <strong className="text-success">{iaInsights.previsao.probabilidade_bater_meta}%</strong><br />
                                    Tendência: <strong className="text-success">📈 {iaInsights.previsao.tendencia}</strong>
                                </div>
                            </div>
                        )}

                        {!iaInsights && (
                            <div className="insight-empty">
                                <Target size={32} className="text-gray-300" />
                                <p>Selecione um vendedor acima para ver as recomendações</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon">📈</span>
                        Evolução Últimos 6 Meses
                    </div>
                    <div className="chart-wrapper">
                        <Line data={chartEvolucaoData} options={{
                            ...chartOptions,
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    ticks: {
                                        callback: (value) => `R$ ${(value / 1000000).toFixed(1)}M`
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon">🎯</span>
                        Meta vs Realizado
                    </div>
                    <div className="chart-wrapper">
                        <Bar data={chartMetaData} options={{
                            ...chartOptions,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: { font: { size: 10 } }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: (value) => `R$ ${(value / 1000000).toFixed(1)}M`
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon">👥</span>
                        Clientes por Status
                    </div>
                    <div className="chart-wrapper">
                        <Doughnut data={chartClientesData} options={{
                            ...chartOptions,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'bottom',
                                    labels: { font: { size: 10 }, usePointStyle: true }
                                }
                            }
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipeTab;
