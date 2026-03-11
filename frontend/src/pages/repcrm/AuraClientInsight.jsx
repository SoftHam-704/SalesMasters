import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    Users,
    TrendingUp,
    MapPin,
    Calendar,
    Package,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    UserCheck,
    UserMinus,
    Clock,
    Download,
    Eye,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { formatCurrency } from '@/utils/formatters';

const MetricCard = ({ title, value, subValue, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="bg-white/60 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative group"
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-stone-400 text-[10px] font-mono uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-3xl font-display font-bold text-stone-900 tracking-tight">{value}</h3>
                {subValue && <p className="text-stone-500 text-[10px] mt-2 font-light italic">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-lg bg-white shadow-sm text-stone-900 border border-stone-100 group-hover:scale-110 transition-transform`}>
                <Icon size={18} strokeWidth={1.5} />
            </div>
        </div>
    </motion.div>
);

const AuraClientInsight = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/repcrm-reports/client-insight'));
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Error fetching client insight:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = data.filter(client => {
        const matchesSearch = client.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.cidade?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || client.status_cliente === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExportExcel = () => {
        if (!filteredData || filteredData.length === 0) return;

        const exportData = filteredData.map(client => ({
            'Razão Social': client.razao_social,
            'Nome Fantasia': client.nome_fantasia,
            'Cidade': client.cidade,
            'UF': client.uf,
            'Vendedor': client.vendedor_nome,
            'Status': client.status_cliente === 'A' ? 'Ativo' : 'Inativo',
            'Faturamento': client.total_faturado,
            'Mix (SKUs)': client.total_skus,
            'Última Compra': client.data_ultima_compra ? new Date(client.data_ultima_compra).toLocaleDateString() : 'N/A',
            'Inatividade (Dias)': client.dias_inatividade
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Client Insight");
        XLSX.writeFile(wb, `client_insight_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const metrics = {
        totalClients: data.length,
        activeClients: data.filter(c => c.status_cliente === 'A').length,
        inactiveClients: data.filter(c => c.status_cliente === 'I').length,
        totalRevenue: data.reduce((acc, curr) => acc + parseFloat(curr.total_faturado), 0)
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-medium text-stone-900 tracking-tight flex items-center gap-3">
                        Client Insight <span className="text-stone-400 text-xs font-mono border border-stone-200 px-2 py-0.5 rounded-sm">v1.0</span>
                    </h1>
                    <p className="text-stone-500 text-sm font-light mt-1">Visão 360º e inteligência estratégica da carteira de clientes</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportExcel}
                        className="px-6 py-2 border border-stone-300 hover:bg-white transition-colors rounded-lg text-stone-900 font-mono text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-sm active:translate-y-0.5"
                    >
                        <Download size={14} /> Exportar
                    </button>
                    <button className="group relative px-6 py-2 bg-stone-900 overflow-hidden rounded-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 border border-stone-800">
                        <div className="absolute inset-0 w-full h-full bg-stone-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <span className="relative z-10 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 !text-white font-bold">
                            <Eye size={14} className="!text-white" /> Relatórios Avançados
                        </span>
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total de Clientes"
                    value={metrics.totalClients}
                    subValue="Base total cadastrada"
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Clientes Ativos"
                    value={metrics.activeClients}
                    subValue={`${((metrics.activeClients / metrics.totalClients) * 100).toFixed(1)}% de penetração`}
                    icon={UserCheck}
                    color="emerald"
                />
                <MetricCard
                    title="Clientes Inativos"
                    value={metrics.inactiveClients}
                    subValue="Atenção: Risco de Churn"
                    icon={UserMinus}
                    color="rose"
                />
                <MetricCard
                    title="Faturamento Total"
                    value={formatCurrency(metrics.totalRevenue)}
                    subValue="Acumulado histórico"
                    icon={TrendingUp}
                    color="amber"
                />
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Table Header/Toolbar */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por razão, fantasia ou cidade..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-stone-900 !text-white shadow-lg shadow-stone-200' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('A')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'A' ? 'bg-emerald-600 !text-white shadow-lg shadow-emerald-100' : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'}`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => setStatusFilter('I')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'I' ? 'bg-stone-400 !text-white shadow-lg shadow-stone-100' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'}`}
                            >
                                Inativos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente / Localização</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Vendedor</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Faturamento</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Mix (SKUs)</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Última Compra</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Inatividade</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence>
                                {filteredData.map((client, index) => (
                                    <motion.tr
                                        key={client.cliente_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{client.nome_fantasia || client.razao_social}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{client.cidade} - {client.uf}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Briefcase size={12} className="text-slate-500" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{client.vendedor_nome || 'Não Atribuído'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${client.status_cliente === 'A'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                }`}>
                                                {client.status_cliente === 'A' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(client.total_faturado)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg">
                                                <Package size={12} className="text-slate-500" />
                                                <span className="text-sm font-bold text-slate-700">{client.total_skus}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {client.data_ultima_compra ? new Date(client.data_ultima_compra).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.dias_inatividade !== null ? (
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className={client.dias_inatividade > 90 ? 'text-rose-500' : 'text-slate-400'} />
                                                        <span className={`text-xs font-bold ${client.dias_inatividade > 90 ? 'text-rose-600 font-black' : 'text-slate-600'}`}>
                                                            {client.dias_inatividade} dias
                                                        </span>
                                                    </div>
                                                    {client.dias_inatividade > 90 && (
                                                        <span className="text-[9px] text-rose-400 font-black uppercase tracking-tighter mt-0.5">Crítico</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold uppercase italic">Sem Histórico</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuraClientInsight;
