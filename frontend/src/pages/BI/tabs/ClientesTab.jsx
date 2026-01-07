import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    Info
} from 'lucide-react';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

// Formatters
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
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

const ClientesTab = ({ filters }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUf, setSelectedUf] = useState('Todos');

    useEffect(() => {
        const fetchClientData = async () => {
            setLoading(true);
            try {
                const params = {
                    ano: filters.ano,
                    mes: monthsMap[filters.mes] || 'Todos',
                    industryId: filters.industria !== 'Todos' ? filters.industria : null,
                    metrica: filters.metrica.toLowerCase(),
                    uf: selectedUf !== 'Todos' ? selectedUf : null
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
    }, [filters, selectedUf]);

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
        </div>
    );
};

export default ClientesTab;
