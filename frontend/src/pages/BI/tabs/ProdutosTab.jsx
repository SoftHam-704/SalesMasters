import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Package,
    Store,
    TrendingUp,
    Users,
    BarChart3,
    Sparkles
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './ProdutosTab.css';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
    Filler
);

const API_URL = PYTHON_API_URL;

const ProdutosTab = ({ filters }) => {
    // State
    const [loading, setLoading] = useState(false);
    const [rankingData, setRankingData] = useState([]);
    const [filteredRanking, setFilteredRanking] = useState([]);
    const [familiasData, setFamiliasData] = useState([]);
    const [portfolioData, setPortfolioData] = useState([]);

    // Details State
    const [selectedProdutoIndex, setSelectedProdutoIndex] = useState(null);
    const [desempenhoData, setDesempenhoData] = useState([]);
    const [clientesData, setClientesData] = useState([]);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarCompraram, setMostrarCompraram] = useState(true);
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    // Mapping Constants
    const monthMap = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12,
        'Todos': 0
    };

    // Memoized Values
    const metricMonth = useMemo(() => {
        if (!filters?.mes) return 0;
        return typeof filters.mes === 'string' ? (monthMap[filters.mes] ?? 0) : filters.mes;
    }, [filters?.mes]);

    // 1. Initial Load: Ranking, Familias, Portfolio
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    mes_inicio: metricMonth === 0 ? 1 : metricMonth,
                    mes_fim: metricMonth === 0 ? 12 : metricMonth,
                };

                if (filters.industria && filters.industria !== 'Todos') {
                    params.industria = filters.industria;
                }

                const queryParams = new URLSearchParams(params).toString();

                // Fetch Ranking
                const resRanking = await fetch(getApiUrl(API_URL, `/api/produtos/ranking?${queryParams}`));
                const dataRanking = await resRanking.json();
                setRankingData(dataRanking || []);
                setFilteredRanking(dataRanking || []);

                // Fetch Familias
                const resFamilias = await fetch(getApiUrl(API_URL, `/api/produtos/familia-ranking?${queryParams}`));
                const famData = await resFamilias.json();
                setFamiliasData(famData || []);

                // Fetch Portfolio
                const resPort = await fetch(getApiUrl(API_URL, `/api/produtos/portfolio-vs-vendas?${queryParams}`));
                setPortfolioData(await resPort.json() || []);

            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [filters.ano, metricMonth, filters.industria]);

    // 2. Load Details when Product Selected
    useEffect(() => {
        const loadDetails = async () => {
            if (selectedProdutoIndex === null) {
                setClientesData([]);
                setDesempenhoData([]);
                return;
            }

            const produto = filteredRanking[selectedProdutoIndex];
            if (!produto) return;

            try {
                const queryCli = new URLSearchParams({
                    compraram: mostrarCompraram,
                    ano: filters.ano,
                    mes_inicio: metricMonth === 0 ? 1 : metricMonth,
                    mes_fim: metricMonth === 0 ? 12 : metricMonth
                }).toString();
                const resCli = await fetch(getApiUrl(API_URL, `/api/produtos/${produto.id}/clientes?${queryCli}`));
                setClientesData(await resCli.json() || []);

                const resDes = await fetch(getApiUrl(API_URL, `/api/produtos/${produto.id}/desempenho-mensal?ano=${filters.ano}`));
                setDesempenhoData(await resDes.json() || []);

            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
            }
        };

        loadDetails();
    }, [selectedProdutoIndex, mostrarCompraram, filters.ano, metricMonth, filteredRanking]);

    // 3. Filter Ranking by Search Term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredRanking(rankingData);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const filtered = rankingData.filter(p =>
            String(p.codigo).toLowerCase().includes(lower) ||
            String(p.nome).toLowerCase().includes(lower)
        );
        setFilteredRanking(filtered);
    }, [searchTerm, rankingData]);

    // Helpers
    const formatNumber = (num) => new Intl.NumberFormat('pt-BR').format(num);

    const filteredClientes = Array.isArray(clientesData)
        ? clientesData.filter(c =>
            clientSearchTerm === '' ||
            String(c.cliente_nome || '').toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            String(c.cliente_codigo || '').includes(clientSearchTerm)
        )
        : [];

    // --- Chart Data Preparation (Light Theme) ---
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
            x: { grid: { display: false }, ticks: { color: '#64748b' } }
        }
    };

    const desempenhoChartData = {
        labels: desempenhoData.map(d => d.mes_nome),
        datasets: [
            {
                label: `Quantidade ${filters.ano}`,
                data: desempenhoData.map(d => d.atual),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: `Quantidade ${filters.ano - 1}`,
                data: desempenhoData.map(d => d.anterior),
                borderColor: '#94a3b8',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4
            }
        ]
    };

    const topFamilias = familiasData.slice(0, 5);
    const familiasChartData = {
        labels: topFamilias.map(f => f.nome || 'N/A'),
        datasets: [{
            label: 'Quantidade',
            data: topFamilias.map(f => f.qtd || 0),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderRadius: 6
        }]
    };

    const portfolioChartData = {
        labels: portfolioData.map(d => d.mes_nome),
        datasets: [
            {
                type: 'bar',
                label: 'Itens Vendidos',
                data: portfolioData.map(d => d.vendidos),
                backgroundColor: '#3b82f6',
                borderRadius: 4
            },
            {
                type: 'line',
                label: '% Cobertura',
                data: portfolioData.map(d => d.percentual),
                borderColor: '#10b981',
                borderWidth: 2,
                yAxisID: 'y1',
                tension: 0.4
            }
        ]
    };

    const portfolioOptions = {
        ...chartOptions,
        plugins: {
            legend: { display: true, position: 'top', labels: { font: { size: 10 } } }
        },
        scales: {
            y: { type: 'linear', position: 'left', grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
            y1: { type: 'linear', position: 'right', grid: { display: false }, ticks: { color: '#10b981', callback: (val) => val + '%' } },
            x: { grid: { display: false }, ticks: { color: '#64748b' } }
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="produtos-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Carregando dados de produtos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="produtos-container">
            {/* KPI Cards Row */}
            <div className="kpi-grid">
                <div className="kpi-card info">
                    <div className="kpi-label">Total Famílias</div>
                    <div className="kpi-value">{familiasData.length}</div>
                    <div className="kpi-change">
                        <Package size={14} /> Grupos ativos
                    </div>
                </div>
                <div className="kpi-card success">
                    <div className="kpi-label">Total Itens</div>
                    <div className="kpi-value">
                        {formatNumber(portfolioData.length > 0 ? portfolioData[portfolioData.length - 1]?.portfolio || 0 : 0)}
                    </div>
                    <div className="kpi-change">
                        <Store size={14} /> No cadastro
                    </div>
                </div>
                <div className="kpi-card warning">
                    <div className="kpi-label">Itens Movimentados</div>
                    <div className="kpi-value">
                        {formatNumber(portfolioData.length > 0 ? portfolioData[portfolioData.length - 1]?.vendidos || 0 : 0)}
                    </div>
                    <div className="kpi-change">
                        <TrendingUp size={14} /> {portfolioData.length > 0 ? (portfolioData[portfolioData.length - 1]?.percentual || 0) + '%' : '0%'} cobertura
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Produtos Rankeados</div>
                    <div className="kpi-value">{formatNumber(rankingData.length)}</div>
                    <div className="kpi-change">
                        <BarChart3 size={14} /> No período
                    </div>
                </div>
            </div>

            {/* Main Grid: Ranking + Details */}
            <div className="main-grid">
                {/* Left Panel: Product Ranking */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <span className="card-icon"><Package size={18} className="text-blue-500" /></span>
                            Ranking de Produtos
                        </div>
                        <div className="card-badge">{filteredRanking.length} itens</div>
                    </div>

                    {/* Search */}
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Product List */}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>Produto</th>
                                    <th style={{ textAlign: 'right' }}>Qtd</th>
                                    <th style={{ width: '40px' }}>ABC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRanking.slice(0, 100).map((prod, index) => (
                                    <tr
                                        key={prod.id || index}
                                        onClick={() => setSelectedProdutoIndex(index)}
                                        className={selectedProdutoIndex === index ? 'selected' : ''}
                                    >
                                        <td className="td-center">{prod.ranking}</td>
                                        <td>
                                            <div className="td-vendedor">{prod.nome}</div>
                                            <div className="text-muted" style={{ fontSize: '11px' }}>{prod.codigo}</div>
                                        </td>
                                        <td className="td-valor">{formatNumber(prod.qtd)}</td>
                                        <td className="td-center">
                                            <span className={`badge-abc ${prod.abc}`}>{prod.abc}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel: Charts & Details */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <span className="card-icon"><Sparkles size={18} className="text-purple-500" /></span>
                            {selectedProdutoIndex !== null
                                ? `Detalhes: ${filteredRanking[selectedProdutoIndex]?.nome?.substring(0, 30)}...`
                                : 'Selecione um produto para ver detalhes'
                            }
                        </div>
                    </div>

                    {selectedProdutoIndex !== null ? (
                        <>
                            {/* Performance Chart */}
                            <div className="chart-section">
                                <h4 className="section-title">
                                    <TrendingUp size={16} className="text-blue-500" />
                                    Desempenho Mensal
                                </h4>
                                <div className="chart-wrapper-small">
                                    <Line data={desempenhoChartData} options={chartOptions} />
                                </div>
                            </div>

                            {/* Clients Toggle & Table */}
                            <div className="clients-section">
                                <div className="clients-header">
                                    <h4 className="section-title">
                                        <Users size={16} className="text-emerald-500" />
                                        Clientes
                                    </h4>
                                    <div className="toggle-buttons">
                                        <button
                                            className={`toggle-btn ${mostrarCompraram ? 'active' : ''}`}
                                            onClick={() => setMostrarCompraram(true)}
                                        >
                                            Compraram
                                        </button>
                                        <button
                                            className={`toggle-btn ${!mostrarCompraram ? 'active danger' : ''}`}
                                            onClick={() => setMostrarCompraram(false)}
                                        >
                                            Não Compraram
                                        </button>
                                    </div>
                                </div>

                                <div className="clients-table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Cliente</th>
                                                {mostrarCompraram && <th style={{ textAlign: 'right' }}>Qtd</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredClientes.length > 0 ? filteredClientes.slice(0, 20).map((c, i) => (
                                                <tr key={i}>
                                                    <td className="text-muted">{c.cliente_codigo}</td>
                                                    <td className="td-vendedor">{c.cliente_nome}</td>
                                                    {mostrarCompraram && <td className="td-valor text-success">{formatNumber(c.qtd)}</td>}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={mostrarCompraram ? 3 : 2} className="text-center text-muted" style={{ padding: '20px' }}>
                                                        Nenhum cliente encontrado
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-selection">
                            <Package size={48} className="text-gray-300" />
                            <p>Clique em um produto no ranking para ver detalhes de desempenho e clientes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Grid Row */}
            <div className="charts-grid">
                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><Package size={18} className="text-purple-500" /></span>
                        Top 5 Famílias (Quantidade)
                    </div>
                    <div className="chart-wrapper">
                        {topFamilias.length > 0 ? (
                            <Bar
                                data={familiasChartData}
                                options={{
                                    ...chartOptions,
                                    indexAxis: 'y',
                                    scales: {
                                        x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
                                        y: { grid: { display: false }, ticks: { color: '#1e293b', font: { size: 11 } } }
                                    }
                                }}
                            />
                        ) : (
                            <div className="empty-chart">
                                <Package size={32} className="text-gray-300" />
                                <p>Sem dados de famílias</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="equipe-chart-card">
                    <div className="chart-header">
                        <span className="chart-icon"><Store size={18} className="text-amber-500" /></span>
                        Evolução Portfolio vs Vendas
                    </div>
                    <div className="chart-wrapper">
                        <Bar data={portfolioChartData} options={portfolioOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProdutosTab;
