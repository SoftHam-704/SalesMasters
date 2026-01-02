import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, TrendingDown, Package, ShoppingCart, Users, Archive, AlertCircle } from 'lucide-react';
import NarrativesWidget from '../components/NarrativesWidget';
import LollipopChart from '../charts/LollipopChart';
import FunnelAreaChart from '../charts/FunnelAreaChart';
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Helpers
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val);
const formatPercent = (val) => `${val?.toFixed(1) || '0.0'}%`;

// Mapping months to numeric strings for API calls
const monthsMap = {
    'Todos': 'Todos',
    'Janeiro': '01',
    'Fevereiro': '02',
    'Março': '03',
    'Abril': '04',
    'Maio': '05',
    'Junho': '06',
    'Julho': '07',
    'Agosto': '08',
    'Setembro': '09',
    'Outubro': '10',
    'Novembro': '11',
    'Dezembro': '12'
};

const IndustriasTab = ({ filters }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [topIndustries, setTopIndustries] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get List of Industries to pick one if needed
                let targetId = null;

                // 1. Fetch Top Industries list
                const indRes = await axios.get('http://localhost:8000/api/dashboard/top-industries', {
                    params: { ano: filters.ano, mes: monthsMap[filters.mes] || 'Todos' }
                });

                if (indRes.data?.success && indRes.data.data.length > 0) {
                    setTopIndustries(indRes.data.data);
                }

                // 2. Determine Target ID
                if (filters.industria && filters.industria !== 'Todos') {
                    targetId = filters.industria;
                } else if (indRes.data?.success && indRes.data.data.length > 0) {
                    targetId = indRes.data.data[0].codigo;
                }

                if (targetId) {
                    const detailsRes = await axios.get('http://localhost:8000/api/dashboard/industry-details', {
                        params: {
                            ano: filters.ano,
                            mes: monthsMap[filters.mes] || 'Todos',
                            industryId: targetId,
                            metrica: filters.metrica || 'valor'
                        }
                    });
                    if (detailsRes.data?.success) {
                        setData(detailsRes.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching industry details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters.ano, filters.mes, filters.industria, filters.metrica]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p>Selecione uma indústria para visualizar os detalhes.</p>
            </div>
        );
    }

    const { funnel, sparkline, clients, monthly_sales, orders, metadata, narrative } = data;
    const currentIndustry = metadata || (topIndustries.length > 0 ? topIndustries[0] : { nome: 'Indústria', percentual: 0 });

    return (
        <div className="h-full overflow-y-auto p-4 scroll-smooth font-['Roboto'] bg-slate-50/50">

            {/* Header Area */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-800">
                    Análise de desempenho por Indústrias
                </h2>
            </div>

            {/* Narrative Widget */}
            {narrative && (
                <div className="mb-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏭</span>
                            <span className="font-bold text-slate-700">Indústria analisada:</span>
                            <span className="font-black text-slate-900">{narrative.industria_nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <span className="text-slate-600">O desempenho mensal mostra um</span>
                            <span className="font-black text-emerald-600">atingimento médio da meta de {narrative.atingimento_meta}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <span className="font-bold text-slate-700">Melhor mês:</span>
                            <span className="text-slate-600">{narrative.melhor_mes?.nome}</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-emerald-600 font-bold">variação vs LY de +{narrative.melhor_mes?.variacao_yoy}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span className="font-bold text-slate-700">Pior mês:</span>
                            <span className="text-slate-600">{narrative.pior_mes?.nome}</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-red-500 font-bold">variação vs LY de {narrative.pior_mes?.variacao_yoy}%</span>
                        </div>
                        <div className="flex items-start gap-2 mt-1 pt-2 border-t border-emerald-100">
                            <span className="text-lg">💡</span>
                            <span className="font-bold text-slate-700">Interpretação rápida:</span>
                            <span className="text-slate-500 text-xs leading-relaxed">{narrative.interpretacao}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Top Section: Photo/Share + Funnel */}
            <div className="grid grid-cols-12 gap-4 mb-4">

                {/* 1. Industry Identity, Share & Portfolio (Col 4) */}
                <div className="col-span-4 flex gap-2 h-[140px]">
                    {/* Industry Logo */}
                    <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center p-2">
                        {currentIndustry.imagem_url ? (
                            <img
                                src={currentIndustry.imagem_url}
                                alt={currentIndustry.nome || 'Logo'}
                                className="w-full h-full object-contain rounded-lg"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div className={`w-full h-full bg-slate-100 rounded-lg items-center justify-center text-slate-300 ${currentIndustry.imagem_url ? 'hidden' : 'flex'}`}>
                            <BuildingGenericIcon />
                        </div>
                    </div>
                    {/* Market Share Card */}
                    <div className="w-1/3 bg-[#1a2e35] rounded-xl shadow-sm text-white p-3 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <p className="text-xs font-semibold text-emerald-100/80 mb-1 text-center">Participação</p>
                        <h3 className="text-2xl font-black text-center tracking-tight">
                            {formatPercent(currentIndustry.percentual)}
                        </h3>
                    </div>
                    {/* Portfolio Card (Green) */}
                    <div className="w-1/3 bg-[#488e73] rounded-xl shadow-sm text-white p-3 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <p className="text-xs font-semibold text-emerald-100/80 mb-1 text-center">Portfólio</p>
                        <h3 className="text-xl font-black text-center tracking-tight">
                            {formatNumber(funnel.portfolio?.sold || 0)}
                        </h3>
                        <p className="text-[9px] text-center text-emerald-100/80">
                            % Vendido
                        </p>
                        <p className="text-sm font-bold text-center">
                            {(funnel.portfolio?.coverage_pct || 0).toFixed(2)}%
                        </p>
                    </div>
                </div>

                {/* 2. Funnel Cards with Evolution Chart (Col 8) */}
                <div className="col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    {/* Title */}
                    <div className="px-4 pt-3 pb-1">
                        <h3 className="text-sm font-bold text-slate-700">Funil de vendas</h3>
                    </div>

                    {/* Cards Container - Aligned Top */}
                    <div className="flex justify-between items-start px-4 pb-2">

                        {/* 1. Vendas */}
                        <div className="border-l-4 border-purple-800 pl-3 py-1">
                            <p className="text-sm font-bold text-slate-800">Vendas</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{formatCurrency(funnel.vendas.value)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">LM {formatCurrency(funnel.vendas.prev)}</span>
                                <span className={`text-[10px] font-bold ${funnel.vendas.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {funnel.vendas.delta >= 0 ? '▲' : '▼'}{Math.abs(funnel.vendas.delta).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* 2. Quantidades */}
                        <div className="border-l-4 border-purple-800 pl-3 py-1">
                            <p className="text-sm font-bold text-slate-800">Quantidades</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{formatNumber(funnel.quantidades.value)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">LM {formatNumber(funnel.quantidades.prev)}</span>
                                <span className={`text-[10px] font-bold ${funnel.quantidades.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {funnel.quantidades.delta >= 0 ? '▲' : '▼'}{Math.abs(funnel.quantidades.delta).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* 3. Unidades (SKUs) */}
                        <div className="border-l-4 border-purple-800 pl-3 py-1">
                            <p className="text-sm font-bold text-slate-800">Unidades</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{formatNumber(funnel.unidades.value)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">LM {formatNumber(funnel.unidades.prev)}</span>
                                <span className={`text-[10px] font-bold ${funnel.unidades.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {funnel.unidades.delta >= 0 ? '▲' : '▼'}{Math.abs(funnel.unidades.delta).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* 4. Pedidos */}
                        <div className="border-l-4 border-purple-800 pl-3 py-1">
                            <p className="text-sm font-bold text-slate-800">Pedidos</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{formatNumber(funnel.pedidos.value)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">LM {formatNumber(funnel.pedidos.prev)}</span>
                                <span className={`text-[10px] font-bold ${funnel.pedidos.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {funnel.pedidos.delta >= 0 ? '▲' : '▼'}{Math.abs(funnel.pedidos.delta).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Monthly Evolution Chart - Below Cards (Line/Area Chart) */}
                    <div className="flex-1 min-h-[60px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthly_sales} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="funnelEvolutionGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#15803d" stopOpacity={0.9} />
                                        <stop offset="50%" stopColor="#22c55e" stopOpacity={0.7} />
                                        <stop offset="100%" stopColor="#86efac" stopOpacity={0.5} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    cursor={{ stroke: '#ea580c', strokeWidth: 1 }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                    formatter={(val) => [filters.metrica === 'valor' ? formatCurrency(val) : formatNumber(val), filters.metrica || 'Valor']}
                                    labelFormatter={(label) => `Mês: ${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="vendas"
                                    stroke="#ea580c"
                                    strokeWidth={1}
                                    fill="url(#funnelEvolutionGradient)"
                                    dot={{ r: 3, fill: '#ea580c', strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Narratives Section */}
            <div className="mb-4">
                <NarrativesWidget loading={false} data={null} /> {/* Reusing the widget logic, passing global context implicitly via internal fetching or props if needed */}
                {/* For this specific screen, the print shows custom text lines. We can use the NarrativeWidget or render static text if preferred. 
                     The user liked the widget, so keeping it is safe, but maybe we can customize it later to be more 'line-based' like the print.
                 */}
            </div>

            {/* Bottom Grid: Clients, Sales Chart, Orders */}
            <div className="grid grid-cols-12 gap-4 h-[350px]">

                {/* 1. Client Analysis (Col 3) */}
                <div className="col-span-3 flex flex-col gap-2">
                    {/* Lollipop Chart Container */}
                    <div className="bg-slate-50 rounded-lg h-[120px] p-2 border border-slate-100 relative">
                        <div className="flex justify-center items-center">
                            <p className="text-md font-bold text-slate-500">Clientes atendidos ({formatNumber(Object.values(clients.matrix).reduce((a, b) => a + b.val, 0))})</p>
                        </div>
                        <LollipopChart data={clients.lollipop} />
                    </div>

                    {/* Matrix Cards */}
                    <div className="grid grid-cols-2 gap-2 flex-1">
                        <ClientCard label="CLIENTES NOVOS" value={clients.matrix.novos.val} percent={clients.matrix.novos.pct} color="bg-[#356169]" />
                        <ClientCard label="CLIENTES MANTIDOS" value={clients.matrix.mantidos.val} percent={clients.matrix.mantidos.pct} color="bg-[#598c73]" />
                        <ClientCard label="CLIENTES REATIVADOS" value={clients.matrix.reativados.val} percent={clients.matrix.reativados.pct} color="bg-[#9dbf89]" />
                        <ClientCard label="CLIENTES PERDIDOS" value={clients.matrix.perdidos.val} percent={clients.matrix.perdidos.pct} color="bg-[#b36b39]" />
                    </div>
                </div>

                {/* 2. Monthly Sales Chart (Col 5) */}
                <div className="col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
                    <div className="flex justify-center items-center mb-2">
                        <h3 className="text-md font-bold text-[#0077b6]">📈 Desempenho Mensal</h3>
                    </div>
                    {/* Subtitle/Delta */}
                    <p className={`text-xs font-bold text-center mb-4 ${funnel.vendas.delta < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {funnel.vendas.delta < 0 ? '↓' : '↑'} {Math.abs(funnel.vendas.delta).toFixed(1)}% (vs ano anterior)
                    </p>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthly_sales}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(Val) => formatCurrency(Val)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="vendas" radius={[4, 4, 0, 0]}>
                                    {monthly_sales.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.is_negative ? '#ef4444' : '#15803d'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* 3. Orders Table (Col 4) */}
                <div className="col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-center">
                        <h3 className="text-xs font-bold text-slate-600 uppercase">Pedidos realizados no período</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500">Nº Pedido</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500">Data</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500">Cliente</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((ord, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-1.5 text-[10px] font-medium text-slate-700">{ord.pedido}</td>
                                        <td className="px-3 py-1.5 text-[10px] text-slate-500">{ord.data}</td>
                                        <td className="px-3 py-1.5 text-[10px] text-slate-600 truncate max-w-[100px]" title={ord.cliente}>{ord.cliente}</td>
                                        <td className="px-3 py-1.5 text-[10px] font-bold text-slate-700 text-right">{formatCurrency(ord.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Sub-component for Client Matrix Cards
const ClientCard = ({ label, value, percent, color }) => (
    <div className={`${color} rounded-lg p-2 text-white flex flex-col justify-center items-center shadow-sm`}>
        <p className="text-[11px] font-semibold text-white/90 uppercase text-center leading-tight mb-1">{label.replace('CLIENTES ', '')}</p>
        <p className="text-2xl font-black">{value}</p>
        <div className="w-full border-t border-white/20 my-1"></div>
        <p className="text-xs opacity-90">% sobre o total</p>
        <p className="text-sm font-bold underline decoration-white/50 underline-offset-2">{percent.toFixed(2)} %</p>
    </div>
);

// Placeholder Icon
const BuildingGenericIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export default IndustriasTab;
