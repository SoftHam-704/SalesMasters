import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Store,
    TrendingUp
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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
        'Todos': null
    };

    // Memoized Values
    const metricMonth = useMemo(() => {
        if (!filters?.mes) return null;
        return typeof filters.mes === 'string' ? monthMap[filters.mes] : filters.mes;
    }, [filters.mes]);

    // 1. Initial Load: Ranking, Familias, Portfolio
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Prepare safe params
                const params = {
                    ano: filters.ano,
                    mes_inicio: metricMonth || 1,
                    mes_fim: metricMonth || 12,
                };

                // Add industries only if not 'Todos'
                if (filters.industria && filters.industria !== 'Todos') {
                    params.industria = filters.industria;
                }

                const queryParams = new URLSearchParams(params);

                // Fetch Ranking
                const resRanking = await fetch(`http://localhost:8000/api/produtos/ranking?${queryParams}`);
                const dataRanking = await resRanking.json();
                setRankingData(dataRanking || []);
                setFilteredRanking(dataRanking || []);

                // Fetch Familias
                const resFamilias = await fetch(`http://localhost:8000/api/produtos/familia-ranking?${queryParams}`);
                setFamiliasData(await resFamilias.json() || []);

                // Fetch Portfolio (uses same params logic)
                // For portfolio total, we usually ignore month, but for "sales vs portfolio" graph we use the range
                const resPort = await fetch(`http://localhost:8000/api/produtos/portfolio-vs-vendas?${queryParams}`);
                setPortfolioData(await resPort.json() || []);

            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [filters.ano, metricMonth, filters.industria]);

    // 2. Load Details when Product Selected or Toggle Changed
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
                // Fetch Clientes
                const queryCli = new URLSearchParams({
                    compraram: mostrarCompraram,
                    ano: filters.ano,
                    mes_inicio: metricMonth || 1,
                    mes_fim: metricMonth || 12
                });
                const resCli = await fetch(`http://localhost:8000/api/produtos/${produto.id}/clientes?${queryCli}`);
                setClientesData(await resCli.json() || []);

                // Fetch Desempenho Mensal
                const resDes = await fetch(`http://localhost:8000/api/produtos/${produto.id}/desempenho-mensal?ano=${filters.ano}`);
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

    const filteredClientes = clientesData.filter(c =>
        clientSearchTerm === '' ||
        String(c.cliente_nome).toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        String(c.cliente_codigo).includes(clientSearchTerm)
    );

    // --- Chart Data Preparation ---

    // A. Desempenho Mensal (Line Chart)
    const desempenhoChartData = {
        labels: desempenhoData.map(d => d.mes_nome),
        datasets: [
            {
                label: `Quantidade ${filters.ano}`,
                data: desempenhoData.map(d => d.atual),
                borderColor: '#06b6d4', // cyan-500
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                tension: 0.4,
                fill: true
            },
            {
                label: `Quantidade ${filters.ano - 1}`,
                data: desempenhoData.map(d => d.anterior),
                borderColor: '#94a3b8', // slate-400
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4
            }
        ]
    };

    const desempenhoOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#e2e8f0' } },
            title: { display: false }
        },
        scales: {
            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };

    // B. Families (Bar Chart) - Top 5
    const topFamilias = familiasData.slice(0, 5);
    const familiasChartData = {
        labels: topFamilias.map(f => f.nome),
        datasets: [
            {
                label: 'Quantidade',
                data: topFamilias.map(f => f.qtd),
                backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
                borderRadius: 4
            }
        ]
    };

    const familiasOptions = {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#e2e8f0' } }
        }
    };

    // C. Portfolio vs Sales (Line/Bar Combo)
    const portfolioChartData = {
        labels: portfolioData.map(d => d.mes_nome),
        datasets: [
            {
                type: 'bar',
                label: 'Itens Vendidos',
                data: portfolioData.map(d => d.vendidos),
                backgroundColor: '#06b6d4',
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: '% Cobertura',
                data: portfolioData.map(d => d.percentual),
                borderColor: '#f59e0b', // amber-500
                borderWidth: 2,
                yAxisID: 'y1'
            }
        ]
    };

    const portfolioOptions = {
        responsive: true,
        plugins: { legend: { labels: { color: '#e2e8f0' } } },
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            y1: {
                type: 'linear',
                position: 'right',
                grid: { display: false },
                ticks: { color: '#f59e0b', callback: (val) => val + '%' }
            },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };


    return (
        <div className="h-full flex gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">

            {/* LEFT PANEL: PRODUCT LIST / RANKING */}
            <div className="w-1/3 flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                {/* Header & Search */}
                <div className="p-4 border-b border-slate-700 bg-slate-800 z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Package className="w-5 h-5 text-cyan-400" />
                            Ranking Produtos
                        </h2>
                        <div className="text-sm text-slate-400">
                            {rankingData.length} itens encontrados
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar produto por nome ou código..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/50">
                            {filteredRanking.map((prod, index) => (
                                <div
                                    key={prod.id || index}
                                    onClick={() => setSelectedProdutoIndex(index)}
                                    className={`
                                        p-4 cursor-pointer transition-all hover:bg-slate-700/50 relative
                                        ${selectedProdutoIndex === index ? 'bg-slate-700/80 border-l-4 border-cyan-500 shadow-lg' : 'border-l-4 border-transparent'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`
                                                text-xs font-bold px-2 py-0.5 rounded-full
                                                ${prod.abc === 'A' ? 'bg-green-500/20 text-green-400' :
                                                    prod.abc === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'}
                                            `}>
                                                {prod.abc}
                                            </span>
                                            <span className="text-xs text-slate-500">#{prod.ranking}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-200">
                                            {formatNumber(prod.qtd)} un
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">
                                        {prod.nome}
                                    </h3>

                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Cod: {prod.codigo}</span>
                                        <span>{prod.grupo_nome}</span>
                                    </div>

                                    {/* Mini Progress Bar for Pareto */}
                                    <div className="mt-2 h-1 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500/50"
                                            style={{ width: `${prod.perc_acumulado > 100 ? 100 : prod.perc_acumulado}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: DETAILS & CHARTS */}
            <div className="w-2/3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">

                {/* 1. KPIs Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Total Famílias</div>
                        <div className="text-2xl font-bold text-white mb-1">{familiasData.length}</div>
                        <div className="text-xs text-cyan-400 flex items-center gap-1">
                            <Package size={14} /> Ativas
                        </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Total Itens</div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {portfolioData.length > 0 ? portfolioData[portfolioData.length - 1].portfolio : 0}
                        </div>
                        <div className="text-xs text-amber-400 flex items-center gap-1">
                            <Store size={14} /> Cadastro
                        </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Itens Movimentados</div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {portfolioData.length > 0 ? portfolioData[portfolioData.length - 1].vendidos : 0}
                        </div>
                        <div className="text-xs text-emerald-400 flex items-center gap-1">
                            <TrendingUp size={14} />
                            {portfolioData.length > 0 ? portfolioData[portfolioData.length - 1].percentual + '%' : '0%'}
                        </div>
                    </div>
                </div>

                {/* 2. Main Charts Row */}
                <div className="grid grid-cols-2 gap-4 h-64">
                    {/* Monthly Performance */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-cyan-500" />
                            {selectedProdutoIndex !== null ? 'Desempenho do Produto' : 'Desempenho Global'} (Unidades)
                        </h3>
                        <div className="flex-1 min-h-0">
                            {selectedProdutoIndex !== null ? (
                                <Line data={desempenhoChartData} options={desempenhoOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                    Selecione um produto para ver o desempenho detalhado
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Families */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Package size={16} className="text-purple-500" />
                            Top 5 Famílias (Qtd)
                        </h3>
                        <div className="flex-1 min-h-0">
                            <Bar data={familiasChartData} options={familiasOptions} />
                        </div>
                    </div>
                </div>

                {/* 3. Portfolio Evolution Chart (Full Width) */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-64 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <Store size={16} className="text-amber-500" />
                        Evolução Portfolio vs Vendas
                    </h3>
                    <div className="flex-1 min-h-0">
                        <Bar data={portfolioChartData} options={portfolioOptions} />
                    </div>
                </div>

                {/* 4. Clients Table (Only if product selected) */}
                {selectedProdutoIndex !== null && (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col flex-1 min-h-[300px]">
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-white">Análise de Clientes</h3>
                                <div className="flex bg-slate-900 rounded-lg p-1">
                                    <button
                                        onClick={() => setMostrarCompraram(true)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${mostrarCompraram ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Compraram
                                    </button>
                                    <button
                                        onClick={() => setMostrarCompraram(false)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!mostrarCompraram ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Não Compraram
                                    </button>
                                </div>
                            </div>

                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 h-3 w-3 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Filtrar clientes..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:border-cyan-500"
                                    value={clientSearchTerm}
                                    onChange={(e) => setClientSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 w-20">Cód</th>
                                        <th className="p-3">Cliente</th>
                                        {mostrarCompraram ? (
                                            <>
                                                <th className="p-3 text-right">Qtd Comprada</th>
                                                <th className="p-3 text-right">Última Compra</th>
                                            </>
                                        ) : (
                                            <th className="p-3">Status</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {filteredClientes.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-3 text-slate-500 font-mono text-xs">{c.cliente_codigo}</td>
                                            <td className="p-3 font-medium text-slate-200">{c.cliente_nome}</td>
                                            {mostrarCompraram ? (
                                                <>
                                                    <td className="p-3 text-right font-bold text-cyan-400">
                                                        {formatNumber(c.qtd)}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-400 text-xs">
                                                        {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="p-3">
                                                    <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs border border-yellow-500/30">
                                                        Oportunidade
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredClientes.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                Nenhum cliente encontrado nesta categoria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProdutosTab;
