import React, { useState, useEffect } from 'react';
import axios from '../../../lib/axios';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    UserX,
    BarChart3,
    Loader2,
    Building2,
    Calendar,
    ShoppingCart,
    Target,
    AlertCircle,
    CheckCircle,
    Info,
    Search,
    User
} from 'lucide-react';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

// Estilos para scrollbar sempre visível
const scrollbarStyles = {
    overflowX: 'scroll',
    scrollbarWidth: 'thin',
    scrollbarColor: '#6366f1 #e2e8f0',
    WebkitOverflowScrolling: 'touch'
};

// Formatters
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
};

// Utils para o novo padrão visual
const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(p => p.length > 2);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-purple-100 text-purple-600',
        'bg-indigo-100 text-indigo-600',
        'bg-teal-100 text-teal-600',
        'bg-orange-100 text-orange-600',
        'bg-pink-100 text-pink-600',
        'bg-slate-100 text-slate-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

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

const ClientesTab = ({ filters, refreshTrigger }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUf, setSelectedUf] = useState('Todos');
    const [evolutionData, setEvolutionData] = useState(null);
    const [vendedores, setVendedores] = useState([]);
    const [selectedVendedor, setSelectedVendedor] = useState('Todos');
    const [evolLoading, setEvolLoading] = useState(false);

    // Fetch filters options (vendedores)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/filters-options');
                const response = await axios.get(url);
                if (response.data && response.data.vendedores) {
                    setVendedores(response.data.vendedores);
                }
            } catch (error) {
                console.error('Erro ao buscar filtros:', error);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Main Client Data
    useEffect(() => {
        const fetchClientData = async () => {
            setLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    mes: monthsMap[filters.mes] || 'Todos',
                    industryId: filters.industria !== 'Todos' ? filters.industria : null,
                    metrica: filters.metrica.toLowerCase(),
                    uf: selectedUf !== 'Todos' ? selectedUf : null,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                };

                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/client-details');
                const response = await axios.get(url, { params });

                if (response.data && response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Erro ao buscar dados de clientes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [filters.ano, filters.mes, filters.industria, filters.metrica, filters.startDate, filters.endDate, selectedUf, refreshTrigger]);

    // Fetch Evolution Matrix Data
    useEffect(() => {
        const fetchEvolution = async () => {
            setEvolLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    industryId: filters.industria !== 'Todos' ? filters.industria : null,
                    metrica: filters.metrica.toLowerCase(),
                    vendedorId: selectedVendedor !== 'Todos' ? selectedVendedor : null
                };

                const url = getApiUrl(PYTHON_API_URL, '/api/dashboard/client-monthly-evolution');
                const response = await axios.get(url, { params });
                setEvolutionData(response.data);
            } catch (error) {
                console.error('Erro ao buscar evolução de clientes:', error);
            } finally {
                setEvolLoading(false);
            }
        };

        fetchEvolution();
    }, [filters.ano, filters.industria, filters.metrica, selectedVendedor, refreshTrigger]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-5 scroll-smooth">
            {/* Header com filtro de UF */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                        <Users className="text-white" size={20} />
                    </div>
                    <div>
                        <h2 className="font-['Roboto'] text-lg font-bold text-slate-800">Análise de desempenho por Clientes</h2>
                        <p className="font-['Roboto'] text-xs text-slate-500">{filters.ano} • {filters.mes} • {filters.metrica}</p>
                    </div>
                </div>

                {/* Filtro de UF */}
                <div className="flex items-center gap-2">
                    <label className="font-['Roboto'] text-xs font-bold text-slate-600">Estado:</label>
                    <select
                        value={selectedUf}
                        onChange={(e) => setSelectedUf(e.target.value)}
                        className="font-['Roboto'] text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="Todos">Todos</option>
                        {data?.active_inactive?.ufs_disponiveis?.map((uf) => (
                            <option key={uf} value={uf}>{uf}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid Layout: 3 Columns */}
            <div className="grid grid-cols-12 gap-4">

                {/* Column 1: Grupos + Ativos vs Inativos + Sem Compras */}
                <div className="col-span-4 flex flex-col gap-4">

                    {/* Análise por Grupo de Lojas e Indústrias */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 size={16} className="text-blue-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Análise por Grupo de Lojas</h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                            Veja o desempenho das diferentes lojas e indústrias em valor total de vendas e quantidade de pedidos realizados.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="font-['Roboto'] text-left px-3 py-2 font-bold text-slate-600">Grupo</th>
                                        <th className="font-['Roboto'] text-right px-3 py-2 font-bold text-slate-600">Valor</th>
                                        <th className="font-['Roboto'] text-right px-3 py-2 font-bold text-slate-600">Quant.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.groups?.slice(0, 10).map((item, idx) => (
                                        <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="font-['Roboto'] px-3 py-2 text-slate-700 font-medium truncate max-w-[120px]">{item.grupo}</td>
                                            <td className="font-['Roboto'] px-3 py-2 text-right text-slate-800 font-bold">{formatCurrency(item.valor)}</td>
                                            <td className="font-['Roboto'] px-3 py-2 text-right text-slate-600">{formatNumber(item.quantidade)}</td>
                                        </tr>
                                    ))}
                                    {(!data?.groups || data.groups.length === 0) && (
                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-400">Sem dados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Clientes Ativos vs Inativos */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 size={16} className="text-emerald-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Clientes Ativos vs Inativos</h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                            Compare mês a mês o total de clientes da indústria selecionada, quantos foram atendidos e quantos ficaram inativos.
                        </p>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                                <p className="font-['Roboto'] text-[10px] text-blue-600 font-bold uppercase">Carteira</p>
                                <p className="font-['Roboto'] text-lg font-black text-blue-700">{formatNumber(data?.active_inactive?.total_carteira)}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                <p className="font-['Roboto'] text-[10px] text-emerald-600 font-bold uppercase">Atendidos</p>
                                <p className="font-['Roboto'] text-lg font-black text-emerald-700">{formatNumber(data?.active_inactive?.total_atendidos)}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center">
                                <p className="font-['Roboto'] text-[10px] text-red-600 font-bold uppercase">Sem Compra</p>
                                <p className="font-['Roboto'] text-lg font-black text-red-700">
                                    {formatNumber((data?.active_inactive?.total_carteira || 0) - (data?.active_inactive?.total_atendidos || 0))}
                                </p>
                            </div>
                        </div>

                        {/* Monthly Table - Full width */}
                        <div className="overflow-hidden rounded-lg border border-slate-100 flex-1 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="font-['Roboto'] text-left px-3 py-2 font-bold text-slate-600">Mês</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Carteira</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Atendidos</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Sem compra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.active_inactive?.monthly?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-slate-50">
                                            <td className="font-['Roboto'] px-2 py-1.5 text-slate-700 font-medium">{item.mes}</td>
                                            <td className="font-['Roboto'] px-2 py-1.5 text-center text-slate-600">{item.clientes_ind}</td>
                                            <td className="font-['Roboto'] px-2 py-1.5 text-center text-emerald-600 font-bold">{item.atendidos}</td>
                                            <td className="font-['Roboto'] px-2 py-1.5 text-center text-red-500">{item.sem_compra}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Column 2: Ciclo Médio + Clientes Sem Compras */}
                <div className="col-span-4 flex flex-col gap-4">

                    {/* Comportamento de Compra: Ciclo Médio */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock size={16} className="text-amber-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Ciclo Médio de Compra</h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                            Clientes ordenados por dias sem comprar (priorizando quem está há mais tempo inativo).
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="font-['Roboto'] text-left px-3 py-2 font-bold text-slate-600">Clientes</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Pedidos</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Ciclo</th>
                                        <th className="font-['Roboto'] text-center px-3 py-2 font-bold text-slate-600">Dias s/compra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.purchase_cycle?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="font-['Roboto'] px-3 py-2 text-slate-700 truncate max-w-[100px]">{item.cliente}</td>
                                            <td className="font-['Roboto'] px-3 py-2 text-center text-slate-800 font-bold">{item.pedidos}</td>
                                            <td className="font-['Roboto'] px-3 py-2 text-center">
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    {item.ciclo} dias
                                                </span>
                                            </td>
                                            <td className="font-['Roboto'] px-3 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.dias_sem_compra > 90 ? 'bg-red-100 text-red-600' : item.dias_sem_compra > 45 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {item.dias_sem_compra}d
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.purchase_cycle || data.purchase_cycle.length === 0) && (
                                        <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">Sem dados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Clientes Sem Compras no Período */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <UserX size={16} className="text-red-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Clientes sem compras
                                <span className="text-red-500">({data?.no_purchase?.length || 0} de {data?.active_inactive?.sem_compra_total || 0})</span>
                            </h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-2">
                            Clientes da carteira que não compraram no período selecionado.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-100 flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="font-['Roboto'] text-left px-3 py-2 font-bold text-slate-600">#ID</th>
                                        <th className="font-['Roboto'] text-left px-3 py-2 font-bold text-slate-600">Nome</th>
                                        <th className="font-['Roboto'] text-right px-3 py-2 font-bold text-slate-600">Últ compra</th>
                                        <th className="font-['Roboto'] text-right px-3 py-2 font-bold text-slate-600">Dias</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.no_purchase?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="font-['Roboto'] px-3 py-1.5 text-slate-500 font-mono text-[10px]">{item.id}</td>
                                            <td className="font-['Roboto'] px-3 py-1.5 text-slate-700 truncate max-w-[140px]">{item.nome}</td>
                                            <td className="font-['Roboto'] px-3 py-1.5 text-right text-slate-600 text-[11px]">{item.ultima_compra || '-'}</td>
                                            <td className="font-['Roboto'] px-3 py-1.5 text-right">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.dias_sem_compra > 180 ? 'bg-red-100 text-red-600' : item.dias_sem_compra > 90 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {item.dias_sem_compra}d
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.no_purchase || data.no_purchase.length === 0) && (
                                        <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">Todos os clientes compraram no período!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Column 3: Top Clientes + Narrativas + Risco Churn */}
                <div className="col-span-4 flex flex-col gap-4">

                    {/* Clientes de Maior Impacto */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-emerald-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Clientes de Maior Impacto</h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                            Acompanhe as mudanças nos valores mês a mês e identifique tendências que impactam o resultado global das vendas.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                            <table className="w-full text-xs table-fixed">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="font-['Roboto'] text-center px-1 py-2 font-bold text-slate-600 w-[30px]">#</th>
                                        <th className="font-['Roboto'] text-left px-2 py-2 font-bold text-slate-600">Cliente</th>
                                        <th className="font-['Roboto'] text-right px-4 py-2 font-bold text-slate-600 w-[90px]">Valor</th>
                                        <th className="font-['Roboto'] text-center px-4 py-2 font-bold text-slate-600 w-[65px]">ΔMoM</th>
                                        <th className="font-['Roboto'] text-right px-3 py-2 font-bold text-slate-600 w-[85px]">Últ.compra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.top_clients?.map((item) => (
                                        <tr key={item.rank} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="font-['Roboto'] px-1 py-2 text-center text-slate-500">{item.rank}</td>
                                            <td className="font-['Roboto'] px-2 py-2 text-slate-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{item.cliente}</td>
                                            <td className="font-['Roboto'] px-4 py-2 text-right text-slate-800 font-bold">{formatCurrency(item.valor)}</td>
                                            <td className="font-['Roboto'] px-4 py-2 text-center">
                                                <span className={`inline-flex items-center gap-0.5 ${item.delta_mom >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {item.delta_mom >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                    <span className="font-bold">{Math.abs(item.delta_mom).toFixed(1)}%</span>
                                                </span>
                                            </td>
                                            <td className="font-['Roboto'] px-3 py-2 text-right text-slate-500 text-[11px]">{item.ultima_compra}</td>
                                        </tr>
                                    ))}
                                    {(!data?.top_clients || data.top_clients.length === 0) && (
                                        <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">Sem dados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Narrativas Inteligentes */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={16} className="text-amber-600" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-amber-800 uppercase tracking-wide">Narrativas Inteligentes</h3>
                        </div>

                        {/* Insight Cards */}
                        <div className="space-y-2">
                            {data?.top_clients?.length > 0 && (
                                <div className="bg-white/80 border-l-4 border-l-amber-500 rounded-r-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="font-['Roboto'] text-xs text-slate-700">
                                            <span className="font-bold">★</span> No período atual, os clientes <span className="font-bold text-amber-700">
                                                {data.top_clients.slice(0, 3).map(c => c.cliente).join(', ')}
                                            </span> se destacam como os de maior impacto, contribuindo com <span className="font-bold">{formatCurrency(data.top_clients.slice(0, 3).reduce((acc, c) => acc + c.valor, 0))}</span> em vendas.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {data?.top_clients?.some(c => c.delta_mom < -10) && (
                                <div className="bg-white/80 border-l-4 border-l-red-500 rounded-r-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="font-['Roboto'] text-xs text-slate-700">
                                            <span className="font-bold text-red-600">⚠</span> O cliente <span className="font-bold text-red-600">
                                                {data.top_clients.find(c => c.delta_mom < -10)?.cliente}
                                            </span> teve a maior queda de <span className="font-bold">{Math.abs(data.top_clients.find(c => c.delta_mom < -10)?.delta_mom).toFixed(1)}%</span>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {data?.churn_risk?.length > 0 && (
                                <div className="bg-white/80 border-l-4 border-l-orange-500 rounded-r-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <p className="font-['Roboto'] text-xs text-slate-700">
                                            <span className="font-bold">⚡</span> {data.churn_risk.filter(c => c.score === 'Alto').length} clientes com alto risco de churn podem gerar perda estimada de <span className="font-bold text-orange-600">
                                                {formatCurrency(data.churn_risk.filter(c => c.score === 'Alto').reduce((acc, c) => acc + (c.ticket * 12), 0))}
                                            </span>. Ação imediata recomendada para reativação!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(!data?.top_clients || data.top_clients.length === 0) && (
                                <div className="bg-white/80 rounded-lg p-3 text-center">
                                    <p className="font-['Roboto'] text-xs text-slate-500">Selecione uma indústria para ver insights detalhados.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risco de Perda de Clientes */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-red-500" />
                            <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">Risco de Perda de Clientes</h3>
                        </div>
                        <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                            Score de churn baseado em dias sem compra, frequência habitual e ticket médio.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-100 max-h-[200px] overflow-y-auto">
                            <table className="w-full text-xs table-fixed">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="font-['Roboto'] text-left px-2 py-2 font-bold text-slate-600">Cliente</th>
                                        <th className="font-['Roboto'] text-center px-1 py-2 font-bold text-slate-600 w-[50px]">Dias</th>
                                        <th className="font-['Roboto'] text-center px-1 py-2 font-bold text-slate-600 w-[45px]">Freq.</th>
                                        <th className="font-['Roboto'] text-right px-2 py-2 font-bold text-slate-600 w-[75px]">Ticket</th>
                                        <th className="font-['Roboto'] text-center px-1 py-2 font-bold text-slate-600 w-[55px]">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.churn_risk?.map((item, idx) => (
                                        <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="font-['Roboto'] px-2 py-2 text-slate-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{item.cliente}</td>
                                            <td className="font-['Roboto'] px-1 py-2 text-center text-slate-600 font-bold">{item.dias_sem_compra}</td>
                                            <td className="font-['Roboto'] px-1 py-2 text-center text-slate-600">{item.frequencia}</td>
                                            <td className="font-['Roboto'] px-2 py-2 text-right text-slate-800 font-bold">{formatCurrency(item.ticket)}</td>
                                            <td className="font-['Roboto'] px-1 py-2 text-center">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${item.score === 'Alto' ? 'bg-red-100 text-red-600' :
                                                    item.score === 'Medio' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.score === 'Alto' ? 'bg-red-500' :
                                                        item.score === 'Medio' ? 'bg-amber-500' :
                                                            'bg-emerald-500'
                                                        }`}></span>
                                                    {item.score}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.churn_risk || data.churn_risk.length === 0) && (
                                        <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">Sem dados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matriz Grupos de Lojas x Indústrias - Full Width */}
            {data?.store_industry_matrix?.industries?.length > 0 && (
                <div className="mt-4 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 size={16} className="text-indigo-500" />
                        <h3 className="font-['Roboto'] text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Matriz: Grupos de Lojas × Indústrias
                        </h3>
                        <span className="ml-auto text-xs text-slate-400">
                            Top 20 grupos • {filters.metrica === 'valor' ? 'Valores em R$' : filters.metrica === 'quantidade' ? 'Qtd. Vendida' : 'Produtos Únicos'}
                        </span>
                    </div>
                    <p className="font-['Roboto'] text-xs text-slate-400 mb-3">
                        Acumulado de cada grupo de lojas por indústria. Valores zerados indicam que não houve compras no período.
                    </p>
                    <div className="rounded-lg border border-slate-200" style={scrollbarStyles}>
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0">
                                <tr>
                                    <th className="font-['Roboto'] text-left px-4 py-3 text-sm font-bold text-white sticky left-0 bg-indigo-600 min-w-[180px] border-r border-indigo-500">
                                        GRUPO DE LOJAS
                                    </th>
                                    {data.store_industry_matrix.industries.map((ind, idx) => (
                                        <th
                                            key={idx}
                                            className="font-['Roboto'] text-center px-3 py-3 text-sm font-bold text-white min-w-[120px] whitespace-nowrap"
                                            title={ind}
                                        >
                                            {ind}
                                        </th>
                                    ))}
                                    <th className="font-['Roboto'] text-right px-4 py-3 text-sm font-bold text-yellow-300 bg-indigo-700 min-w-[120px] border-l border-indigo-500">
                                        TOTAL
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.store_industry_matrix.rows.map((row, idx) => (
                                    <tr key={idx} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors">
                                        <td className="font-['Roboto'] px-4 py-2.5 text-sm font-bold text-indigo-800 sticky left-0 bg-indigo-50 border-r border-indigo-100" title={row.grupo}>
                                            {row.grupo}
                                        </td>
                                        {data.store_industry_matrix.industries.map((ind, iIdx) => {
                                            const valor = row.values[ind] || 0;
                                            const hasValue = valor > 0;
                                            return (
                                                <td
                                                    key={iIdx}
                                                    className={`font-['Roboto'] px-3 py-2.5 text-sm text-right ${hasValue ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}
                                                >
                                                    {hasValue ? (filters.metrica === 'valor' ? formatCurrency(valor) : formatNumber(valor)) : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="font-['Roboto'] px-4 py-2.5 text-sm text-right text-indigo-700 font-bold bg-indigo-50 border-l border-indigo-100">
                                            {filters.metrica === 'valor' ? formatCurrency(row.total) : formatNumber(row.total)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data.store_industry_matrix.rows || data.store_industry_matrix.rows.length === 0) && (
                                    <tr>
                                        <td colSpan={data.store_industry_matrix.industries.length + 2} className="px-4 py-6 text-center text-slate-400 text-sm">
                                            Sem dados para o período selecionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gradient-to-r from-indigo-600 to-purple-600 font-bold">
                                <tr>
                                    <td className="font-['Roboto'] px-4 py-3 text-sm text-white sticky left-0 bg-indigo-600 border-r border-indigo-500">
                                        TOTAL GERAL
                                    </td>
                                    {data.store_industry_matrix.industries.map((ind, idx) => (
                                        <td key={idx} className="font-['Roboto'] px-3 py-3 text-sm text-right text-white">
                                            {filters.metrica === 'valor'
                                                ? formatCurrency(data.store_industry_matrix.totals[ind] || 0)
                                                : formatNumber(data.store_industry_matrix.totals[ind] || 0)}
                                        </td>
                                    ))}
                                    <td className="font-['Roboto'] px-4 py-3 text-sm text-right text-yellow-300 font-black bg-indigo-700 border-l border-indigo-500">
                                        {filters.metrica === 'valor'
                                            ? formatCurrency(data.store_industry_matrix.totals.total || 0)
                                            : formatNumber(data.store_industry_matrix.totals.total || 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Matriz de Evolução Mensal por Cliente - Layout Limpo */}
            <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-['Roboto'] text-base font-bold text-slate-800">
                                Evolução Mensal por Cliente
                            </h3>
                            <p className="font-['Roboto'] text-xs text-slate-500">
                                Ano {filters.ano} • Métrica: <span className="font-bold text-blue-600 capitalize">{filters.metrica}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <select
                            value={selectedVendedor}
                            onChange={(e) => setSelectedVendedor(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[180px]"
                        >
                            <option value="Todos">Todos os Vendedores</option>
                            {vendedores.map((v) => (
                                <option key={v.ven_codigo} value={v.ven_codigo}>{v.ven_nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto" style={scrollbarStyles}>
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-bold uppercase tracking-wide sticky left-0 bg-slate-50 z-20 min-w-[260px] border-r border-slate-200">
                                    Cliente
                                </th>
                                {(evolutionData?.columns || []).map((month) => (
                                    <th key={month} className="px-3 py-3 text-center font-bold min-w-[85px] whitespace-nowrap border-r border-slate-100 last:border-r-0">
                                        {month}
                                    </th>
                                ))}
                                <th className="text-right px-4 py-3 font-bold bg-slate-100 sticky right-0 z-20 min-w-[100px] border-l border-slate-200">
                                    TOTAL
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {evolLoading ? (
                                <tr>
                                    <td colSpan={(evolutionData?.columns?.length || 12) + 2} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-blue-500" size={28} />
                                            <span className="text-slate-400 text-xs font-medium">Carregando evolução...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (evolutionData?.rows && evolutionData.rows.length > 0) ? (
                                evolutionData.rows.slice(0, 50).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-blue-50/40 border-r border-slate-100 z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm flex-shrink-0 ${getAvatarColor(row.cliente)}`}>
                                                    {getInitials(row.cliente)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="block truncate font-bold text-slate-700 text-[11px]" title={row.cliente}>
                                                        {row.cliente.split('(')[0].trim()}
                                                    </span>
                                                    {row.cliente.includes('(') && (
                                                        <span className="text-[9px] text-slate-400 font-mono">
                                                            {row.cliente.split('(')[1].replace(')', '')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {(evolutionData?.columns || []).map((month) => {
                                            const val = row.values?.[month] || 0;
                                            const hasValue = val > 0;

                                            return (
                                                <td
                                                    key={month}
                                                    className={`px-3 py-3 text-right ${hasValue ? 'text-slate-700 font-bold' : 'text-slate-200'}`}
                                                    style={{
                                                        backgroundColor: hasValue ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                                                    }}
                                                >
                                                    {hasValue ? (filters.metrica === 'valor' ? formatCurrency(val) : formatNumber(val)) : '—'}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-right font-black text-blue-600 bg-blue-50/50 sticky right-0 z-10 border-l border-blue-100 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                                            {filters.metrica === 'valor' ? formatCurrency(row.total) : formatNumber(row.total)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={(evolutionData?.columns?.length || 12) + 2} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={36} className="text-slate-300" />
                                            <p className="text-slate-500 font-medium text-sm">Nenhum dado encontrado</p>
                                            <p className="text-slate-400 text-xs">Verifique os filtros selecionados</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                {evolutionData?.rows?.length > 50 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                        Exibindo 50 de {evolutionData.rows.length} clientes
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientesTab;

