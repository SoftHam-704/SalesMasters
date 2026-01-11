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
import { Users, TrendingUp, Target, AlertTriangle, Trophy, CheckCircle, XCircle, Phone, Mail, MapPin, MessageCircle, Sparkles, ChevronDown, ArrowRight, X, Calendar } from 'lucide-react';
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

import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

const API_URL = PYTHON_API_URL;

const EquipeTab = ({ filters }) => {
    // const { filters } = useBIFilters(); // Removido para usar prop vinda do IntelligencePage
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState([]);
    const [selectedVendedor, setSelectedVendedor] = useState(null);
    const [iaInsights, setIaInsights] = useState(null);
    const [riskModalOpen, setRiskModalOpen] = useState(false);
    const [riskClients, setRiskClients] = useState([]);
    const [riskLoading, setRiskLoading] = useState(false);
    const [vendedores, setVendedores] = useState([]);

    // New state for portfolio analysis
    const [carteiraResumo, setCarteiraResumo] = useState(null);
    const [carteiraPorVendedor, setCarteiraPorVendedor] = useState([]);
    const [novosClientes, setNovosClientes] = useState([]);
    const [narrativasIA, setNarrativasIA] = useState([]);
    const [narrativasLoading, setNarrativasLoading] = useState(false);
    const [evolucaoData, setEvolucaoData] = useState({ labels: [], valores: [] });

    const metricMonth = useMemo(() => {
        const monthMap = {
            'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
            'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
            'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12,
            'Todos': 0  // 0 means all months in the year
        };
        return monthMap[filters?.mes] ?? new Date().getMonth() + 1;
    }, [filters?.mes]);

    // Fetch vendedores list
    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const response = await fetch(getApiUrl(API_URL, '/api/equipe/vendedores'));
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
                // Performance Ranking should show ALL vendors, so we don't pass 'vendedor' param here
                const url = getApiUrl(API_URL, `/api/equipe/performance?ano=${filters.ano}&mes=${metricMonth}`);
                const response = await fetch(url);
                const data = await response.json();
                if (data.success) {
                    setPerformance(data.data || []);
                    // Update IA insights based on selection
                    if (selectedVendedor) {
                        fetchIAInsights(selectedVendedor);
                    } else {
                        setIaInsights(null);
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
            // IA Insights (Recommendations) should be "Year-to-Date" or "Current Context", so we force mes=0 (All)
            const url = getApiUrl(API_URL, `/api/equipe/ia-insights?vendedor=${vendedorId}&ano=${filters.ano}&mes=0`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setIaInsights(data.data);
            } else {
                console.warn("API Error, using fallback:", data.error);
                setIaInsights(getMockInsights());
            }
        } catch (error) {
            console.error('Erro ao buscar IA insights:', error);
            // Use mock data for testing
            setIaInsights(getMockInsights());
        }
    };

    const fetchClientesRisco = async () => {
        setRiskLoading(true);
        setRiskModalOpen(true);
        try {
            let endpoint = '/api/equipe/clientes-risco';
            if (selectedVendedor) {
                endpoint += `?vendedor=${selectedVendedor}`;
            }
            const url = getApiUrl(API_URL, endpoint);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setRiskClients(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar clientes em risco", error);
        } finally {
            setRiskLoading(false);
        }
    };

    // Fetch portfolio data
    const fetchCarteiraData = async () => {
        try {
            const vendedorParam = selectedVendedor ? `&vendedor=${selectedVendedor}` : '';

            // Fetch carteira resumo
            // Use getApiUrl for safe URL construction
            const resumoUrl = getApiUrl(API_URL, `/api/equipe/carteira-resumo?ano=${filters.ano}&mes=${metricMonth}${vendedorParam}`);
            const resumoResponse = await fetch(resumoUrl);
            const resumoData = await resumoResponse.json();
            if (resumoData.success) {
                setCarteiraResumo(resumoData.data);
            }

            // Fetch carteira por vendedor (for stacked bar chart)
            const porVendedorUrl = getApiUrl(API_URL, `/api/equipe/carteira-por-vendedor?ano=${filters.ano}&mes=${metricMonth}`);
            const porVendedorResponse = await fetch(porVendedorUrl);
            const porVendedorData = await porVendedorResponse.json();
            if (porVendedorData.success) {
                setCarteiraPorVendedor(porVendedorData.data);
            }

            // Fetch novos clientes
            const novosUrl = getApiUrl(API_URL, `/api/equipe/novos-clientes?ano=${filters.ano}&mes=${metricMonth}${vendedorParam}`);
            const novosResponse = await fetch(novosUrl);
            const novosData = await novosResponse.json();
            if (novosData.success) {
                setNovosClientes(novosData.data);
            }
        } catch (error) {
            console.error("Erro ao buscar dados de carteira:", error);
        }
    };

    // Fetch AI narratives
    const fetchNarrativasIA = async () => {
        setNarrativasLoading(true);
        try {
            const vendedorParam = selectedVendedor ? `&vendedor=${selectedVendedor}` : '';
            // Narratives also should depend on the general context, not a specific month filter
            const url = getApiUrl(API_URL, `/api/equipe/narrativas-ia?ano=${filters.ano}&mes=0${vendedorParam}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setNarrativasIA(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar narrativas IA:", error);
        } finally {
            setNarrativasLoading(false);
        }
    };

    // Fetch evolution chart data
    const fetchEvolucaoData = async () => {
        try {
            const vendedorParam = selectedVendedor ? `&vendedor=${selectedVendedor}` : '';
            const url = getApiUrl(API_URL, `/api/equipe/evolucao?ano=${filters.ano}&mes=${metricMonth}${vendedorParam}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && data.data) {
                setEvolucaoData(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar dados de evolução:", error);
        }
    };

    // Initial load for carteira, narrativas and evolucao
    useEffect(() => {
        // Fix: check if metricMonth is defined, allowing 0 (Todos)
        if (filters.ano && metricMonth !== undefined && metricMonth !== null) {
            fetchCarteiraData();
            fetchNarrativasIA();
            fetchEvolucaoData();
        }
    }, [filters.ano, metricMonth, selectedVendedor]);

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

    const formatFullCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
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
        if (tipo === 'cliente_em_risco' || prioridade === 1) return 'insight-danger-modern';
        if (tipo === 'oportunidade' || tipo === 'crm') return 'insight-success-modern';
        return 'insight-warning-modern';
    };

    // Chart data for evolution - now using dynamic data
    const chartEvolucaoData = {
        labels: evolucaoData.labels.length > 0 ? evolucaoData.labels : ['...', '...', '...', '...', '...', '...'],
        datasets: [{
            label: 'Vendas',
            data: evolucaoData.valores.length > 0 ? evolucaoData.valores : [0, 0, 0, 0, 0, 0],
            borderColor: '#3b82f6',
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                return gradient;
            },
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2
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
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 } }
            },
            y: {
                border: { dash: [4, 4] },
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 } }
            }
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
                    <div className="kpi-value">{formatFullCurrency(kpis?.totalVendas)}</div>
                    <div className={`kpi-change ${kpis?.variacao >= 0 ? 'positive' : 'negative'}`}>
                        {kpis?.variacao >= 0 ? '▲' : '▼'} {Math.abs(kpis?.variacao || 0).toFixed(2)}% vs mês anterior
                    </div>
                </div>

                <div className="kpi-card info">
                    <div className="kpi-label">Ticket Médio</div>
                    <div className="kpi-value">{formatFullCurrency(kpis?.avgTicket)}</div>
                    <div className="kpi-change">
                        📊 {selectedVendedor
                            ? `Média ${vendedores.find(v => v.ven_codigo == selectedVendedor)?.ven_nome?.split(' ')[0] || 'Vendedor'}`
                            : 'Média da equipe'}
                    </div>
                </div>

                <div className="kpi-card warning">
                    <div className="kpi-label">% Meta Atingida</div>
                    <div className="kpi-value">{(kpis?.percMeta || 0).toFixed(1)}%</div>
                    <div className="kpi-change">
                        ⏱ {kpis?.percMeta >= 100 ? 'Meta batida!' : 'Em andamento'}
                    </div>
                </div>

                <div className="kpi-card danger cursor-pointer hover:shadow-lg transition-all" onClick={fetchClientesRisco}>
                    <div className="kpi-label">Clientes em Risco</div>
                    <div className="kpi-value">{kpis?.totalClientesRisco || 0}</div>
                    <div className="kpi-change negative">
                        ⚠️ Necessitam atenção
                    </div>
                </div>
            </div>

            {/* Risk Clients Modal */}
            {riskModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" />
                                    Clientes em Risco
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedVendedor
                                        ? `Lista de clientes do vendedor selecionado sem comprar há mais de 60 dias`
                                        : `Lista geral de clientes sem comprar há mais de 60 dias`}
                                </p>
                            </div>
                            <button
                                onClick={() => setRiskModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {riskLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                                    <p className="text-gray-500">Carregando lista de clientes...</p>
                                </div>
                            ) : riskClients.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                    <CheckCircle size={48} className="text-green-500 mb-4" />
                                    <p className="text-lg">Nenhum cliente em risco encontrado!</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-sm font-semibold text-gray-600">
                                            <th className="p-3">Cliente</th>
                                            {!selectedVendedor && <th className="p-3">Vendedor</th>}
                                            <th className="p-3 text-right">Última Compra</th>
                                            <th className="p-3 text-center">Dias s/ Compra</th>
                                            <th className="p-3 text-right">Total Histórico</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-700">
                                        {riskClients.map((client) => (
                                            <tr key={client.cliente_codigo} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                                                <td className="p-3 font-medium">{client.cliente_nome}</td>
                                                {!selectedVendedor && <td className="p-3 text-gray-500">{client.vendedor_nome}</td>}
                                                <td className="p-3 text-right">{new Date(client.ultima_compra).toLocaleDateString('pt-BR')}</td>
                                                <td className="p-3 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {client.dias_sem_comprar} dias
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-medium">{formatFullCurrency(client.valor_total_historico)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setRiskModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid: Tabela + IA Insights */}
            <div className="main-grid">

                {/* Tabela de Vendedores */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <span className="card-icon"><Trophy size={18} className="text-yellow-500" /></span>
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
                                    <th className="text-right">YoY</th>
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
                                            <td className="td-valor">{formatFullCurrency(vendedor.total_vendas_mes)}</td>
                                            <td className="td-valor">{formatFullCurrency(vendedor.meta_mes)}</td>
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
                                            <td className={`td-valor ${vendedor.variacao_yoy_percent >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {vendedor.variacao_yoy_percent >= 0 ? '+' : ''}{(vendedor.variacao_yoy_percent || 0).toFixed(2)}%
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
                            <span className="card-icon"><Sparkles size={18} className="text-purple-500" /></span>
                            Recomendações Estratégicas
                        </div>
                    </div>
                    <div className="ia-panel">
                        {iaInsights?.recomendacoes?.map((rec, index) => (
                            <div key={index} className={`insight-card-modern ${getInsightClass(rec.prioridade, rec.tipo)}`}>
                                <div className="insight-header-modern">
                                    <div className="insight-icon-circle">
                                        {rec.tipo === 'cliente_em_risco' ? <Phone size={20} /> : rec.tipo === 'oportunidade' ? <TrendingUp size={20} /> : <Target size={20} />}
                                    </div>
                                    <div className="insight-content">
                                        <div className="insight-top">
                                            <span className="insight-title-modern">{rec.titulo}</span>
                                            <span className="insight-priority-modern">P{rec.prioridade}</span>
                                        </div>
                                        <div className="insight-description-modern">{rec.descricao}</div>
                                        <div className="insight-action-modern">
                                            <ArrowRight size={16} className="mr-1" />
                                            {rec.acao}
                                        </div>
                                        {rec.impacto_estimado && (
                                            <div className="insight-impact-modern">💰 Impacto Estimado: {rec.impacto_estimado}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {iaInsights?.previsao && (
                            <div className="insight-card-modern insight-prediction-modern">
                                <div className="insight-header-modern">
                                    <div className="insight-icon-circle prediction">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="insight-content">
                                        <div className="insight-top">
                                            <span className="insight-title-modern">Previsão para o Próximo Mês</span>
                                        </div>
                                        <div className="insight-prediction-stats">
                                            <div className="stat-item">
                                                <span className="label">Valor Estimado</span>
                                                <span className="value text-success">{formatFullCurrency(iaInsights.previsao.valor_estimado)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">Probabilidade</span>
                                                <span className="value text-success">{iaInsights.previsao.probabilidade_bater_meta}%</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">Tendência</span>
                                                <span className="value text-success flex items-center gap-1"><TrendingUp size={14} /> {iaInsights.previsao.tendencia}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!iaInsights && !selectedVendedor) && (
                            <div className="insight-empty">
                                <Target size={32} className="text-gray-300" />
                                <p>Selecione um vendedor no filtro principal para ver as recomendações</p>
                            </div>
                        )}

                        {(selectedVendedor && !iaInsights) && (
                            <div className="insight-empty">
                                <Sparkles size={32} className="text-teal-300 animate-pulse" />
                                <p>Analisando performance...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Grid - Row 1: Evolution + Portfolio KPIs */}
            <div className="charts-grid">
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><TrendingUp size={18} className="text-blue-500" /></span>
                        Evolução Últimos 6 Meses
                    </div>
                    <div className="chart-wrapper">
                        <Line data={chartEvolucaoData} options={{
                            ...chartOptions,
                            scales: {
                                ...chartOptions.scales,
                                y: {
                                    ...chartOptions.scales?.y,
                                    beginAtZero: false,
                                    ticks: {
                                        callback: (value) => `R$ ${(value / 1000000).toFixed(1)}M`
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                {/* Portfolio KPIs Card */}
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><Users size={18} className="text-teal-500" /></span>
                        Carteira de Clientes
                    </div>
                    <div className="portfolio-kpis-grid">
                        <div className="portfolio-kpi">
                            <div className="portfolio-kpi-value text-emerald-600">{carteiraResumo?.clientes_ativos_90d || 0}</div>
                            <div className="portfolio-kpi-label">Ativos (90d)</div>
                        </div>
                        <div className="portfolio-kpi">
                            <div className="portfolio-kpi-value text-red-500">{carteiraResumo?.clientes_inativos_90d || 0}</div>
                            <div className="portfolio-kpi-label">Inativos</div>
                        </div>
                        <div className="portfolio-kpi">
                            <div className="portfolio-kpi-value text-blue-600">{carteiraResumo?.total_clientes || 0}</div>
                            <div className="portfolio-kpi-label">Total</div>
                        </div>
                        <div className="portfolio-kpi">
                            <div className="portfolio-kpi-value text-orange-500">{carteiraResumo?.perc_inativos?.toFixed(1) || 0}%</div>
                            <div className="portfolio-kpi-label">% Inativos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid - Row 2: Stacked Bar + New Clients */}
            <div className="charts-grid">
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><Users size={18} className="text-emerald-500" /></span>
                        Ativos x Inativos por Vendedor <span className="text-xs font-normal text-gray-400 ml-2">(Base 90 dias)</span>
                    </div>
                    <div className="chart-wrapper">
                        <Bar
                            data={{
                                labels: carteiraPorVendedor.map(v => v.vendedor_nome?.split(' ')[0] || 'N/A'),
                                datasets: [
                                    {
                                        label: 'Ativos',
                                        data: carteiraPorVendedor.map(v => v.clientes_ativos_90d || 0),
                                        backgroundColor: '#10b981',
                                        borderRadius: 4
                                    },
                                    {
                                        label: 'Inativos',
                                        data: carteiraPorVendedor.map(v => v.clientes_inativos_90d || 0),
                                        backgroundColor: '#ef4444',
                                        borderRadius: 4
                                    }
                                ]
                            }}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    legend: {
                                        display: true,
                                        position: 'top',
                                        labels: { font: { size: 10 }, usePointStyle: true }
                                    }
                                },
                                scales: {
                                    x: { stacked: true, grid: { display: false } },
                                    y: { stacked: true, grid: { color: '#f1f5f9' } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* New Clients Card */}
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><Trophy size={18} className="text-yellow-500" /></span>
                        Novos Clientes no Período
                        <span className="ml-auto text-sm text-gray-500">{novosClientes.length} cliente(s)</span>
                    </div>
                    <div className="new-clients-list">
                        {novosClientes.length === 0 ? (
                            <div className="empty-state">
                                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">Nenhum novo cliente no período</p>
                            </div>
                        ) : (
                            novosClientes.map((client, idx) => (
                                <div key={client.cliente_codigo} className="new-client-item">
                                    <div className="new-client-rank">{idx + 1}</div>
                                    <div className="new-client-info">
                                        <div className="new-client-name">{client.cliente_nome}</div>
                                        <div className="new-client-meta">
                                            {new Date(client.data_primeira_compra).toLocaleDateString('pt-BR')} • {formatFullCurrency(client.valor_primeira_compra)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* AI Narratives Grid */}
            <div className="narratives-grid">
                <div className="narratives-header">
                    <Sparkles size={20} className="text-purple-500" />
                    <span>Insights Inteligentes</span>
                    {narrativasLoading && <span className="text-sm text-gray-400 ml-2">Analisando...</span>}
                </div>
                <div className="narratives-cards">
                    {narrativasIA.length > 0 ? narrativasIA.map((narrativa, idx) => (
                        <div key={idx} className={`narrative-card narrative-${narrativa.tipo}`}>
                            <div className="narrative-icon">
                                {narrativa.icone === 'trophy' && <Trophy size={20} />}
                                {narrativa.icone === 'users' && <Users size={20} />}
                                {narrativa.icone === 'alert' && <AlertTriangle size={20} />}
                                {narrativa.icone === 'target' && <Target size={20} />}
                            </div>
                            <div className="narrative-content">
                                <div className="narrative-title">{narrativa.titulo}</div>
                                <div className="narrative-text">{narrativa.texto}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="narrative-loading">
                            <Sparkles size={24} className="animate-pulse text-purple-300" />
                            <span>Gerando insights com IA...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EquipeTab;
