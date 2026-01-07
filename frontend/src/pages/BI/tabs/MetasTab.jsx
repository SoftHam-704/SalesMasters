import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Target, TrendingUp, TrendingDown, BarChart3, Calendar,
    ArrowUpRight, ArrowDownRight, Activity, CheckCircle, AlertTriangle,
    Minus, Building2
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

import MetasNarratives from '../components/MetasNarratives';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

// Formatters
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
};

const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
};

// Month name mapping
const MONTH_NAMES = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
};

const MetasTab = ({ filters }) => {
    // Data States
    const [resumo, setResumo] = useState(null);
    const [metasPorMes, setMetasPorMes] = useState([]);
    const [atingimento, setAtingimento] = useState([]);
    const [variacao, setVariacao] = useState([]);
    const [analiseDiaria, setAnaliseDiaria] = useState([]);
    const [matrizAcao, setMatrizAcao] = useState([]);
    const [statusIndustrias, setStatusIndustrias] = useState([]);
    const [analiseSemanal, setAnaliseSemanal] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get current month number from filters
    const getMesNumero = (mesNome) => {
        const meses = {
            'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
            'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
            'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12,
            'Todos': 12 // Default to December for "Todos"
        };
        return meses[mesNome] || 12;
    };

    const mesAtual = getMesNumero(filters?.mes);
    const anoAtual = filters?.ano || 2025;

    // Fetch all data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);

            const industria = filters?.industria !== 'Todos' ? filters?.industria : null;

            try {
                const [
                    resResumo,
                    resPorMes,
                    resAtingimento,
                    resVariacao,
                    resAnaliseDiaria,
                    resMatriz,
                    resStatus,
                    resAnaliseSemanal
                ] = await Promise.all([
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/resumo'), {
                        params: { ano: anoAtual, mes: mesAtual, industria }
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/por-mes'), {
                        params: { ano: anoAtual, industria }
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/atingimento'), {
                        params: { ano: anoAtual, mes_ate: mesAtual, industria }
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/variacao'), {
                        params: { ano: anoAtual, mes: mesAtual, industria }
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/analise-diaria'), {
                        params: { ano: anoAtual, mes: mesAtual, industria }
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/matriz-acao'), {
                        params: { ano: anoAtual, mes_ate: mesAtual }  // Sem filtro de indústria - mostra todas
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/status'), {
                        params: { ano: anoAtual, mes_ate: mesAtual }  // Sem filtro de indústria - mostra todas
                    }),
                    axios.get(getApiUrl(PYTHON_API_URL, '/api/metas/analise-semanal'), {
                        params: { ano: anoAtual, mes: mesAtual, industria }
                    })
                ]);

                setResumo(resResumo.data?.data || {});
                setMetasPorMes(resPorMes.data?.data || []);
                setAtingimento(resAtingimento.data?.data || []);
                setVariacao(resVariacao.data?.data || []);
                setAnaliseDiaria(resAnaliseDiaria.data?.data || []);
                setMatrizAcao(resMatriz.data?.data || []);
                setStatusIndustrias(resStatus.data?.data || []);
                setAnaliseSemanal(resAnaliseSemanal.data?.data || []);
            } catch (err) {
                console.error('[MetasTab] Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [anoAtual, mesAtual, filters?.industria]);

    // Calculate additional KPIs
    const metasTotais = useMemo(() => {
        const total = atingimento.reduce((acc, item) => acc + (parseFloat(item.meta_total) || 0), 0);
        const realizado = atingimento.reduce((acc, item) => acc + (parseFloat(item.realizado_total) || 0), 0);
        const atingidas = atingimento.filter(item => item.status === 'Acima' || parseFloat(item.percentual_atingimento) >= 100).length;
        return { total, realizado, atingidas, percentual: total > 0 ? (realizado / total * 100) : 0 };
    }, [atingimento]);

    // Bar Chart Data
    const barChartData = useMemo(() => ({
        labels: atingimento.slice(0, 10).map(item => item.industria_nome || 'N/A'),
        datasets: [{
            label: '% Atingimento',
            data: atingimento.slice(0, 10).map(item => parseFloat(item.percentual_atingimento) || 0),
            backgroundColor: atingimento.slice(0, 10).map(item => {
                const perc = parseFloat(item.percentual_atingimento) || 0;
                if (perc >= 100) return '#10b981';
                if (perc >= 80) return '#f59e0b';
                return '#ef4444';
            }),
            borderRadius: 8,
            borderWidth: 0
        }]
    }), [atingimento]);

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (context) => `${context.parsed.y.toFixed(2)}%`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 120,
                ticks: {
                    callback: (value) => value + '%',
                    font: { size: 12, weight: '600' },
                    color: '#64748b'
                },
                grid: { color: '#f1f5f9' }
            },
            x: {
                ticks: {
                    font: { size: 10, weight: '700' },
                    color: '#475569',
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: { display: false }
            }
        }
    };

    // Scatter Chart Data (Matriz de Ação)
    const scatterChartData = useMemo(() => {
        const grupos = {
            critico: { label: 'CRÍTICO', data: [], color: '#ef4444' },
            atencao: { label: 'ATENÇÃO', data: [], color: '#f59e0b' },
            monitorar: { label: 'MONITORAR', data: [], color: '#3b82f6' },
            ok: { label: 'OK', data: [], color: '#10b981' }
        };

        matrizAcao.forEach(item => {
            const ponto = {
                x: parseFloat(item.percentual_meta) || 0,
                y: parseFloat(item.valor_realizado) || 0,
                label: item.industria_nome
            };
            const prioridade = (item.prioridade || '').toLowerCase();
            if (prioridade === 'crítico') grupos.critico.data.push(ponto);
            else if (prioridade === 'atenção') grupos.atencao.data.push(ponto);
            else if (prioridade === 'monitorar') grupos.monitorar.data.push(ponto);
            else grupos.ok.data.push(ponto);
        });

        return {
            datasets: Object.values(grupos).filter(g => g.data.length > 0).map(g => ({
                label: g.label,
                data: g.data,
                backgroundColor: g.color,
                borderColor: g.color,
                pointRadius: 10,
                pointHoverRadius: 14
            }))
        };
    }, [matrizAcao]);

    const scatterChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { font: { size: 11, weight: '700' }, padding: 12, usePointStyle: true }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                callbacks: {
                    label: (context) => [
                        context.raw.label,
                        `% Meta: ${context.parsed.x.toFixed(2)}%`,
                        `Valor: ${formatCurrency(context.parsed.y)}`
                    ]
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Valor Realizado (R$)', font: { size: 12, weight: '700' }, color: '#475569' },
                ticks: {
                    callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'K',
                    font: { size: 11, weight: '600' },
                    color: '#64748b'
                },
                grid: { color: '#f1f5f9' }
            },
            x: {
                title: { display: true, text: '% da Meta Atingida', font: { size: 12, weight: '700' }, color: '#475569' },
                ticks: {
                    callback: (value) => value + '%',
                    font: { size: 11, weight: '600' },
                    color: '#64748b'
                },
                grid: { color: '#f1f5f9' }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-10">
                <Activity className="animate-spin text-blue-500 mr-3" size={32} />
                <span className="text-slate-500 font-semibold">Carregando Dashboard de Metas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-10">
                <AlertTriangle className="text-red-500 mr-3" size={32} />
                <span className="text-red-500 font-semibold">Erro ao carregar dados: {error}</span>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-y-auto h-full bg-slate-50 space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card M-1 */}
                <KPICard
                    label="Mês Anterior (M-1)"
                    value={formatCurrency(resumo?.total_mes_anterior)}
                    subtext={MONTH_NAMES[mesAtual === 1 ? 12 : mesAtual - 1]}
                    color="blue"
                    icon={<Calendar size={20} />}
                />

                {/* Card Atual */}
                <KPICard
                    label="Mês Atual"
                    value={formatCurrency(resumo?.total_mes_atual)}
                    subtext={`${formatPercent(resumo?.variacao_percentual)} vs M-1`}
                    color={parseFloat(resumo?.variacao_percentual) >= 0 ? 'green' : 'red'}
                    icon={parseFloat(resumo?.variacao_percentual) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    trend={resumo?.variacao_percentual}
                />

                {/* Card Meta Ano */}
                <KPICard
                    label="Meta Total Ano"
                    value={formatCurrency(metasTotais.total)}
                    subtext={`Realizado: ${metasTotais.percentual.toFixed(0)}%`}
                    color="amber"
                    icon={<Target size={20} />}
                />

                {/* Card Indústrias Atingindo */}
                <KPICard
                    label="Indústrias Atingindo Meta"
                    value={`${metasTotais.atingidas} / ${atingimento.length}`}
                    subtext={`${atingimento.length > 0 ? ((metasTotais.atingidas / atingimento.length) * 100).toFixed(1) : 0}% do total`}
                    color="green"
                    icon={<CheckCircle size={20} />}
                />
            </div>

            {/* TABELA PIVOTADA ESTILO POWER BI */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Target className="text-blue-500" size={20} />
                        Metas
                    </h3>
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-md text-xs font-bold">
                        Entre ano atual e ano anterior
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="text-left py-3 px-2 font-bold text-slate-600 border-b-2 border-slate-200 min-w-[150px]">
                                    Indústria
                                </th>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <th key={i + 1} className="text-right py-3 px-2 font-bold text-slate-600 border-b-2 border-slate-200 min-w-[85px]">
                                        {['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][i]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Get unique industries - filter out empty names */}
                            {(() => {
                                const industrias = [...new Set(metasPorMes.map(m => m.industria_nome))]
                                    .filter(nome => nome && nome.trim() !== '');

                                return industrias.map((industria, idx) => {
                                    const dadosIndustria = metasPorMes.filter(m => m.industria_nome === industria);

                                    // Build data by month
                                    const mesesData = {};
                                    dadosIndustria.forEach(d => {
                                        mesesData[d.mes] = d;
                                    });

                                    return (
                                        <React.Fragment key={idx}>
                                            {/* Industry Name Header */}
                                            <tr className="bg-slate-700">
                                                <td colSpan={13} className="py-2.5 px-4 font-bold text-sm uppercase tracking-wide" style={{ color: '#ffffff' }}>
                                                    {industria || 'Indústria não identificada'}
                                                </td>
                                            </tr>

                                            {/* Row 1: Ano Anterior */}
                                            <tr className="hover:bg-slate-50 border-b border-slate-100">
                                                <td className="py-2 px-2 text-slate-600 font-medium">Ano anterior</td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mes = i + 1;
                                                    const valor = mesesData[mes]?.ano_anterior || 0;
                                                    return (
                                                        <td key={mes} className="py-2 px-2 text-right text-slate-700 font-semibold">
                                                            {valor > 0 ? new Intl.NumberFormat('pt-BR').format(valor) : '0'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Row 2: Meta ano corrente */}
                                            <tr className="hover:bg-slate-50 border-b border-slate-100">
                                                <td className="py-2 px-2 text-slate-600 font-medium">Meta ano corrente</td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mes = i + 1;
                                                    const valor = mesesData[mes]?.meta_ano_corrente || 0;
                                                    return (
                                                        <td key={mes} className="py-2 px-2 text-right text-blue-600 font-semibold">
                                                            {valor > 0 ? new Intl.NumberFormat('pt-BR').format(valor) : '0'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Row 3: Vendas ano corrente */}
                                            <tr className="hover:bg-slate-50 border-b border-slate-100">
                                                <td className="py-2 px-2 text-slate-600 font-medium">Vendas ano corrente</td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mes = i + 1;
                                                    const valor = mesesData[mes]?.vendas_ano_corrente || 0;
                                                    return (
                                                        <td key={mes} className="py-2 px-2 text-right text-slate-800 font-semibold">
                                                            {valor > 0 ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor) : '0'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Row 4: % Atingido da meta */}
                                            <tr className="hover:bg-slate-50 border-b border-slate-100">
                                                <td className="py-2 px-2 text-slate-600 font-medium">% Atingido da meta</td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mes = i + 1;
                                                    const perc = parseFloat(mesesData[mes]?.perc_atingimento) || 0;
                                                    const meta = parseFloat(mesesData[mes]?.meta_ano_corrente) || 0;
                                                    const isPositive = perc >= 100;
                                                    const color = meta === 0 ? 'text-slate-500' : isPositive ? 'text-emerald-600' : 'text-red-600';

                                                    return (
                                                        <td key={mes} className="py-2 px-2 text-right font-bold">
                                                            <span className={color}>
                                                                {perc !== 0 ? `${perc.toFixed(2)}%` : '0,00%'}
                                                            </span>
                                                            {meta !== 0 && (
                                                                isPositive
                                                                    ? <TrendingUp size={12} className="inline ml-1 text-emerald-500" />
                                                                    : <TrendingDown size={12} className="inline ml-1 text-red-500" />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Row 5: % Em relação ao ano ant. */}
                                            <tr className="hover:bg-slate-50 border-b-2 border-slate-200">
                                                <td className="py-2 px-2 text-slate-600 font-medium">% Em relação ao ano ant.</td>
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const mes = i + 1;
                                                    const perc = parseFloat(mesesData[mes]?.perc_relacao_ano_ant) || 0;
                                                    const isPositive = perc > 0;
                                                    const isNegative = perc < 0;
                                                    const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500';

                                                    return (
                                                        <td key={mes} className="py-2 px-2 text-right font-bold">
                                                            <span className={color}>
                                                                {perc !== 0 ? `${perc > 0 ? '+' : ''}${perc.toFixed(2)}%` : '0,00%'}
                                                            </span>
                                                            {isPositive && <TrendingUp size={12} className="inline ml-1 text-emerald-500" />}
                                                            {isNegative && <TrendingDown size={12} className="inline ml-1 text-red-500" />}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ANALYSIS GRID: 4 Cards em linha */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* 1. Metas Mensais */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Target className="text-blue-500" size={16} />
                            Metas Mensais
                        </h3>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {anoAtual}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-white">
                                <tr className="text-slate-500 text-[10px] uppercase">
                                    <th className="text-left py-1.5 font-medium">Mês</th>
                                    <th className="text-right py-1.5 font-medium">Meta</th>
                                    <th className="text-right py-1.5 font-medium">Real.</th>
                                    <th className="text-center py-1.5 pr-2 font-medium">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => {
                                    const dadosMes = metasPorMes.filter(m => m.mes === mes);
                                    const metaTotal = dadosMes.reduce((acc, m) => acc + (parseFloat(m.meta_ano_corrente) || 0), 0);
                                    const realizadoTotal = dadosMes.reduce((acc, m) => acc + (parseFloat(m.vendas_ano_corrente) || 0), 0);
                                    const percAtingimento = metaTotal > 0 ? (realizadoTotal / metaTotal * 100) : 0;

                                    if (metaTotal === 0 && realizadoTotal === 0) return null;

                                    return (
                                        <tr key={mes} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-1.5 text-slate-700">{MONTH_NAMES[mes]?.slice(0, 3)}</td>
                                            <td className="py-1.5 text-right text-slate-700">{formatCurrency(metaTotal)}</td>
                                            <td className="py-1.5 text-right text-slate-800">{formatCurrency(realizadoTotal)}</td>
                                            <td className="py-1.5 text-center pr-2">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${percAtingimento >= 98 ? 'bg-emerald-100 text-emerald-700' : percAtingimento >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {percAtingimento.toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Análise Diária */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Calendar className="text-amber-500" size={16} />
                            Análise Diária
                        </h3>
                        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {MONTH_NAMES[mesAtual]}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-white">
                                <tr className="text-slate-500 text-[10px] uppercase">
                                    <th className="text-left py-1.5 font-medium">Dia</th>
                                    <th className="text-right py-1.5 font-medium">(M-1)</th>
                                    <th className="text-right py-1.5 font-medium">Atual</th>
                                    <th className="text-right py-1.5 pr-2 font-medium">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analiseDiaria.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-1.5 text-slate-700">{item.dia}</td>
                                        <td className="py-1.5 text-right text-slate-700">{formatNumber(item.mes_anterior)}</td>
                                        <td className="py-1.5 text-right text-slate-800">{formatNumber(item.mes_atual)}</td>
                                        <td className={`py-1.5 text-right pr-2 ${parseFloat(item.variacao_percentual) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {parseFloat(item.variacao_percentual) >= 0 ? '+' : ''}{parseFloat(item.variacao_percentual).toFixed(0)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Análise por Semana */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <BarChart3 className="text-violet-500" size={16} />
                            Análise por Semana
                        </h3>
                        <span className="bg-violet-50 text-violet-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {MONTH_NAMES[mesAtual]}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-white">
                                <tr className="text-slate-500 text-[10px] uppercase">
                                    <th className="text-left py-1.5 font-medium">Indústria</th>
                                    <th className="text-right py-1.5 font-medium">S1</th>
                                    <th className="text-right py-1.5 font-medium">S2</th>
                                    <th className="text-right py-1.5 font-medium">S3</th>
                                    <th className="text-right py-1.5 font-medium">S4</th>
                                    <th className="text-right py-1.5 pr-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Usando dados de analise semanal se disponível */}
                                {analiseSemanal.length > 0 ? analiseSemanal.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-1.5 text-slate-800 font-bold truncate max-w-[80px]">{item.industria_nome}</td>
                                        <td className="py-1.5 text-right text-slate-700">{formatNumber(item.semana_1 || 0)}</td>
                                        <td className="py-1.5 text-right text-slate-700">{formatNumber(item.semana_2 || 0)}</td>
                                        <td className="py-1.5 text-right text-slate-700">{formatNumber(item.semana_3 || 0)}</td>
                                        <td className="py-1.5 text-right text-slate-700">{formatNumber(item.semana_4 || 0)}</td>
                                        <td className="py-1.5 text-right pr-2 text-slate-800">{formatNumber(item.total || 0)}</td>
                                    </tr>
                                )) : statusIndustrias.slice(0, 10).map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-1.5 text-slate-800 font-bold truncate max-w-[80px]">{item.industria_nome}</td>
                                        <td className="py-1.5 text-right text-slate-400">-</td>
                                        <td className="py-1.5 text-right text-slate-400">-</td>
                                        <td className="py-1.5 text-right text-slate-400">-</td>
                                        <td className="py-1.5 text-right text-slate-400">-</td>
                                        <td className="py-1.5 text-right pr-2 text-slate-800">{formatNumber(item.atual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Status das Metas */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <CheckCircle className="text-emerald-500" size={16} />
                            Metas Atingidas
                        </h3>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {MONTH_NAMES[mesAtual]}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-white">
                                <tr className="text-slate-500 text-[10px] uppercase">
                                    <th className="text-left py-1.5 font-medium">Indústria</th>
                                    <th className="text-right py-1.5 font-medium">Atual</th>
                                    <th className="text-right py-1.5 font-medium">% Meta</th>
                                    <th className="text-right py-1.5 font-medium">Saldo</th>
                                    <th className="text-center py-1.5 pr-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statusIndustrias.map((item, idx) => {
                                    const saldo = parseFloat(item.saldo) || 0;
                                    const percentual = parseFloat(item.percentual_meta) || 0;
                                    // Status: >=98% Atingido (verde), 90-98% A caminho (amarelo), <90% Em risco (vermelho)
                                    const statusLabel = percentual >= 98 ? 'Atingido' : percentual >= 90 ? 'A caminho' : percentual === 0 ? 'Sem Meta' : 'Em risco';
                                    const statusColor = percentual >= 98 ? 'bg-emerald-100 text-emerald-700' : percentual >= 90 ? 'bg-amber-100 text-amber-700' : percentual === 0 ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700';

                                    return (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-1.5 text-slate-800 font-bold truncate max-w-[80px]">{item.industria_nome}</td>
                                            <td className="py-1.5 text-right text-slate-800">{formatNumber(item.atual)}</td>
                                            <td className={`py-1.5 text-right ${percentual >= 98 ? 'text-emerald-600' : percentual >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {percentual.toFixed(2)}%
                                            </td>
                                            <td className={`py-1.5 text-right ${saldo <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {saldo <= 0 ? formatNumber(Math.abs(saldo)) : formatNumber(-saldo)}
                                            </td>
                                            <td className="py-1.5 text-center pr-2">
                                                <span className={`text-[9px] font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* BOTTOM GRID: Matriz de Ação */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                {/* Scatter Plot - Matriz de Ação */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Target className="text-violet-500" size={18} />
                            Matriz de Ação de Metas
                        </h3>
                        <span className="bg-violet-50 text-violet-600 px-2 py-1 rounded-md text-[10px] font-bold">
                            Onde focar?
                        </span>
                    </div>
                    <div className="h-[320px]">
                        {matrizAcao.length > 0 ? (
                            <Scatter data={scatterChartData} options={scatterChartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                Sem dados para matriz de ação
                            </div>
                        )}
                    </div>
                </div>

                {/* Status das Metas removido pois já existe no card 4 */}
            </div>

            {/* Narrativas Inteligentes (IA) */}
            <MetasNarratives filters={filters} />
        </div>
    );
};

// ==================== SUB-COMPONENTS ====================

const KPICard = ({ label, value, subtext, color, icon, trend }) => {
    const colorMap = {
        blue: 'border-l-blue-500',
        green: 'border-l-emerald-500',
        red: 'border-l-red-500',
        amber: 'border-l-amber-500'
    };

    return (
        <div className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm border-l-4 ${colorMap[color]} transition-all hover:shadow-md hover:-translate-y-1`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`text-${color === 'amber' ? 'amber' : color}-500`}>{icon}</div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-2xl font-black text-slate-800 mb-1">{value}</div>
            <div className={`text-xs font-semibold flex items-center gap-1 ${trend !== undefined ? (parseFloat(trend) >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-400'}`}>
                {trend !== undefined && parseFloat(trend) >= 0 && <ArrowUpRight size={14} />}
                {trend !== undefined && parseFloat(trend) < 0 && <ArrowDownRight size={14} />}
                {subtext}
            </div>
        </div>
    );
};

const StatusBadge = ({ value }) => {
    const perc = parseFloat(value) || 0;
    let bgColor, textColor, text;

    if (perc >= 100) {
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-700';
        text = `${perc.toFixed(1)}%`;
    } else if (perc >= 80) {
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-700';
        text = `${perc.toFixed(1)}%`;
    } else {
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        text = `${perc.toFixed(1)}%`;
    }

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${bgColor} ${textColor}`}>
            {text}
        </span>
    );
};

const StatusBadgeText = ({ status }) => {
    const statusMap = {
        'Atingida': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
        'Em Risco': { bg: 'bg-amber-100', text: 'text-amber-700' },
        'Sem Meta': { bg: 'bg-red-100', text: 'text-red-700' }
    };

    const style = statusMap[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}>
            {status || 'N/A'}
        </span>
    );
};

const TrendIcon = ({ trend }) => {
    if (trend === '↗') return <span className="text-emerald-500 font-bold">↗</span>;
    if (trend === '↘') return <span className="text-red-500 font-bold">↘</span>;
    return <span className="text-slate-400 font-bold">→</span>;
};

const getProgressColor = (value) => {
    if (value >= 100) return 'bg-emerald-500';
    if (value >= 80) return 'bg-amber-500';
    return 'bg-red-500';
};

export default MetasTab;
